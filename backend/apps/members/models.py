from django.db import models

class Member(models.Model):
    first_name = models.CharField(max_length=100)

