from django.urls import path, include
from rest_framework.routers import SimpleRouter
from . import views

router = SimpleRouter()
router.register(r'', views.UserViewSet, basename='user')

urlpatterns = [
    # auth
    path('auth/login/', views.login_view, name='auth-login'),
    path('auth/logout/', views.logout_view, name='auth-logout'),
    path('auth/me/', views.me_view, name='auth-me'),
    path('auth/change-password/', views.change_password_view, name='auth-change-password'),
    
    # user management (staff only)
    path('users/', include(router.urls)),
]