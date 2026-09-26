
from django.conf import settings
from django.db import models


class RequestLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Пользователь"
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name="IP адрес")
    method = models.CharField(max_length=10, verbose_name="HTTP метод")  # GET, POST и т.д.
    path = models.CharField(max_length=500, verbose_name="URL / Эндпоинт")
    status_code = models.PositiveSmallIntegerField(verbose_name="HTTP статус ответа")
    user_agent = models.TextField(blank=True, null=True, verbose_name="Браузер / Клиент")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата и время")

    class Meta:
        verbose_name = "Лог запроса"
        verbose_name_plural = "Логи запросов"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.created_at} | {self.ip_address} | {self.method} {self.path}"