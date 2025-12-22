from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from catalogue.models import Dataset, Resource, Organization, Source
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ["id", "title", "name"]

class SourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Source
        fields = ["id", "slug", "title"]

class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = ["id", "ckan_id", "name", "format", "url"]

class DatasetSerializer(serializers.ModelSerializer):
    organization = OrganizationSerializer()
    source = SourceSerializer()
    resources = ResourceSerializer(many=True)

    class Meta:
        model = Dataset
        fields = [
            "id", "ckan_id", "name", "title", "theme",
            "metadata_created", "metadata_modified",
            "organization", "source", "resources",
        ]

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]
        read_only_fields = ["id"]

class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        required=True,
        validators=[
            UniqueValidator(queryset=User.objects.all(), message="Ce nom d'utilisateur est déjà utilisé.")
        ],
        error_messages={
            "blank": "Le nom d'utilisateur est requis.",
            "required": "Le nom d'utilisateur est requis.",
        },
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=6,
        error_messages={
            "blank": "Le mot de passe est requis.",
            "required": "Le mot de passe est requis.",
            "min_length": "Le mot de passe doit contenir au moins 6 caractères.",
        },
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        label="Confirmer le mot de passe",
        error_messages={
            "blank": "La confirmation du mot de passe est requise.",
            "required": "La confirmation du mot de passe est requise.",
        },
    )

    class Meta:
        model = User
        fields = ["username", "email", "password", "password2", "first_name", "last_name"]
        extra_kwargs = {
            "email": {
                "error_messages": {
                    "invalid": "Adresse courriel invalide.",
                }
            },
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Identifiants invalides.')
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Le nom d\'utilisateur et le mot de passe sont requis.')

