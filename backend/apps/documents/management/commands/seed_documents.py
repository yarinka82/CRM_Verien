import io

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from apps.documents.models import OrgDocument, DocumentTemplate


def make_pdf_bytes(title: str, subtitle: str = '', body: str = '') -> bytes:
    """Generates a simple one-page PDF file with a header (for test data)."""
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    c.setFont('Helvetica-Bold', 16)
    c.drawString(50, height - 80, title)

    if subtitle:
        c.setFont('Helvetica-Oblique', 12)
        c.drawString(50, height - 105, subtitle)

    if body:
        c.setFont('Helvetica', 10)
        text_obj = c.beginText(50, height - 140)
        for line in body.split('\n'):
            text_obj.textLine(line)
        c.drawText(text_obj)

    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.read()


SAMPLE_DOCUMENTS = [
    # --- Basic Documents / Gründungsdokumente ---
    {
        'category': OrgDocument.Category.FOUNDING,
        'title': 'Статут організації',
        'subtitle': 'Satzung des Vereins',
        'filename': 'statut_satzung.pdf',
    },
    {
        'category': OrgDocument.Category.FOUNDING,
        'title': 'Свідоцтво про реєстрацію',
        'subtitle': 'Registrierungsurkunde',
        'filename': 'reestraciya_registrierung.pdf',
    },
    # --- Internal Documents / Interne Dokumente ---
    {
        'category': OrgDocument.Category.INTERNAL,
        'title': 'Положення про членські внески',
        'subtitle': 'Beitragsordnung',
        'filename': 'polozhennya_beitragsordnung.pdf',
    },
    {
        'category': OrgDocument.Category.INTERNAL,
        'title': 'Кодекс поведінки членів',
        'subtitle': 'Verhaltenskodex der Mitglieder',
        'filename': 'kodeks_verhaltenskodex.pdf',
    },
    # --- Protocols / Protokolle ---
    {
        'category': OrgDocument.Category.PROTOCOL,
        'title': 'Протокол загальних зборів №1',
        'subtitle': 'Protokoll der Mitgliederversammlung Nr. 1',
        'filename': 'protokol_1.pdf',
    },
    {
        'category': OrgDocument.Category.PROTOCOL,
        'title': 'Протокол засідання правління',
        'subtitle': 'Vorstandssitzungsprotokoll',
        'filename': 'protokol_vorstand.pdf',
    },
]

SAMPLE_TEMPLATES = [
    {
        'title': 'Заява про вступ до організації',
        'description': 'Beitrittsantrag zum Verein',
        'filename': 'zayava_beitrittsantrag.pdf',
    },
    {
        'title': 'Заява про вихід з організації',
        'description': 'Austrittserklärung aus dem Verein',
        'filename': 'zayava_austritt.pdf',
    },
    {
        'title': 'Довідка про членство',
        'description': 'Mitgliedschaftsbescheinigung',
        'filename': 'dovidka_mitgliedschaft.pdf',
    },
]


class Command(BaseCommand):
    help = 'Створює тестові PDF-документи (укр./нім.) у всіх категоріях документів та шаблонів.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Видалити всі наявні документи/шаблони перед створенням нових.',
        )

    def handle(self, *args, **options):
        if options['clear']:
            deleted_docs = OrgDocument.objects.all().delete()
            deleted_templates = DocumentTemplate.objects.all().delete()
            self.stdout.write(self.style.WARNING(
                f'Видалено: {deleted_docs[0]} документів, {deleted_templates[0]} шаблонів.'
            ))

        created_docs = 0
        for item in SAMPLE_DOCUMENTS:
            pdf_bytes = make_pdf_bytes(
                title=item['title'],
                subtitle=item['subtitle'],
                body='Тестовий документ, згенерований автоматично.\n'
                     'Automatisch generiertes Testdokument.',
            )
            doc = OrgDocument(
                title=f"{item['title']} / {item['subtitle']}",
                category=item['category'],
            )
            doc.file.save(item['filename'], ContentFile(pdf_bytes), save=True)
            created_docs += 1
            self.stdout.write(f"  + {doc.title} [{doc.get_category_display()}]")

        created_templates = 0
        for item in SAMPLE_TEMPLATES:
            pdf_bytes = make_pdf_bytes(
                title=item['title'],
                subtitle=item['description'],
                body='Тестовий шаблон, згенерований автоматично.\n'
                     'Automatisch generierte Testvorlage.',
            )
            tpl = DocumentTemplate(
                title=f"{item['title']} / {item['description']}",
                description=item['description'],
            )
            tpl.file.save(item['filename'], ContentFile(pdf_bytes), save=True)
            created_templates += 1
            self.stdout.write(f"  + {tpl.title}")

        self.stdout.write(self.style.SUCCESS(
            f'Готово: створено {created_docs} документів та {created_templates} шаблонів.'
        ))
        
# python manage.py seed_documents
# python manage.py seed_documents --clear