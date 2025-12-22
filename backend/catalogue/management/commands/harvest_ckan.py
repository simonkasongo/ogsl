"""
Commande de moissonnage flexible pour les 4 catalogues CKAN
Usage: 
  python manage.py harvest_ckan --source opengouv --ids UUID1 UUID2
  python manage.py harvest_ckan --source donnees-quebec --search "environnement" --limit 10
"""
import requests
from django.core.management.base import BaseCommand, CommandError
from django.utils.dateparse import parse_datetime
from catalogue.models import Source, Organization, Dataset, Resource

# Configuration des APIs CKAN
CKAN_APIS = {
    'opengouv': 'https://open.canada.ca/data/api/3/action/',
    'canwin': 'https://canwin-datahub.ad.umanitoba.ca/api/3/action/',
    'donnees-quebec': 'https://www.donneesquebec.ca/recherche/api/3/action/',
    'borealis': 'https://borealisdata.ca/api/3/action/',
}

def as_dt(s):
    """Parse une date/heure"""
    try:
        return parse_datetime(s)
    except Exception:
        return None

def upsert_dataset(package_json, source):
    """Crée ou met à jour un dataset"""
    org_json = package_json.get("organization") or {}
    org, _ = Organization.objects.get_or_create(
        ckan_id=org_json.get("id") or "no-org",
        defaults={
            "name": org_json.get("name", "no-org"),
            "title": org_json.get("title", "Sans organisation"),
            "source": source,
        },
    )
    
    ds, _ = Dataset.objects.update_or_create(
        ckan_id=package_json["id"],
        defaults={
            "name": package_json.get("name", ""),
            "title": package_json.get("title", ""),
            "organization": org,
            "source": source,
            "notes": package_json.get("notes", ""),
            "theme": (package_json.get("theme") or "")[:120],
            "metadata_created": as_dt(package_json.get("metadata_created")),
            "metadata_modified": as_dt(package_json.get("metadata_modified")),
        },
    )
    
    # Gérer les ressources
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
    help = "Moissonne des datasets depuis les catalogues CKAN"

    def add_arguments(self, parser):
        parser.add_argument(
            '--source',
            type=str,
            required=True,
            choices=list(CKAN_APIS.keys()),
            help='Source CKAN à moissonner (opengouv, canwin, donnees-quebec, borealis)'
        )
        parser.add_argument(
            '--ids',
            nargs='+',
            help='Liste d\'UUIDs de datasets à moissonner'
        )
        parser.add_argument(
            '--search',
            type=str,
            help='Mot-clé de recherche pour trouver des datasets'
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=10,
            help='Nombre maximum de datasets à moissonner (avec --search)'
        )

    def handle(self, *args, **opts):
        source_slug = opts['source']
        api_base_url = CKAN_APIS[source_slug]
        
        self.stdout.write("=" * 80)
        self.stdout.write(self.style.SUCCESS(f"MOISSONNAGE : {source_slug.upper()}"))
        self.stdout.write("=" * 80)
        self.stdout.write(f"API : {api_base_url}")
        self.stdout.write("")
        
        # Récupérer ou créer la source
        source, created = Source.objects.get_or_create(
            slug=source_slug,
            defaults={"title": source_slug.replace('-', ' ').title()}
        )
        
        if created:
            self.stdout.write(self.style.WARNING(f"Source '{source.title}' creee"))
        
        # Mode 1 : Moissonnage par IDs
        if opts['ids']:
            self.harvest_by_ids(api_base_url, source, opts['ids'])
        
        # Mode 2 : Moissonnage par recherche
        elif opts['search']:
            self.harvest_by_search(api_base_url, source, opts['search'], opts['limit'])
        
        else:
            raise CommandError("Vous devez specifier --ids ou --search")

    def harvest_by_ids(self, api_base_url, source, ids):
        """Moissonne des datasets par leurs UUIDs"""
        self.stdout.write(f"Mode : Moissonnage par IDs ({len(ids)} datasets)")
        self.stdout.write("")
        
        success_count = 0
        error_count = 0
        
        for i, uid in enumerate(ids, 1):
            self.stdout.write(f"[{i}/{len(ids)}] Moissonnage de {uid}...")
            
            try:
                url = f"{api_base_url}package_show"
                resp = requests.get(url, params={"id": uid}, timeout=30)
                resp.raise_for_status()
                payload = resp.json()
                
                if not payload.get("success"):
                    raise CommandError(f"Erreur CKAN pour {uid}")
                
                ds = upsert_dataset(payload["result"], source)
                self.stdout.write(
                    self.style.SUCCESS(
                        f"  [OK] {ds.title} ({ds.resources.count()} ressources)"
                    )
                )
                success_count += 1
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  [ERREUR] {uid}: {str(e)}"))
                error_count += 1
            
            self.stdout.write("")
        
        self.stdout.write("=" * 80)
        self.stdout.write(f"Succes : {success_count} | Erreurs : {error_count}")
        self.stdout.write("=" * 80)

    def harvest_by_search(self, api_base_url, source, search_term, limit):
        """Moissonne des datasets par recherche"""
        self.stdout.write(f"Mode : Moissonnage par recherche")
        self.stdout.write(f"Terme : '{search_term}'")
        self.stdout.write(f"Limite : {limit} datasets")
        self.stdout.write("")
        
        try:
            # Rechercher les datasets
            url = f"{api_base_url}package_search"
            params = {
                "q": search_term,
                "rows": limit,
                "include_private": False
            }
            
            self.stdout.write("Recherche en cours...")
            resp = requests.get(url, params=params, timeout=30)
            resp.raise_for_status()
            payload = resp.json()
            
            if not payload.get("success"):
                raise CommandError("Erreur lors de la recherche CKAN")
            
            results = payload["result"]["results"]
            count = len(results)
            
            self.stdout.write(self.style.SUCCESS(f"Trouve : {count} datasets"))
            self.stdout.write("")
            
            if count == 0:
                self.stdout.write(self.style.WARNING("Aucun dataset trouve"))
                return
            
            # Moissonner chaque dataset trouvé
            success_count = 0
            for i, package in enumerate(results, 1):
                title = package.get("title", package.get("name", "Sans titre"))
                self.stdout.write(f"[{i}/{count}] {title}")
                
                try:
                    ds = upsert_dataset(package, source)
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"  [OK] {ds.resources.count()} ressources"
                        )
                    )
                    success_count += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"  [ERREUR] {str(e)}"))
                
                self.stdout.write("")
            
            self.stdout.write("=" * 80)
            self.stdout.write(f"Moissonnes avec succes : {success_count}/{count}")
            self.stdout.write("=" * 80)
            
        except Exception as e:
            raise CommandError(f"Erreur de recherche : {str(e)}")

