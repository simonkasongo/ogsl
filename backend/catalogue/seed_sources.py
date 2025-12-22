from django.core.management.base import BaseCommand
from catalogue.models import Source

class Command(BaseCommand):
    help = "Crée la source OpenGouv si absente (idempotent)."

    def handle(self, *args, **kwargs):
        obj, created = Source.objects.get_or_create(slug="opengouv", defaults={"title": "OpenGouv"})
        msg = "créée" if created else "déjà présente"
        self.stdout.write(self.style.SUCCESS(f"Source {obj.slug} {msg}."))
