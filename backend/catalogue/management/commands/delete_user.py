from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token


class Command(BaseCommand):
    help = 'Supprime un utilisateur spécifique par son username ou son ID'

    def add_arguments(self, parser):
        parser.add_argument(
            'user_identifier',
            type=str,
            help='Username ou ID de l\'utilisateur à supprimer',
        )
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirme la suppression (requis pour exécuter)',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(
                self.style.ERROR(
                    '⚠️  ATTENTION: Cette commande va supprimer un utilisateur!\n'
                    'Pour confirmer, ajoutez le flag --confirm\n'
                    'Exemple: python manage.py delete_user username --confirm'
                )
            )
            return

        user_identifier = options['user_identifier']

        try:
            if user_identifier.isdigit():
                user = User.objects.get(id=int(user_identifier))
            else:
                user = User.objects.get(username=user_identifier)
        except User.DoesNotExist:
            raise CommandError(f'Utilisateur "{user_identifier}" introuvable')

        username = user.username
        email = user.email
        is_staff = user.is_staff
        is_superuser = user.is_superuser

        token_count = Token.objects.filter(user=user).count()

        self.stdout.write(self.style.WARNING(f'\nUtilisateur trouvé:'))
        self.stdout.write(f'  Username: {username}')
        self.stdout.write(f'  Email: {email}')
        self.stdout.write(f'  Staff: {is_staff}')
        self.stdout.write(f'  Superuser: {is_superuser}')
        self.stdout.write(f'  Tokens: {token_count}')

        if is_superuser:
            self.stdout.write(
                self.style.WARNING(
                    '\n⚠️  ATTENTION: Cet utilisateur est un superutilisateur!'
                )
            )

        Token.objects.filter(user=user).delete()
        self.stdout.write(self.style.SUCCESS(f'✓ {token_count} token(s) supprimé(s)'))

        user.delete()
        self.stdout.write(
            self.style.SUCCESS(f'\n✅ Utilisateur "{username}" supprimé avec succès!')
        )


