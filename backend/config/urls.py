from django.contrib import admin
from django.urls import path, include
from apps.members.views import home_view

urlpatterns = [
    path('', home_view),
    path('admin/', admin.site.urls),
    
    path('members/', include('apps.members.urls')),
    
    # JSON API
    path('api/', include('apps.users.urls')),
    path('api/members/', include('apps.members.api_urls')),
    path('api/payments/', include('apps.payments.urls')),
    path('api/expenses/', include('apps.expenses.urls')),
    path('api/', include('apps.documents.urls')),
]