from django.db import models
from django.utils.translation import gettext_lazy as _


class Member(models.Model):
    """
    Модель учасника (Member) організації/клубу.
    Віповідає бізнес-вимогам MVP та закладає фундамент для аналітики й CRM.
    """
    class Status(models.TextChoices):
        ACTIVE = 'active', _('Active')
        INACTIVE = 'inactive', _('Inactive')
        PENDING = 'pending', _('Pending')

    first_name = models.CharField(
        max_length=100, 
        verbose_name=_('First Name')
    )
    last_name = models.CharField(
        max_length=100, 
        verbose_name=_('Last Name')
    )
    email = models.EmailField(
        unique=True, 
        db_index=True, 
        verbose_name=_('Email Address')
    )
    phone = models.CharField(
        max_length=30, 
        blank=True, 
        null=True, 
        verbose_name=_('Phone Number')
    )
    
    # Нові поля за запитом фронтенду 
    birth_date = models.DateField(
        verbose_name=_('Дата народження'),
        null=True,
        blank=True
    )
    address = models.CharField(
        verbose_name=_('Адреса'),
        max_length=255,
        blank=True
    )
    notes = models.TextField(
        verbose_name=_('Примітки'),
        blank=True
    )

    join_date = models.DateField(
        verbose_name=_('Join Date')
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True,
        verbose_name=_('Member Status')
    )
    is_founder = models.BooleanField(
        default=False, 
        verbose_name=_('Is Founder')
    )
    
    # Системні поля для аудиту та відстеження
    created_at = models.DateTimeField(
        auto_now_add=True, 
        verbose_name=_('Created At')
    )
    updated_at = models.DateTimeField(
        auto_now=True, 
        verbose_name=_('Updated At')
    )

    class Meta:
        verbose_name = _('Member')
        verbose_name_plural = _('Members')
        ordering = ['-join_date', 'last_name', 'first_name']
        indexes = [
            models.Index(fields=['status', 'join_date'], name='idx_member_status_join'),
        ]

    def __str__(self):
        return f"{self.last_name}, {self.first_name} ({self.email})"


class Payment(models.Model):
    """
    Модель платежів (Payment) для обліку внесків та фінансової аналітики.
    """
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
        verbose_name=_('Payment Date')
    )
    type = models.CharField(
        max_length=50,
        db_index=True,
        verbose_name=_('Payment Type')  # Наприклад: membership_fee, donation, event
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