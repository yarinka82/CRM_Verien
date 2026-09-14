from rest_framework.routers import DefaultRouter
from apps.documents.views import OrgDocumentViewSet, DocumentTemplateViewSet

router = DefaultRouter()
router.register(r'documents', OrgDocumentViewSet, basename='org-document')
router.register(r'document-templates', DocumentTemplateViewSet, basename='document-template')

urlpatterns = router.urls