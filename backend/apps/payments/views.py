from datetime import date

from django.db.models import Sum
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Payment
from .serializers import (
    FinancialOverviewSerializer,
    PaymentListSerializer,
    PaymentSerializer,
)


class PaymentViewSet(viewsets.ModelViewSet):
    """
    CRUD для платежів/надходжень.

    Фільтри через query-параметри, наприклад:
    /api/payments/?type=membership_fee
    /api/payments/?member=3
    /api/payments/?status=owed
    /api/payments/?date_after=2026-01-01&date_before=2026-12-31
    """

    queryset = Payment.objects.select_related("member").all()

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ["type", "status", "member"]
    ordering_fields = ["date", "amount", "created_at"]
    ordering = ["-date"]
    search_fields = ["source_name", "comment", "member__first_name", "member__last_name"]

    def get_serializer_class(self):
        if self.action == "list":
            return PaymentListSerializer
        return PaymentSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        date_after = self.request.query_params.get("date_after")
        date_before = self.request.query_params.get("date_before")
        if date_after:
            qs = qs.filter(date__gte=date_after)
        if date_before:
            qs = qs.filter(date__lte=date_before)
        return qs


class FinancialOverviewView(APIView):
    """
    GET /api/payments/overview/?date_from=2026-01-01&date_to=2026-12-31

    Повертає:
    - загальну суму надходжень за обраний період
    - розбивку по типах (внески / пожертви / спонсори / гранти)
    - кількість записів

    Якщо date_from / date_to не передані — беремо з початку поточного року
    по сьогодні.
    """

    def get(self, request):
        today = date.today()
        date_from = request.query_params.get("date_from", date(today.year, 1, 1))
        date_to = request.query_params.get("date_to", today)

        qs = Payment.objects.filter(date__gte=date_from, date__lte=date_to)

        total = qs.aggregate(total=Sum("amount"))["total"] or 0
        count = qs.count()

        by_type = {}
        for type_key, type_label in Payment.PaymentType.choices:
            type_sum = qs.filter(type=type_key).aggregate(s=Sum("amount"))["s"] or 0
            by_type[type_key] = type_sum

        data = {
            "date_from": date_from,
            "date_to": date_to,
            "total": total,
            "by_type": by_type,
            "count": count,
        }

        serializer = FinancialOverviewSerializer(data)
        return Response(serializer.data)