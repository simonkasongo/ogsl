from rest_framework import viewsets, filters, status, mixins
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from catalogue.models import Dataset, Organization, Source
from .serializers import (
    DatasetSerializer, OrganizationSerializer, SourceSerializer,
    RegisterSerializer, LoginSerializer, UserSerializer
)

class DatasetViewSet(mixins.DestroyModelMixin, viewsets.ReadOnlyModelViewSet):
    queryset = Dataset.objects.select_related("organization", "source").prefetch_related("resources")
    serializer_class = DatasetSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "name", "notes", "theme"]
    ordering_fields = ["metadata_modified", "title"]
    ordering = ["-metadata_modified", "title"]
    http_method_names = ["get", "delete", "head", "options"]

class OrganizationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Organization.objects.all().order_by("title")
    serializer_class = OrganizationSerializer

class SourceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Source.objects.all().order_by("title")
    serializer_class = SourceSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        user_data = UserSerializer(user).data
        return Response({
            'token': token.key,
            'user': user_data,
            'message': 'Inscription réussie'
        }, status=status.HTTP_201_CREATED)
    return Response({
        "message": "Erreur de validation",
        "errors": serializer.errors,
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        user_data = UserSerializer(user).data
        return Response({
            'token': token.key,
            'user': user_data,
            'message': 'Connexion réussie'
        }, status=status.HTTP_200_OK)
    return Response({
        "message": "Identifiants invalides",
        "errors": serializer.errors,
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    user = request.user
    
    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        request.user.auth_token.delete()
        return Response({'message': 'Déconnexion réussie'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def harvest_view(request):
    from django.core.management import call_command
    
    source = request.data.get("source", "opengouv")
    count = request.data.get("count", 5)
    keywords = (request.data.get("keywords", "") or "").strip()
    query = (request.data.get("query", "") or "").strip()
    
    if source not in ["opengouv", "", None]:
        return Response({
            "message": "Source invalide. Dans ce TP, seule la source 'opengouv' est supportée."
        }, status=status.HTTP_400_BAD_REQUEST)

    saint_laurent_filter = "Saint-Laurent"

    if not query and keywords:
        keyword_list = [k.strip() for k in keywords.split(",") if k.strip()]
        if keyword_list:
            query = " ".join(keyword_list)

    if query:
        query = f"{saint_laurent_filter} {query}"
    else:
        query = saint_laurent_filter
    
    try:
        from catalogue.models import Dataset as DatasetModel
        before_count = DatasetModel.objects.count()

        call_command("harvest_auto", count=count, query=query)

        after_count = DatasetModel.objects.count()
        created = max(0, after_count - before_count)
        
        message = "Moissonnage terminé pour OpenGouv Canada"
        if created == 0:
            message += " — Aucun nouveau dataset ajouté"
            message += " (les datasets trouvés étaient peut-être déjà présents ou aucune correspondance pour cette requête)"
        
        return Response({
            "message": message,
            "source": "opengouv",
            "count": count,
            "query": query,
            "created": created,
            "success": True,
        }, status=status.HTTP_200_OK)
            
    except Exception as e:
        return Response({
            "message": f"Erreur lors du moissonnage: {str(e)}",
            "success": False,
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
