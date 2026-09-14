
from django.core.management.base import BaseCommand
from datetime import datetime
import random

from apps.members.models import Member

FIRST_NAMES = [
    'Олександр', 'Іван', 'Марія', 'Анна', 'Петро',
    'Олена', 'Василь', 'Наталія', 'Микола', 'Тетяна',
    'Юрій', 'Ольга', 'Володимир', 'Катерина', 'Андрій',
    'Ірина', 'Сергій', 'Людмила', 'Дмитро', 'Вікторія',
    'Євген', 'Ганна', 'Богдан', 'Зоя', 'Олег'
]

LAST_NAMES = [
    'Коваленко', 'Бондаренко', 'Ткаченко', 'Кравченко', 'Олійник',
    'Шевченко', 'Бойко', 'Мельник', 'Коваль', 'Савенко',
    'Гончаренко', 'Лисенко', 'Руденко', 'Ткачук', 'Марченко',
    'Кузьменко', 'Сидоренко', 'Клименко', 'Федоренко', 'Романенко',
    'Кравець', 'Денисенко', 'Білоус', 'Швець', 'Захарченко'
]

COMPANY_NAMES = [
    'ТОВ "Промбуд"', 'ФОП Коваленко', 'ТОВ "Агроцентр"',
    'ТОВ "ІТ Солюшнс"', 'ФОП Бондаренко', 'ТОВ "Логістик Груп"',
]

EMAIL_DOMAINS = ['gmail.com', 'ukr.net', 'email.ua', 'i.ua', 'meta.ua']
PHONE_PREFIXES = ['050', '063', '066', '067', '068', '093', '095', '096', '097', '098', '099']


class Command(BaseCommand):
    help = 'Заповнює базу даних тестовими членами'

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=10, help='Кількість членів для створення')
        parser.add_argument('--clear', action='store_true', help='Очистити існуючих членів перед створенням')
        parser.add_argument('--founders', type=int, default=None, help='Кількість засновників')
        parser.add_argument(
            '--company-ratio',
            type=float,
            default=0.15,
            help='Частка членів-підприємств (0.0–1.0, за замовчуванням 15%%)',
        )

    def generate_phone(self):
        prefix = random.choice(PHONE_PREFIXES)
        number = ''.join(str(random.randint(0, 9)) for _ in range(7))
        return f"{prefix}{number}"

    def generate_email(self, first_name, last_name):
        domain = random.choice(EMAIL_DOMAINS)
        translit_map = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g',
            'д': 'd', 'е': 'e', 'є': 'ye', 'ж': 'zh', 'з': 'z',
            'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k',
            'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p',
            'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f',
            'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
            'ь': '', 'ю': 'yu', 'я': 'ya'
        }

        def transliterate(text):
            return ''.join(translit_map.get(c, c) for c in text.lower())

        first = transliterate(first_name)
        last = transliterate(last_name)

        variants = [
            f"{first}.{last}",
            f"{first}{last}",
            f"{first}_{last}",
            f"{last}.{first}",
            f"{last}{random.randint(1, 99)}"
        ]
        return f"{random.choice(variants)}@{domain}"

    def handle(self, *args, **options):
        count = options['count']
        should_clear = options['clear']
        founder_count = options['founders']
        company_ratio = options['company_ratio']

        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('📝 ЗАПОВНЕННЯ БАЗИ ДАНИХ ЧЛЕНАМИ'))
        self.stdout.write(self.style.SUCCESS('=' * 60))

        if should_clear:
            self.stdout.write('🗑️  Видаляємо існуючих членів...')
            deleted_count, _ = Member.objects.all().delete()
            self.stdout.write(f'   ✅ Видалено {deleted_count} членів')

        if founder_count is None:
            founder_count = random.randint(2, min(3, count))
        else:
            founder_count = min(founder_count, count)

        self.stdout.write(f'👥 Створюємо {count} членів ({founder_count} засновників)...')
        self.stdout.write('')

        created_count = 0
        for i in range(count):
            is_company = random.random() < company_ratio
            payer_type = Member.PayerType.COMPANY if is_company else Member.PayerType.INDIVIDUAL

            if is_company:
                # For companies "name/surname" we save as a contact person + company name
                first_name = random.choice(FIRST_NAMES)
                last_name = random.choice(COMPANY_NAMES)
            else:
                first_name = random.choice(FIRST_NAMES)
                last_name = random.choice(LAST_NAMES)

            email = self.generate_email(first_name, last_name)

            year = random.randint(2020, 2026)
            month = random.randint(1, 12)
            day = random.randint(1, 28)
            join_date = datetime(year, month, day).date()

            status = 'active' if random.random() < 0.8 else 'inactive'
            is_founder = i < founder_count

            member = Member.objects.create(
                payer_type=payer_type,
                first_name=first_name,
                last_name=last_name,
                email=email,
                phone=self.generate_phone(),
                join_date=join_date,
                status=status,
                is_founder=is_founder,
            )
            created_count += 1

            founder_mark = '⭐ Засновник' if is_founder else 'Член'
            company_mark = ' 🏢' if is_company else ''
            self.stdout.write(
                f'  ✅ {member.last_name} {member.first_name} - {founder_mark}{company_mark}'
            )

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('✅ СТАТИСТИКА'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(f'   📊 Всього створено: {created_count}')
        self.stdout.write(f'   📊 Засновників: {Member.objects.filter(is_founder=True).count()}')
        self.stdout.write(f'   📊 Активних: {Member.objects.filter(status="active").count()}')
        self.stdout.write(f'   📊 Неактивних: {Member.objects.filter(status="inactive").count()}')
        self.stdout.write(f'   📊 Підприємств: {Member.objects.filter(payer_type=Member.PayerType.COMPANY).count()}')

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('👥 Перші 5 членів:'))
        for member in Member.objects.all()[:5]:
            self.stdout.write(
                f'   - {member.last_name} {member.first_name} ({member.email})'
                f'{" ⭐" if member.is_founder else ""}'
            )

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('✅ Скрипт завершено!'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
        
    # Check the command
    # python manage.py seed_members --help
    #
    # # Create 10 members
    # python manage.py seed_members --count=10 --clear
        
        