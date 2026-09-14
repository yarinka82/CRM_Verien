
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets
from rest_framework.authentication import (
    BasicAuthentication,
    SessionAuthentication,
)
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import DocumentTemplate, OrgDocument
from .serializers import DocumentTemplateSerializer, OrgDocumentSerializer


# Disable forced CSRF for DRF sessions
class CsrfExemptSessionAuthentication(SessionAuthentication):

    def enforce_csrf(self, request):
        return


@method_decorator(csrf_exempt, name="dispatch")
class OrgDocumentViewSet(viewsets.ViewSet):
    authentication_classes = [
        CsrfExemptSessionAuthentication,
        BasicAuthentication,
    ]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def _get_queryset(self, request):
        qs = OrgDocument.objects.all()
        category = request.query_params.get("category")
        if category:
            qs = qs.filter(category=category)
        return qs

    def list(self, request):
        serializer = OrgDocumentSerializer(
            self._get_queryset(request), many=True
        )
        return Response(serializer.data)

    def create(self, request):
        serializer = OrgDocumentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=201)

    def destroy(self, request, pk=None):
        doc = OrgDocument.objects.filter(pk=pk).first()
        if doc is None:
            return Response(status=404)
        doc.file.delete(save=False)
        doc.delete()
        return Response(status=204)


@method_decorator(csrf_exempt, name="dispatch")
class DocumentTemplateViewSet(viewsets.ViewSet):
    authentication_classes = [
        CsrfExemptSessionAuthentication,
        BasicAuthentication,
    ]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def list(self, request):
        serializer = DocumentTemplateSerializer(
            DocumentTemplate.objects.all(), many=True
        )
        return Response(serializer.data)

    def create(self, request):
        serializer = DocumentTemplateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=201)

    def destroy(self, request, pk=None):
        tpl = DocumentTemplate.objects.filter(pk=pk).first()
        if tpl is None:
            return Response(status=404)
        tpl.file.delete(save=False)
        tpl.delete()
        return Response(status=204)