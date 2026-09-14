from django.db import models



class Member(models.Model):
    class PayerType(models.TextChoices):
        INDIVIDUAL = 'individual', 'Фізична особа'
        COMPANY = 'company', 'Підприємство'

    STATUS_CHOICES = [
        ('active', 'Активний'),
        ('inactive', 'Неактивний'),
    ]

    payer_type = models.CharField(
        max_length=20,
        choices=PayerType.choices,
        default=PayerType.INDIVIDUAL,
        verbose_name='Тип особи',
    )
    first_name = models.CharField(max_length=100, verbose_name='First Name')
    last_name = models.CharField(max_length=100, verbose_name='Last Name')
    email = models.EmailField(
        unique=True,
        verbose_name=('Email Address')
    )
    phone = models.CharField(
        max_length=30, 
        blank=True,
        verbose_name=('Phone Number')
    )

    join_date = models.DateField(
        verbose_name=('Join Date')
    )
    
    status = models.CharField('Статус',
        max_length=20, choices=STATUS_CHOICES, default='active')
    
    is_founder = models.BooleanField(
        default=False, 
        verbose_name=('Is Founder')
    )
    
    # System Fields for Audit and Tracking
    created_at = models.DateTimeField(
        auto_now_add=True, 
        verbose_name=('Created At')
    )
    updated_at = models.DateTimeField(
        auto_now=True, 
        verbose_name=('Updated At')
    )
    # add. fields
    birth_date = models.DateField(
        verbose_name=('Дата народження'),
        null=True,
        blank=True
    )
    address = models.CharField(
        verbose_name=('Адреса'),
        max_length=255,
        blank=True
    )
    notes = models.TextField(
        verbose_name=('Примітки'),
        blank=True
    )
    class Meta:
        verbose_name = ('Member')
        verbose_name_plural = ('Members')
        ordering = ['-join_date', 'last_name', 'first_name']
        indexes = [
            models.Index(fields=['status', 'join_date'],
                         name='idx_member_status_join'),
        ]

    def __str__(self):
        return f"{self.last_name}, {self.first_name} ({self.email})"

