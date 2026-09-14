import datetime
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models



class Payment(models.Model):
    class PaymentType(models.TextChoices):
        MEMBERSHIP_FEE = 'membership_fee', 'Членський внесок'
        DONATION = 'donation', 'Пожертва'
        SPONSORSHIP = 'sponsorship', 'Спонсорська підтримка'
        GRANT = 'grant', 'Грант'

    class PayerType(models.TextChoices):
        INDIVIDUAL = 'individual', 'Фізична особа'
        COMPANY = 'company', 'Підприємство'
        OTHER = 'other', 'Інше'

    member = models.ForeignKey(
        'members.Member',
        on_delete=models.PROTECT,
        related_name='payments',
        null=True,
        blank=True,
        verbose_name='Член',
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='Сума',
    )
    date = models.DateField(
        db_index=True,
        verbose_name='Дата',
    )
    type = models.CharField(
        max_length=50,
        choices=PaymentType.choices,
        db_index=True,
        verbose_name='Тип надходження',
    )
    payer_type = models.CharField(
        max_length=20,
        choices=PayerType.choices,
        default=PayerType.INDIVIDUAL,
        db_index=True,
        verbose_name='Тип платника',
    )
    source_name = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Назва джерела',
    )
    period = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        db_index=True,
        validators=[MinValueValidator(2000), MaxValueValidator(datetime.date.today().year + 1)],
        verbose_name='Рік періоду',
    )
    comment = models.TextField(
        blank=True,
        verbose_name='Коментар',
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Створено',
    )

    class Meta:
        verbose_name = 'Платіж'
        verbose_name_plural = 'Платежі'
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['type', 'date'], name='idx_payment_type_date'),
            models.Index(fields=['payer_type', 'date'], name='idx_payment_payer_date'),
        ]
        
    def clean(self):
        super().clean()
        if self.type == self.PaymentType.MEMBERSHIP_FEE and not self.member:
            raise ValidationError({'member': "Членський внесок має бути прив'язаний до члена організації."})
        if not self.member and not self.source_name:
            raise ValidationError({'source_name': 'Вкажіть назву джерела, якщо платіж не прив\'язаний до члена.'})

    def save(self, *args, **kwargs):
        # Automatically sync payer_type with the linked member type
        if self.member:
            self.payer_type = self.member.payer_type
        super().save(*args, **kwargs)
        
    def __str__(self):
        who = self.member if self.member else (self.source_name or self.get_type_display())
        return f"{who} — {self.amount} EUR ({self.date})"