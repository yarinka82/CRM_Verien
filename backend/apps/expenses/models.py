
from django.db import models
from django.utils.translation import gettext_lazy as _


class Expense(models.Model):
    """Expenses of the organization — what the funds were spent on.
    Intentionally minimal model: name, amount, date.
    We do not fix the category, because the costs are "very different" (rent, purchase
    products, etc.) — just free text in the title."""

    title = models.CharField(
        max_length=255,
        verbose_name=_('Назва'),
        help_text=_('Наприклад: оренда приміщення, придбання канцтоварів'),
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name=_('Сума'),
    )
    date = models.DateField(
        db_index=True,
        verbose_name=_('Дата'),
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Створено'))

    class Meta:
        verbose_name = _('Витрата')
        verbose_name_plural = _('Витрати')
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['date'], name='idx_expense_date'),
        ]

    def __str__(self):
        return f'{self.title} — {self.amount} EUR ({self.date})'