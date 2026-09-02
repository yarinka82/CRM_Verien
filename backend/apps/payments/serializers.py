from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    """
    Основний сериалізатор для CRUD-операцій з платежами/надходженнями.

    Валідація (модель Payment не містить власного clean(), тому вся
    бізнес-логіка перевіряється тут):
    - type == 'membership_fee' -> member обов'язковий, source_name обнуляється
    - type != 'membership_fee' -> source_name обов'язковий, member повинен
      бути порожнім
    """

    member_full_name = serializers.SerializerMethodField(read_only=True)
    type_display = serializers.CharField(source="get_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "member",
            "member_full_name",
            "amount",
            "date",
            "type",
            "type_display",
            "source_name",
            "period",
            "status",
            "status_display",
            "comment",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_member_full_name(self, obj):
        if obj.member_id:
            return f"{obj.member.first_name} {obj.member.last_name}"
        return None

    def validate(self, attrs):
        instance = getattr(self, "instance", None)

        payment_type = attrs.get("type", getattr(instance, "type", None))
        member = attrs.get("member", getattr(instance, "member", None))
        # source_name у моделі не nullable — порожній рядок, а не None
        source_name = attrs.get("source_name", getattr(instance, "source_name", "") or "")

        if payment_type == Payment.PaymentType.MEMBERSHIP_FEE:
            if not member:
                raise serializers.ValidationError(
                    {"member": "Для членського внеску обов'язково потрібно вказати члена."}
                )
            # для внеску source_name не потрібен — обнуляємо, щоб не було сміття в БД
            attrs["source_name"] = ""
        else:
            if not source_name.strip():
                raise serializers.ValidationError(
                    {
                        "source_name": "Для пожертви/спонсорства/гранту потрібно вказати "
                        "джерело (source_name)."
                    }
                )
            if member:
                raise serializers.ValidationError(
                    {
                        "member": "Пожертва/спонсорство/грант не повинні бути "
                        "прив'язані до конкретного члена."
                    }
                )

        return attrs


class PaymentListSerializer(serializers.ModelSerializer):
    """Полегшений сериалізатор для списку — без зайвих полів, швидше для таблиці."""

    member_full_name = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            "id",
            "member",
            "member_full_name",
            "amount",
            "date",
            "type",
            "status",
        ]

    def get_member_full_name(self, obj):
        if obj.member_id:
            return f"{obj.member.first_name} {obj.member.last_name}"
        return None


class FinancialOverviewSerializer(serializers.Serializer):
    """
    Сериалізатор відповіді для сторінки "Фінансовий огляд".
    Не прив'язаний до моделі напряму — формує агреговані дані.
    """

    date_from = serializers.DateField()
    date_to = serializers.DateField()
    total = serializers.DecimalField(max_digits=12, decimal_places=2)
    by_type = serializers.DictField(child=serializers.DecimalField(max_digits=12, decimal_places=2))
    count = serializers.IntegerField()