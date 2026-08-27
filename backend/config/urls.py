
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/members/', include('apps.members.urls')),
    path('api/payments/', include('apps.payments.urls')),
]