import os
from django.core.exceptions import ValidationError
from django.db import models



def validate_pdf(file):
    ext = os.path.splitext(file.name)[1].lower()
    if ext != '.pdf':
        raise ValidationError('Дозволені лише PDF-файли.')


def org_document_upload_path(instance, filename):
    return f'documents/{instance.category}/{filename}'


def template_upload_path(instance, filename):
    return f'templates/{filename}'


class OrgDocument(models.Model):
    """Main / internal documents of the fairine and minutes of meetings."""

    class Category(models.TextChoices):
        FOUNDING = 'founding', ('Основний документ')
        INTERNAL = 'internal', ('Внутрішній документ')
        PROTOCOL = 'protocol', ('Протокол')

    title = models.CharField(max_length=255, verbose_name=('Назва'))
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        db_index=True,
        verbose_name=('Категорія'),
    )
    file = models.FileField(
        upload_to=org_document_upload_path,
        validators=[validate_pdf],
        verbose_name=('Файл'),
    )
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name=('Завантажено'))

    class Meta:
        verbose_name = ('Документ ферайну')
        verbose_name_plural = ('Документи ферайну')
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['category', 'uploaded_at'], name='idx_orgdoc_cat_date'),
        ]

    def __str__(self):
        return f'{self.get_category_display()}: {self.title}'


class DocumentTemplate(models.Model):
    """Templates — own documents of the organization (for example, on joining the feraine),
    not related to contributions/payments. Uploaded by the admin."""

    title = models.CharField(max_length=255, verbose_name=('Назва'))
    description = models.CharField(max_length=500, blank=True, verbose_name=('Опис'))
    file = models.FileField(
        upload_to=template_upload_path,
        validators=[validate_pdf],
        verbose_name=('Файл'),
    )
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name=('Завантажено'))

    class Meta:
        verbose_name = ('Шаблон документа')
        verbose_name_plural = ('Шаблони документів')
        ordering = ['-uploaded_at']

    def __str__(self):
        return self.title