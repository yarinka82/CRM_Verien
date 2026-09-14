
from rest_framework import serializers
from .models import OrgDocument, DocumentTemplate


class OrgDocumentSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = OrgDocument
        fields = ['id', 'title', 'category', 'category_display', 'file', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class DocumentTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentTemplate
        fields = ['id', 'title', 'description', 'file', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']