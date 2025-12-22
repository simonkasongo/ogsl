# catalogue/admin.py
from django.contrib import admin
from .models import Source, Organization, Dataset, Resource

@admin.register(Source)
class SourceAdmin(admin.ModelAdmin):
    list_display = ("title", "slug")
    search_fields = ("title","slug")

@admin.register(Organization)
class OrgAdmin(admin.ModelAdmin):
    list_display = ("title","name","source")
    list_filter = ("source",)
    search_fields = ("title","name")

@admin.register(Dataset)
class DatasetAdmin(admin.ModelAdmin):
    list_display = ("title","organization","source","metadata_modified")
    list_filter = ("source","theme")
    search_fields = ("title","name","notes")

@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ("dataset","format","name")
    list_filter = ("format",)
    search_fields = ("name","format","url")
