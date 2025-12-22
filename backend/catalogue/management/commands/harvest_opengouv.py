import re
import requests
from django.core.management.base import BaseCommand, CommandError
from django.utils.dateparse import parse_datetime
from catalogue.models import Source, Organization, Dataset, Resource

API_PACKAGE_SHOW = "https://open.canada.ca/data/api/3/action/package_show"
UUID_RE = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", re.I)

def normalize_ids(values):
    out, seen = [], set()
    for v in values or []:
        m = UUID_RE.search(v)
        if m:
            u = m.group(0).lower()
            if u not in seen:
                out.append(u); seen.add(u)
    return out

def as_dt(s):
    try: return parse_datetime(s)
    except Exception: return None

def upsert_dataset(package_json, source):
    org_json = package_json.get("organization") or {}
    org, _ = Organization.objects.get_or_create(
        ckan_id=org_json.get("id") or "no-org",
        defaults={
            "name": org_json.get("name", "no-org"),
            "title": org_json.get("title", "Sans org."),
            "source": source,
        },
    )
    ds, _ = Dataset.objects.update_or_create(
        ckan_id=package_json["id"],
        defaults={
            "name": package_json.get("name",""),
            "title": package_json.get("title",""),
            "organization": org,
            "source": source,
            "notes": package_json.get("notes",""),
            "theme": (package_json.get("theme") or "")[:120],
            "metadata_created": as_dt(package_json.get("metadata_created")),
            "metadata_modified": as_dt(package_json.get("metadata_modified")),
        },
    )
    for r in package_json.get("resources", []):
        fmt = (r.get("format") or "OTHER").upper()[:40]
        Resource.objects.update_or_create(
            ckan_id=r["id"],
            defaults={
                "dataset": ds,
                "name": (r.get("name") or "")[:255],
                "format": fmt,
                "url": (r.get("url") or "")[:1000],
            },
        )
    return ds

class Command(BaseCommand):
    help = "Moissonne 1..N datasets OpenGouv (CKAN) par UUID ou URLs."

    def add_arguments(self, parser):
        parser.add_argument("--ids", nargs="+", required=True, help="Liste d'UUIDs CKAN ou URLs package_show")

    def handle(self, *args, **opts):
        source, _ = Source.objects.get_or_create(slug="opengouv", defaults={"title": "OpenGouv"})
        ids = normalize_ids(opts["ids"])
        if not ids:
            raise CommandError("Aucun UUID valide détecté.")

        for uid in ids:
            self.stdout.write(f"→ Fetch {uid}")
            try:
                resp = requests.get(API_PACKAGE_SHOW, params={"id": uid}, timeout=30)
                resp.raise_for_status()
                payload = resp.json()
                if not payload.get("success"):
                    raise CommandError(f"CKAN error for {uid}")
                ds = upsert_dataset(payload["result"], source)
                self.stdout.write(self.style.SUCCESS(f"OK: {ds.title} ({ds.resources.count()} ressources)"))
            except Exception as e:
                raise CommandError(f"{uid}: {e}") from e


API_PACKAGE_SHOW = "https://open.canada.ca/data/en/api/3/action/package_show"

def as_dt(s):
    try: return parse_datetime(s)
    except Exception: return None

def upsert_dataset(package_json, source):
    org_json = package_json.get("organization") or {}
    org, _ = Organization.objects.get_or_create(
        ckan_id=org_json.get("id") or "no-org",
        defaults={
            "name": org_json.get("name", "no-org"),
            "title": org_json.get("title", "Sans org."),
            "source": source,
        },
    )
    ds, _ = Dataset.objects.update_or_create(
        ckan_id=package_json["id"],
        defaults={
            "name": package_json.get("name",""),
            "title": package_json.get("title",""),
            "organization": org,
            "source": source,
            "notes": package_json.get("notes",""),
            "theme": (package_json.get("theme") or "")[:120],
            "metadata_created": as_dt(package_json.get("metadata_created")),
            "metadata_modified": as_dt(package_json.get("metadata_modified")),
        },
    )
    seen = set()
    for r in package_json.get("resources", []):
        fmt = (r.get("format") or "OTHER").upper()[:40]
        res, _ = Resource.objects.update_or_create(
            ckan_id=r["id"],
            defaults={
                "dataset": ds,
                "name": r.get("name","")[:255],
                "format": fmt,
                "url": r.get("url","")[:1000],
            },
        )
        seen.add(res.ckan_id)
    return ds

class Command(BaseCommand):
    help = "Moissonne 1..N datasets OpenGouv (CKAN) par UUID"

    def add_arguments(self, parser):
        parser.add_argument("--ids", nargs="+", required=True, help="UUID CKAN du dataset")

    def handle(self, *args, **opts):
        source, _ = Source.objects.get_or_create(slug="opengouv", defaults={"title": "OpenGouv"})
        for uid in opts["ids"]:
            self.stdout.write(f"→ Fetch {uid}")
            try:
                resp = requests.get(API_PACKAGE_SHOW, params={"id": uid}, timeout=30)
                resp.raise_for_status()
                payload = resp.json()
                if not payload.get("success"):
                    raise CommandError(f"CKAN error for {uid}")
                ds = upsert_dataset(payload["result"], source)
                self.stdout.write(self.style.SUCCESS(f"OK: {ds.title} ({ds.resources.count()} ressources)"))
            except Exception as e:
                raise CommandError(f"{uid}: {e}") from e
