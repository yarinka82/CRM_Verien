from django.db import models
from apps.members.models import Member
from django.utils.translation import gettext_lazy as _

class Payment(models.Model):
    """
    Модель платежів (Payment) для обліку внесків та фінансової аналітики.
    """
    
    class PaymentType(models.TextChoices):
        MEMBERSHIP_FEE = 'membership_fee', _('Membership Fee')
        DONATION = 'donation', _('Donation')
        EVENT = 'event', _('Event')
    
    class PaymentStatus(models.TextChoices):
        COMPLETED = 'completed', _('Completed')
        PENDING = 'pending', _('Pending')
        FAILED = 'failed', _('Failed')
        REFUNDED = 'refunded', _('Refunded')
    
    member = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        related_name='payments',
        verbose_name=_('Member')
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name=_('Amount')
    )
    date = models.DateField(
        db_index=True,
        null=True,
        blank=True,
        verbose_name=_('Payment Date')
    )
    
    type = models.CharField(
        max_length=50,
        db_index=True,
        null=True,
        blank=True,
        verbose_name=_('Payment Type')
    )
    source_name = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name=_('Source Name')  # Наприклад: Bank Transfer, Stripe, PayPal
    )
    period = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name=_('Billing Period')  # Наприклад: 2026, 2026-Q1
    )
    status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.COMPLETED,
        db_index=True,
        verbose_name=_('Payment Status')
    )
    comment = models.TextField(
        blank=True,
        null=True,
        verbose_name=_('Comment')
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('Created At')
    )
    
    class Meta:
        verbose_name = _('Payment')
        verbose_name_plural = _('Payments')
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['date', 'status'], name='idx_payment_date_status'),
            models.Index(fields=['type', 'date'], name='idx_payment_type_date'),
        ]
    
    def __str__(self):
        return f"{self.member} - {self.amount} EUR ({self.date})"