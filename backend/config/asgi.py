
import os

from django.core.asgi import get_asgi_application

# Installing the settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Creating an ASGI application
application = get_asgi_application()