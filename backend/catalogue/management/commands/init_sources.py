"""
Commande pour initialiser les 4 sources CKAN
Usage: python manage.py init_sources
"""
from django.core.management.base import BaseCommand
from catalogue.models import Source

# URLs des 4 catalogues CKAN ciblés
SOURCES = [
    {
        'slug': 'opengouv',
        'title': 'OpenGouv Canada',
        'api_url': 'https://open.canada.ca/data/api/3/action/',
        'description': 'Portail de données ouvertes du gouvernement du Canada'
    },
    {
        'slug': 'canwin',
        'title': 'CanWin',
        'api_url': 'https://canwin-datahub.ad.umanitoba.ca/api/3/action/',
        'description': 'Canadian Water Information Network'
    },
    {
        'slug': 'donnees-quebec',
        'title': 'Données Québec',
        'api_url': 'https://www.donneesquebec.ca/recherche/api/3/action/',
        'description': 'Portail de données ouvertes du gouvernement du Québec'
    },
    {
        'slug': 'borealis',
        'title': 'Borealis',
        'api_url': 'https://borealisdata.ca/api/3/action/',
        'description': 'Dépôt de données de recherche canadien'
    }
]

class Command(BaseCommand):
    help = "Initialise les 4 sources CKAN (OpenGouv, CanWin, Données Québec, Borealis)"

    def handle(self, *args, **kwargs):
        self.stdout.write("=" * 80)
        self.stdout.write(self.style.SUCCESS("Initialisation des sources CKAN"))
        self.stdout.write("=" * 80)
        self.stdout.write("")
        
        created_count = 0
        updated_count = 0
        
        for source_data in SOURCES:
            source, created = Source.objects.get_or_create(
                slug=source_data['slug'],
                defaults={
                    'title': source_data['title']
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f"[OK] Source creee : {source.title} ({source.slug})"
                    )
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(
                        f"[INFO] Source existe deja : {source.title} ({source.slug})"
                    )
                )
            
            self.stdout.write(f"      URL API : {source_data['api_url']}")
            self.stdout.write(f"      Description : {source_data['description']}")
            self.stdout.write("")
        
        self.stdout.write("=" * 80)
        self.stdout.write(f"Total : {len(SOURCES)} sources")
        self.stdout.write(f"  - Nouvelles : {created_count}")
        self.stdout.write(f"  - Existantes : {updated_count}")
        self.stdout.write("=" * 80)
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Initialisation terminee !"))

