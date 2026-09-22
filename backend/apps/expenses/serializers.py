
from decimal import Decimal
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from .models import Expense


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ['id', 'title', 'amount', 'date', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_amount(self, value):
        if value <= Decimal('0'):
            raise serializers.ValidationError(_('Сума має бути більшою за нуль.'))
        return value

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError(_('Вкажіть назву витрати.'))
        return value