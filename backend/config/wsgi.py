import os
from django.core.wsgi import get_wsgi_application

# If settings.py is root backend
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')

# Or if in the backend folder
# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

application = get_wsgi_application()