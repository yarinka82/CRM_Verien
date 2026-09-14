from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from django.db.models.functions import TruncMonth, TruncQuarter
from django.utils.dateparse import parse_date
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Payment
from .serializers import PaymentSerializer



class PaymentViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def _get_queryset(self):
        return Payment.objects.select_related('member').all()

    def _filter_queryset(self, qs, request):
        params = request.query_params

        payment_type = params.get('type')
        if payment_type:
            qs = qs.filter(type=payment_type)

        payer_type = params.get('payer_type')
        if payer_type:
            qs = qs.filter(payer_type=payer_type)

        member_id = params.get('member')
        if member_id:
            qs = qs.filter(member_id=member_id)

        date_from = parse_date(params.get('date_from', '') or '')
        if date_from:
            qs = qs.filter(date__gte=date_from)

        date_to = parse_date(params.get('date_to', '') or '')
        if date_to:
            qs = qs.filter(date__lte=date_to)

        return qs

    def list(self, request):
        qs = self._filter_queryset(self._get_queryset(), request)
        serializer = PaymentSerializer(qs, many=True)
        return Response(serializer.data)

    def create(self, request):
        serializer = PaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        payment = self._get_queryset().filter(pk=pk).first()
        if payment is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(PaymentSerializer(payment).data)

    def update(self, request, pk=None):
        payment = self._get_queryset().filter(pk=pk).first()
        if payment is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = PaymentSerializer(payment, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        payment = self._get_queryset().filter(pk=pk).first()
        if payment is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = PaymentSerializer(payment, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def destroy(self, request, pk=None):
        payment = self._get_queryset().filter(pk=pk).first()
        if payment is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        payment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



class FinancialOverviewView(APIView):
    """Financial Overview page: total revenue for the period,
    breakdown by types, by type of payer (individual/subcontractor/other)
    and by periods (months and quarters) — for dynamics graphs.

    Debt (owed) cleared — each Payment record is a fact
    completed receipt, the status is no more.

    GET /api/financial-overview/?date_from=2026-01-01&date_to=2026-12-31
    Without parameters — all the time."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Payment.objects.all()

        date_from = parse_date(request.query_params.get('date_from', '') or '')
        if date_from:
            qs = qs.filter(date__gte=date_from)

        date_to = parse_date(request.query_params.get('date_to', '') or '')
        if date_to:
            qs = qs.filter(date__lte=date_to)

        total = qs.aggregate(total=Sum('amount'))['total'] or 0

        # --- breakdown by receipt type ---
        by_type = {
            row['type']: row['total']
            for row in qs.values('type').annotate(total=Sum('amount'))
        }
        breakdown = [
            {
                'type': value,
                'type_display': str(label),
                'total': by_type.get(value, 0),
            }
            for value, label in Payment.PaymentType.choices
        ]

        # --- breakdown by payer type (individual/subcontractor/other) ---
        by_payer_type = {
            row['payer_type']: row['total']
            for row in qs.values('payer_type').annotate(total=Sum('amount'))
        }
        payer_breakdown = [
            {
                'payer_type': value,
                'payer_type_display': str(label),
                'total': by_payer_type.get(value, 0),
            }
            for value, label in Payment.PayerType.choices
        ]

        # --- breakdown by months (for the "per year" chart) ---
        # NB: the annotation cannot be called "period" — this is the name of the Payment model field.
        by_month_qs = (
            qs
            .annotate(month=TruncMonth('date'))
            .values('month')
            .annotate(total=Sum('amount'))
            .order_by('month')
        )
        by_period = [
            {
                'period': row['month'].strftime('%Y-%m') if row['month'] else None,
                'total': row['total'],
            }
            for row in by_month_qs
        ]

        # --- breakdown by quarters (for the chart "by quarters") ---
        by_quarter_qs = (
            qs
            .annotate(quarter=TruncQuarter('date'))
            .values('quarter')
            .annotate(total=Sum('amount'))
            .order_by('quarter')
        )
        by_period_quarterly = [
            {
                # TruncQuarter returns the first day of the quarter — we count the quarter number from the month
                'period': f"{row['quarter'].year}-Q{(row['quarter'].month - 1) // 3 + 1}" if row['quarter'] else None,
                'total': row['total'],
            }
            for row in by_quarter_qs
        ]

        return Response({
            'date_from': date_from,
            'date_to': date_to,
            'total': total,
            'breakdown': breakdown,
            'payer_breakdown': payer_breakdown,
            'by_period': by_period,
            'by_period_quarterly': by_period_quarterly,
        })