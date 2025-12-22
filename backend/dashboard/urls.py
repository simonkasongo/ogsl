from django.urls import path
from .views import home, datasets_page, sources_page, harvest_page, delete_dataset

urlpatterns = [
    path("", home, name="dashboard"),
    path("jeux/", datasets_page, name="datasets_page"),
    path("jeux/<int:pk>/delete/", delete_dataset, name="dataset_delete"),
    path("sources/", sources_page, name="sources"),
    path("moissonnage/", harvest_page, name="harvest"),
]
