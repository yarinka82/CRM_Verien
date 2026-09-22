from django.urls import path

from .views import ExpenseViewSet, ExpenseOverviewView

urlpatterns = [
    path('overview/', ExpenseOverviewView.as_view()),
    path('', ExpenseViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('<int:pk>/', ExpenseViewSet.as_view({
        'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy',
    })),
]
