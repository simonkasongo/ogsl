"""
Middleware CORS personnalisé pour permettre les requêtes du frontend
"""
from django.http import HttpResponse

class SimpleCorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Gérer les requêtes OPTIONS (preflight) directement
        if request.method == "OPTIONS":
            response = HttpResponse()
            response.status_code = 200
        else:
            response = self.get_response(request)
        
        # Ajouter les headers CORS à toutes les réponses
        origin = request.META.get('HTTP_ORIGIN', 'http://localhost:5175')
        response["Access-Control-Allow-Origin"] = origin
        response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-CSRFToken, X-Requested-With"
        response["Access-Control-Allow-Credentials"] = "true"
        response["Access-Control-Max-Age"] = "86400"  # Cache preflight pour 24h
        
        return response

