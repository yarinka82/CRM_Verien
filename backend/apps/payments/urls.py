# from django.urls import path
# from . import views
#
# app_name = 'payments'
#
# urlpatterns = [
#     # Добавьте свои URL-ы здесь
#     # Например:
#     # path('', views.payment_list, name='payment_list'),
#     # path('<int:pk>/', views.payment_detail, name='payment_detail'),
# ]

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import FinancialOverviewView, PaymentViewSet

router = DefaultRouter()
router.register(r"payments", PaymentViewSet, basename="payment")

urlpatterns = [
    # ВАЖНО: overview должен идти ДО include(router.urls),
    # иначе DRF-роутер попытается воспринять "overview" как pk у /payments/<pk>/
    path("payments/overview/", FinancialOverviewView.as_view(), name="payments-overview"),
    path("", include(router.urls)),
]