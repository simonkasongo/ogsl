"""
Commande de moissonnage multi-sources CKAN
Supporte: OpenGouv, CanWin, Données Québec, Borealis
"""
import requests
from django.core.management.base import BaseCommand, CommandError
from django.utils.dateparse import parse_datetime
from catalogue.models import Source, Organization, Dataset, Resource

# Configuration des sources CKAN
CKAN_SOURCES = {
    'opengouv': {
        'title': 'OpenGouv Canada',
        'api_base': 'https://open.canada.ca/data/api/3/action',
        'description': 'Données ouvertes du gouvernement du Canada'
    },
    'canwin': {
        'title': 'CanWIN - Canadian Watershed Information Network',
        'api_base': 'https://cwn-rce.ca/api/3/action',
        'description': 'Réseau canadien d\'information sur les bassins versants'
    },
    'donneesquebec': {
        'title': 'Données Québec',
        'api_base': 'https://www.donneesquebec.ca/recherche/api/3/action',
        'description': 'Portail de données ouvertes du gouvernement du Québec'
    },
    'borealis': {
        'title': 'Borealis',
        'api_base': 'https://borealisdata.ca/api/3/action',
        'description': 'Dépôt de données de recherche canadien'
    }
}

def as_dt(s):
    """Convertir une chaîne en datetime"""
    try:
        return parse_datetime(s)
    except Exception:
        return None

def upsert_dataset(package_json, source):
    """Crée ou met à jour un dataset dans la base de données"""
    # Organisation
    org_json = package_json.get("organization") or {}
    org, _ = Organization.objects.get_or_create(
        ckan_id=org_json.get("id") or "no-org",
        defaults={
            "name": org_json.get("name", "no-org"),
            "title": org_json.get("title", "Sans organisation"),
            "source": source,
        },
    )
    
    # Dataset
    # Extraire le thème (peut varier selon la source)
    theme = ""
    if "theme" in package_json:
        theme = package_json["theme"]
    elif "groups" in package_json and package_json["groups"]:
        theme = package_json["groups"][0].get("title", "")
    
    ds, created = Dataset.objects.update_or_create(
        ckan_id=package_json["id"],
        defaults={
            "name": package_json.get("name", ""),
            "title": package_json.get("title", ""),
            "organization": org,
            "source": source,
            "notes": package_json.get("notes", ""),
            "theme": theme[:120] if theme else "",
            "metadata_created": as_dt(package_json.get("metadata_created")),
            "metadata_modified": as_dt(package_json.get("metadata_modified")),
        },
    )
    
    # Ressources
    resource_count = 0
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
        resource_count += 1
    
    return ds, created, resource_count

class Command(BaseCommand):
    help = "Moissonne des datasets depuis plusieurs sources CKAN (OpenGouv, CanWin, Données Québec, Borealis)"

    def add_arguments(self, parser):
        parser.add_argument(
            '--source',
            type=str,
            choices=['opengouv', 'canwin', 'donneesquebec', 'borealis', 'all'],
            default='opengouv',
            help='Source CKAN à moissonner (défaut: opengouv)'
        )
        parser.add_argument(
            '--count',
            type=int,
            default=20,
            help='Nombre de datasets à moissonner par source (défaut: 20)'
        )
        parser.add_argument(
            '--query',
            type=str,
            default='',
            help='Terme de recherche optionnel'
        )
        parser.add_argument(
            '--keywords',
            type=str,
            default='',
            help='Mots-clés pour filtrer (séparés par des virgules)'
        )

    def handle(self, *args, **opts):
        source_key = opts['source']
        count = opts['count']
        query = opts['query']
        keywords = opts['keywords']
        
        self.stdout.write(self.style.WARNING("\n" + "="*70))
        self.stdout.write(self.style.WARNING("🌾 MOISSONNAGE MULTI-SOURCES CKAN"))
        self.stdout.write(self.style.WARNING("="*70 + "\n"))
        
        # Déterminer les sources à moissonner
        sources_to_harvest = [source_key] if source_key != 'all' else list(CKAN_SOURCES.keys())
        
        total_created = 0
        total_updated = 0
        total_errors = 0
        
        for src_key in sources_to_harvest:
            self.stdout.write(self.style.WARNING(f"\n📡 Source: {CKAN_SOURCES[src_key]['title']}"))
            self.stdout.write(f"   URL: {CKAN_SOURCES[src_key]['api_base']}")
            self.stdout.write("")
            
            try:
                created, updated, errors = self.harvest_source(
                    src_key, 
                    CKAN_SOURCES[src_key],
                    count,
                    query,
                    keywords
                )
                total_created += created
                total_updated += updated
                total_errors += errors
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"   ❌ Erreur fatale: {str(e)}\n"))
                total_errors += 1
        
        # Résumé global
        self.stdout.write(self.style.SUCCESS("\n" + "="*70))
        self.stdout.write(self.style.SUCCESS("✅ MOISSONNAGE TERMINÉ"))
        self.stdout.write(self.style.SUCCESS("="*70))
        self.stdout.write(f"   🆕 Total créés: {total_created}")
        self.stdout.write(f"   🔄 Total mis à jour: {total_updated}")
        if total_errors > 0:
            self.stdout.write(self.style.WARNING(f"   ❌ Total erreurs: {total_errors}"))
        self.stdout.write(f"   📊 Total datasets: {total_created + total_updated}")
        self.stdout.write("")

    def harvest_source(self, source_key, source_config, count, query, keywords):
        """Moissonne une source CKAN spécifique"""
        
        # Créer ou récupérer la source dans la DB
        source, _ = Source.objects.get_or_create(
            slug=source_key,
            defaults={"title": source_config['title']}
        )
        
        api_base = source_config['api_base']
        package_search_url = f"{api_base}/package_search"
        package_show_url = f"{api_base}/package_show"
        
        # Préparer les paramètres de recherche
        params = {
            "rows": count,
            "start": 0,
        }
        
        if query:
            params["q"] = query
        
        if keywords:
            # Ajouter les mots-clés au filtre
            kw_list = [k.strip() for k in keywords.split(',')]
            params["q"] = " OR ".join(kw_list)
        
        # Rechercher les datasets
        try:
            self.stdout.write("   📡 Recherche des datasets...")
            resp = requests.get(package_search_url, params=params, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            
            if not data.get("success"):
                self.stdout.write(self.style.ERROR("   ❌ L'API a retourné success=false"))
                return 0, 0, 1
            
            results = data.get("result", {}).get("results", [])
            total_available = data.get("result", {}).get("count", 0)
            
            if not results:
                self.stdout.write(self.style.WARNING("   ⚠️  Aucun dataset trouvé"))
                return 0, 0, 0
            
            self.stdout.write(self.style.SUCCESS(f"   ✅ {len(results)} datasets trouvés (sur {total_available} disponibles)\n"))
            
        except requests.exceptions.Timeout:
            self.stdout.write(self.style.ERROR("   ❌ Timeout lors de la connexion à l'API"))
            return 0, 0, 1
        except requests.exceptions.RequestException as e:
            self.stdout.write(self.style.ERROR(f"   ❌ Erreur de connexion: {str(e)[:80]}"))
            return 0, 0, 1
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"   ❌ Erreur lors de la recherche: {str(e)[:80]}"))
            return 0, 0, 1
        
        # Moissonner chaque dataset
        created_count = 0
        updated_count = 0
        error_count = 0
        
        for i, package in enumerate(results, 1):
            dataset_id = package.get("id")
            dataset_title = package.get("title", "Sans titre")
            
            self.stdout.write(f"   [{i}/{len(results)}] 📦 {dataset_title[:50]}...")
            
            try:
                # Récupérer les détails complets
                resp = requests.get(package_show_url, params={"id": dataset_id}, timeout=30)
                resp.raise_for_status()
                payload = resp.json()
                
                if not payload.get("success"):
                    raise Exception("API returned success=false")
                
                ds, created, res_count = upsert_dataset(payload["result"], source)
                
                if created:
                    created_count += 1
                    self.stdout.write(self.style.SUCCESS(f"        ✅ Créé ({res_count} ressources)"))
                else:
                    updated_count += 1
                    self.stdout.write(self.style.SUCCESS(f"        🔄 Mis à jour ({res_count} ressources)"))
                
            except requests.exceptions.Timeout:
                error_count += 1
                self.stdout.write(self.style.ERROR(f"        ❌ Timeout"))
            except Exception as e:
                error_count += 1
                error_msg = str(e)[:60]
                self.stdout.write(self.style.ERROR(f"        ❌ {error_msg}"))
        
        return created_count, updated_count, error_count

