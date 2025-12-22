from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DatasetViewSet, OrganizationViewSet, SourceViewSet,
    register_view, login_view, profile_view, logout_view, harvest_view
)

router = DefaultRouter()
router.register(r"datasets", DatasetViewSet, basename="datasets")
router.register(r"organizations", OrganizationViewSet, basename="organizations")
router.register(r"sources", SourceViewSet, basename="sources")

urlpatterns = [
    path("", include(router.urls)),
    # Endpoints d'authentification
    path("auth/register/", register_view, name="auth-register"),
    path("auth/login/", login_view, name="auth-login"),
    path("auth/profile/", profile_view, name="auth-profile"),
    path("auth/logout/", logout_view, name="auth-logout"),
    # Endpoint de moissonnage
    path("harvest/", harvest_view, name="harvest"),
]
