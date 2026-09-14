
from django.core.management.base import BaseCommand
from datetime import date
import random

from apps.members.models import Member
from apps.payments.models import Payment


class Command(BaseCommand):
    help = 'Заповнює базу даних тестовими платежами'

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=30, help='Кількість платежів для створення')
        parser.add_argument('--clear', action='store_true', help='Очистити існуючі платежі перед створенням')

    def handle(self, *args, **options):
        count = options['count']
        should_clear = options['clear']

        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('💰 ЗАПОВНЕННЯ БАЗИ ДАНИХ ПЛАТЕЖАМИ'))
        self.stdout.write(self.style.SUCCESS('=' * 60))

        if should_clear:
            self.stdout.write('🗑️  Видаляємо існуючі платежі...')
            deleted_count, _ = Payment.objects.all().delete()
            self.stdout.write(f'   ✅ Видалено {deleted_count} платежів')

        members = list(Member.objects.filter(status='active'))
        if not members:
            self.stdout.write(self.style.ERROR('❌ Немає активних членів. Спершу запустіть seed_members.'))
            return

        self.stdout.write(f'💵 Створюємо {count} платежів...')
        self.stdout.write('')

        created_count = 0
        for _ in range(count):
            payment_type = random.choice(list(Payment.PaymentType.values))
            year = random.randint(2023, 2026)
            month = random.randint(1, 12)
            day = random.randint(1, 28)
            payment_date = date(year, month, day)

            if payment_type == Payment.PaymentType.MEMBERSHIP_FEE:
                # Contribution is always tied to a specific member
                member = random.choice(members)
                amount = random.choice([500, 1000, 1500, 2000])
                payment = Payment.objects.create(
                    member=member,
                    amount=amount,
                    date=payment_date,
                    type=payment_type,
                    period=year,
                    comment='',
                )
            else:
                # Donation/Sponsorship/Grant — can be either from a member or from outside
                is_from_member = random.random() < 0.4
                if is_from_member:
                    member = random.choice(members)
                    payment = Payment.objects.create(
                        member=member,
                        amount=random.randint(1000, 20000),
                        date=payment_date,
                        type=payment_type,
                        period=year,
                    )
                else:
                    external_payer_type = random.choice(
                        [Payment.PayerType.COMPANY, Payment.PayerType.OTHER]
                    )
                    source_name = random.choice([
                        'Благодійний фонд "Розвиток"',
                        'ТОВ "Спонсор Груп"',
                        'Анонімний донор',
                        'Grant Foundation EU',
                    ])
                    payment = Payment.objects.create(
                        payer_type=external_payer_type,
                        source_name=source_name,
                        amount=random.randint(1000, 20000),
                        date=payment_date,
                        type=payment_type,
                        period=year,
                    )

            created_count += 1
            who = payment.member or payment.source_name
            self.stdout.write(f'  ✅ {who} — {payment.amount} EUR ({payment.get_type_display()}, {payment.date})')

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('✅ СТАТИСТИКА'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(f'   📊 Всього створено: {created_count}')
        self.stdout.write(f'   📊 Загальна сума: {sum(p.amount for p in Payment.objects.all())} EUR')
        for pt in Payment.PaymentType.values:
            cnt = Payment.objects.filter(type=pt).count()
            self.stdout.write(f'   📊 {pt}: {cnt}')

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('✅ Скрипт завершено!'))
        self.stdout.write(self.style.SUCCESS('=' * 60))