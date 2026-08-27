from django.db import models
from apps.members.models import Member

class Payment(models.Model):


    member = models.ForeignKey(
        Member,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments"
    )