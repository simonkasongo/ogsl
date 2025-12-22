from django.db import models

CKAN_ID_LEN = 36

class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        abstract = True

class Source(TimeStampedModel):

    slug = models.SlugField(max_length=50, unique=True)
    title = models.CharField(max_length=120)
    def __str__(self): return self.title

class Organization(TimeStampedModel):
    ckan_id = models.CharField(max_length=CKAN_ID_LEN, unique=True)
    name = models.CharField(max_length=255, db_index=True)
    title = models.CharField(max_length=512, blank=True)
    source = models.ForeignKey(Source, on_delete=models.PROTECT, related_name="orgs")
    def __str__(self): return self.title or self.name

class Dataset(TimeStampedModel):
    ckan_id = models.CharField(max_length=CKAN_ID_LEN, unique=True)
    name = models.CharField(max_length=255, db_index=True)
    title = models.CharField(max_length=512)
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, related_name="datasets")
    source = models.ForeignKey(Source, on_delete=models.PROTECT, related_name="datasets")
    notes = models.TextField(blank=True)
    theme = models.CharField(max_length=120, blank=True)
    metadata_created = models.DateTimeField(null=True, blank=True)
    metadata_modified = models.DateTimeField(null=True, blank=True)
    def __str__(self): return self.title

class Resource(TimeStampedModel):
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE, related_name="resources")
    ckan_id = models.CharField(max_length=CKAN_ID_LEN, unique=True)
    name = models.CharField(max_length=255, blank=True)
    format = models.CharField(max_length=40, db_index=True)
    url = models.URLField(max_length=1000)
    def __str__(self): return f"{self.format} — {self.name or self.ckan_id}"
