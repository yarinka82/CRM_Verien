
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from django.utils.dateparse import parse_date
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Expense
from .serializers import ExpenseSerializer


class ExpenseViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def _get_queryset(self, request):
        qs = Expense.objects.all()
        date_from = parse_date(request.query_params.get('date_from', '') or '')
        if date_from:
            qs = qs.filter(date__gte=date_from)
        date_to = parse_date(request.query_params.get('date_to', '') or '')
        if date_to:
            qs = qs.filter(date__lte=date_to)
        return qs

    def list(self, request):
        serializer = ExpenseSerializer(self._get_queryset(request), many=True)
        return Response(serializer.data)

    def create(self, request):
        serializer = ExpenseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        expense = Expense.objects.filter(pk=pk).first()
        if expense is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(ExpenseSerializer(expense).data)

    def update(self, request, pk=None):
        expense = Expense.objects.filter(pk=pk).first()
        if expense is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = ExpenseSerializer(expense, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        expense = Expense.objects.filter(pk=pk).first()
        if expense is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = ExpenseSerializer(expense, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def destroy(self, request, pk=None):
        expense = Expense.objects.filter(pk=pk).first()
        if expense is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        expense.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ExpenseOverviewView(APIView):
    """Загальна сума витрат за період + динаміка по місяцях."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Expense.objects.all()

        date_from = parse_date(request.query_params.get('date_from', '') or '')
        if date_from:
            qs = qs.filter(date__gte=date_from)

        date_to = parse_date(request.query_params.get('date_to', '') or '')
        if date_to:
            qs = qs.filter(date__lte=date_to)

        total = qs.aggregate(total=Sum('amount'))['total'] or 0

        by_month_qs = (
            qs.annotate(month=TruncMonth('date'))
            .values('month')
            .annotate(total=Sum('amount'))
            .order_by('month')
        )
        by_period = [
            {'period': row['month'].strftime('%Y-%m') if row['month'] else None, 'total': row['total']}
            for row in by_month_qs
        ]

        return Response({
            'date_from': date_from,
            'date_to': date_to,
            'total': total,
            'by_period': by_period,
        })