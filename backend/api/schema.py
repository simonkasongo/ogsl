import graphene
from graphene_django import DjangoObjectType
from django.db.models import Q
from catalogue.models import Dataset, Resource, Organization, Source

class SourceType(DjangoObjectType):
    class Meta:
        model = Source
        fields = ("id", "slug", "title")

class OrganizationType(DjangoObjectType):
    class Meta:
        model = Organization
        fields = ("id", "ckan_id", "name", "title", "source")

class ResourceType(DjangoObjectType):
    class Meta:
        model = Resource
        fields = ("id", "ckan_id", "name", "format", "url")

class DatasetType(DjangoObjectType):
    class Meta:
        model = Dataset
        fields = (
            "id", "ckan_id", "name", "title", "notes", "theme",
            "metadata_created", "metadata_modified",
            "organization", "source", "resources",
        )

class Query(graphene.ObjectType):
    # Listes
    sources = graphene.List(SourceType)
    organizations = graphene.List(OrganizationType, search=graphene.String())
    datasets = graphene.List(
        DatasetType,
        search=graphene.String(),
        theme=graphene.String(),
        fmt=graphene.String(name="format"),
        first=graphene.Int(),
        skip=graphene.Int(),
        order_by=graphene.String(), 
    )
    # Détails
    dataset = graphene.Field(DatasetType, id=graphene.Int(required=True))

    # Résolveurs
    def resolve_sources(self, info):
        return Source.objects.all().order_by("title")

    def resolve_organizations(self, info, search=None):
        qs = Organization.objects.select_related("source").order_by("title")
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(name__icontains=search))
        return qs

    def resolve_datasets(self, info, search=None, theme=None, fmt=None, first=None, skip=None, order_by=None):
        qs = (Dataset.objects
              .select_related("organization", "source")
              .prefetch_related("resources"))

        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(name__icontains=search) |
                Q(notes__icontains=search) |
                Q(theme__icontains=search)
            )
        if theme:
            qs = qs.filter(theme__icontains=theme)
        if fmt:
            qs = qs.filter(resources__format__iexact=fmt)

        qs = qs.order_by(order_by or "-metadata_modified", "title")

        if skip:
            qs = qs[skip:]
        if first:
            qs = qs[:first]
        return qs

    def resolve_dataset(self, info, id):
        return Dataset.objects.select_related("organization", "source").prefetch_related("resources").get(pk=id)

schema = graphene.Schema(query=Query)
