from django.shortcuts import render, redirect
from django.db.models import Q, Count, F, Value, CharField
from django.db.models.functions import TruncMonth, Coalesce
from django.contrib import messages
from django.core.management import call_command
from django.core.paginator import Paginator
from catalogue.models import Dataset, Resource, Organization, Source
from datetime import date
from collections import Counter
from urllib.parse import urlparse
from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.http import require_POST
import re


@require_POST
def delete_dataset(request, pk: int):
    ds = get_object_or_404(Dataset, pk=pk)
    title = ds.title or ds.name
    ds.delete()
    messages.success(request, f"« {title} » a été supprimé.")
    next_url = request.POST.get("next") or request.META.get("HTTP_REFERER") or "/jeux/"
    return redirect(next_url)


def _last_12_months_labels():
    today = date.today()
    y, m = today.year, today.month
    months = []
    for _ in range(12):
        months.append((y, m))
        m -= 1
        if m == 0:
            m = 12
            y -= 1
    months.reverse()
    return months


def _categorize_format(fmt: str) -> str:
    if not fmt:
        return "Autre"
    f = str(fmt).strip().upper()
    tab = {"CSV", "TSV", "XLS", "XLSX"}
    geo_files = {"SHP", "GPKG", "GEOJSON", "KML", "KMZ"}
    services = {"WMS", "WFS", "WCS", "API"}
    docs = {"PDF"}
    if f in tab:
        return "Tabulaire"
    if f in geo_files:
        return "Géospatial (fichiers)"
    if f in services or "SERVICE" in f or "OGC" in f or "REST" in f:
        return "Services & API"
    if f in docs:
        return "Document"
    return "Autre"

def home(request):
    total_datasets = Dataset.objects.count()
    total_resources = Resource.objects.count()

    monthly_qs = (
        Dataset.objects
        .annotate(m=TruncMonth(Coalesce("metadata_modified", "metadata_created")))
        .values("m")
        .annotate(count=Count("id"))
        .order_by("m")
    )
    month_map = {(row["m"].year, row["m"].month): row["count"] for row in monthly_qs if row["m"]}

    last12 = _last_12_months_labels()
    by_month = []
    for y, m in last12:
        lbl = f"{y}-{m:02d}"
        by_month.append({"label": lbl, "count": month_map.get((y, m), 0)})

    res_counts = Dataset.objects.annotate(rc=Count("resources")).values_list("rc", flat=True)
    buckets = {"1": 0, "2": 0, "3": 0, "4+": 0}
    for rc in res_counts:
        if rc is None or rc <= 1:
            buckets["1"] += 1
        elif rc == 2:
            buckets["2"] += 1
        elif rc == 3:
            buckets["3"] += 1
        else:
            buckets["4+"] += 1
    res_dist = [{"label": k, "count": v} for k, v in buckets.items()]

    hosts = Counter()
    for u in Resource.objects.values_list("url", flat=True):
        try:
            h = (urlparse(u).hostname or "").lower()
        except Exception:
            h = ""
        if h:
            hosts[h] += 1
    top_hosts = [{"label": host, "count": c} for host, c in hosts.most_common(10)]

    cat_counter = Counter()
    for f in Resource.objects.values_list("format", flat=True):
        cat_counter[_categorize_format(f)] += 1
    format_groups = [{"label": k, "count": v} for k, v in cat_counter.most_common()]

    ctx = {
        "total_datasets": total_datasets,
        "total_resources": total_resources,
        "by_month": by_month,
        "res_dist": res_dist,
        "top_hosts": top_hosts,
        "format_groups": format_groups,
    }
    return render(request, "dashboard/home.html", ctx)


def datasets_page(request):
    q = (request.GET.get("q") or "").strip()
    theme = (request.GET.get("theme") or "").strip()
    fmt = (request.GET.get("format") or "").strip()

    qs = (
        Dataset.objects
        .select_related("organization", "source")
        .prefetch_related("resources")
        .order_by(Coalesce("metadata_modified", "metadata_created").desc(), "title")
    )

    if q:
        qs = qs.filter(
            Q(title__icontains=q) |
            Q(name__icontains=q) |
            Q(notes__icontains=q)
        )
    if theme:
        qs = qs.filter(theme__icontains=theme)
    if fmt:
        qs = qs.filter(resources__format__iexact=fmt).distinct()

    paginator = Paginator(qs, 20)
    page_obj = paginator.get_page(request.GET.get("page"))

    formats = Resource.objects.values_list("format", flat=True).distinct().order_by("format")

    ctx = {"page_obj": page_obj, "q": q, "theme": theme, "format": fmt, "formats": formats}
    return render(request, "dashboard/datasets.html", ctx)


def sources_page(request):
    sources = Source.objects.annotate(n=Count("datasets")).order_by("-n", "title")
    return render(request, "dashboard/sources.html", {"sources": sources})


UUID_RE = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", re.I)

def harvest_page(request):
    if request.method == "POST":
        raw = (request.POST.get("uuids") or request.POST.get("uuid") or "").strip()
        chunks = re.split(r"[\s,]+", raw)
        ids, seen = [], set()
        for s in chunks:
            if not s:
                continue
            m = UUID_RE.search(s)
            if m:
                u = m.group(0).lower()
                if u not in seen:
                    ids.append(u)
                    seen.add(u)

        if not ids:
            messages.error(
                request,
                "Aucun UUID CKAN détecté. Collez une URL API JSON OpenGouv, une URL de dataset, ou un UUID."
            )
            return redirect("harvest")

        try:
            call_command("harvest_opengouv", ids=ids)
            messages.success(request, f"Moissonnage terminé ({len(ids)} élément(s)).")
            return redirect("dashboard")
        except Exception as e:
            messages.error(request, f"Échec du moissonnage : {e}")
            return redirect("harvest")

    return render(request, "dashboard/harvest.html")
