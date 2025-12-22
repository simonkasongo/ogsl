"""
Commande de moissonnage automatique depuis OpenGouv
Recherche et moissonne les N premiers datasets sans avoir besoin d'IDs
"""
import requests
from django.core.management.base import BaseCommand, CommandError
from django.utils.dateparse import parse_datetime
from catalogue.models import Source, Organization, Dataset, Resource

API_PACKAGE_SEARCH = "https://open.canada.ca/data/api/3/action/package_search"
API_PACKAGE_SHOW = "https://open.canada.ca/data/api/3/action/package_show"

def as_dt(s):
    try:
        return parse_datetime(s)
    except Exception:
        return None

def get_fr(package_json, field: str) -> str:
    """
    CKAN expose souvent des champs *_translated avec {'fr': ..., 'en': ...}.
    On privilégie le français si disponible.
    """
    translated = package_json.get(f"{field}_translated") or {}
    if isinstance(translated, dict):
        fr = (translated.get("fr") or "").strip()
        if fr:
            return fr
    return (package_json.get(field) or "").strip()

def upsert_dataset(package_json, source):
    """Crée ou met à jour un dataset dans la base de données"""
    org_json = package_json.get("organization") or {}
    org_title = ""
    if isinstance(org_json, dict):
        # Organisation: essayer title_translated.fr puis title
        tr = org_json.get("title_translated") or {}
        if isinstance(tr, dict):
            org_title = (tr.get("fr") or "").strip()
        if not org_title:
            org_title = (org_json.get("title") or "").strip()

    org, _ = Organization.objects.get_or_create(
        ckan_id=org_json.get("id") or "no-org",
        defaults={
            "name": org_json.get("name", "no-org"),
            "title": org_title or "Sans org.",
            "source": source,
        },
    )
    
    ds, created = Dataset.objects.update_or_create(
        ckan_id=package_json["id"],
        defaults={
            "name": package_json.get("name", ""),
            "title": get_fr(package_json, "title") or package_json.get("title", ""),
            "organization": org,
            "source": source,
            "notes": get_fr(package_json, "notes") or package_json.get("notes", ""),
            "theme": (package_json.get("theme") or "")[:120],
            "metadata_created": as_dt(package_json.get("metadata_created")),
            "metadata_modified": as_dt(package_json.get("metadata_modified")),
        },
    )
    
    # Créer ou mettre à jour les ressources
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
    
    return ds, created

class Command(BaseCommand):
    help = "Moissonne automatiquement N datasets depuis OpenGouv (par recherche)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--count",
            type=int,
            default=20,
            help="Nombre de datasets à moissonner (défaut: 20)"
        )
        parser.add_argument(
            "--query",
            type=str,
            default="",
            help="Terme de recherche optionnel (ex: 'environment', 'covid')"
        )
        parser.add_argument(
            "--theme",
            type=str,
            default="",
            help="Filtrer par thème (ex: 'health', 'environment')"
        )

    def handle(self, *args, **opts):
        count = opts["count"]
        query = opts["query"]
        theme = opts["theme"]
        
        # Créer ou récupérer la source
        source, _ = Source.objects.get_or_create(
            slug="opengouv",
            defaults={"title": "OpenGouv Canada"}
        )
        
        self.stdout.write(self.style.WARNING(f"\n🌾 Moissonnage automatique de {count} datasets..."))
        if query:
            self.stdout.write(f"   Recherche: '{query}'")
        if theme:
            self.stdout.write(f"   Thème: '{theme}'")
        self.stdout.write("")
        
        # Rechercher les datasets
        try:
            params = {
                "rows": count,
                "start": 0,
            }
            if query:
                params["q"] = query
            if theme:
                params["fq"] = f"theme:{theme}"
            
            self.stdout.write("📡 Recherche des datasets sur OpenGouv...")
            resp = requests.get(API_PACKAGE_SEARCH, params=params, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            
            if not data.get("success"):
                raise CommandError("Erreur lors de la recherche sur OpenGouv")
            
            results = data.get("result", {}).get("results", [])
            total_found = data.get("result", {}).get("count", 0)
            
            if not results:
                self.stdout.write(self.style.WARNING("❌ Aucun dataset trouvé pour la requête"))
                self.stdout.write(self.style.WARNING(f"   Requête: '{query}'"))
                self.stdout.write(self.style.WARNING(f"   Total disponible sur OpenGouv: {total_found}"))
                return
            
            self.stdout.write(self.style.SUCCESS(f"✅ {len(results)} datasets trouvés (sur {total_found} disponibles)\n"))
            
            # Moissonner chaque dataset
            created_count = 0
            updated_count = 0
            error_count = 0
            
            for i, package in enumerate(results, 1):
                dataset_id = package.get("id")
                dataset_title = package.get("title", "Sans titre")
                
                self.stdout.write(f"[{i}/{len(results)}] 📦 {dataset_title[:60]}...")
                
                try:
                    # Récupérer les détails complets du dataset
                    resp = requests.get(API_PACKAGE_SHOW, params={"id": dataset_id}, timeout=30)
                    resp.raise_for_status()
                    payload = resp.json()
                    
                    if not payload.get("success"):
                        raise Exception("CKAN API error")
                    
                    ds, created = upsert_dataset(payload["result"], source)
                    
                    if created:
                        created_count += 1
                        self.stdout.write(self.style.SUCCESS(f"      ✅ Créé: {ds.resources.count()} ressources"))
                    else:
                        updated_count += 1
                        self.stdout.write(self.style.SUCCESS(f"      🔄 Mis à jour: {ds.resources.count()} ressources"))
                    
                except Exception as e:
                    error_count += 1
                    self.stdout.write(self.style.ERROR(f"      ❌ Erreur: {str(e)[:80]}"))
            
            # Résumé
            self.stdout.write(self.style.SUCCESS(f"\n{'='*60}"))
            self.stdout.write(self.style.SUCCESS(f"✅ Moissonnage terminé!"))
            self.stdout.write(self.style.SUCCESS(f"{'='*60}"))
            self.stdout.write(f"   🆕 Créés: {created_count}")
            self.stdout.write(f"   🔄 Mis à jour: {updated_count}")
            if error_count > 0:
                self.stdout.write(self.style.WARNING(f"   ❌ Erreurs: {error_count}"))
            self.stdout.write(f"   📊 Total: {created_count + updated_count} datasets moissonnés")
            self.stdout.write("")
            
        except requests.exceptions.RequestException as e:
            raise CommandError(f"Erreur de connexion à OpenGouv: {e}")
        except Exception as e:
            raise CommandError(f"Erreur inattendue: {e}")

