
import random
from datetime import date
from decimal import Decimal
from django.core.management.base import BaseCommand

from apps.members.models import Member
from apps.payments.models import Payment


try:
    from apps.expenses.models import Expense
except ImportError:
    from apps.payments.models import Expense


class Command(BaseCommand):
    help = "Заповнює базу даних тестовими платежами (надходженнями) та витратами"

    def add_arguments(self, parser):
        parser.add_argument(
            "--payments-count",
            type=int,
            default=30,
            help="Кількість платежів (доходів)",
        )
        parser.add_argument(
            "--expenses-count",
            type=int,
            default=25,
            help="Кількість витрат для створення",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Очистити існуючі платежі та витрати перед створенням",
        )

    def handle(self, *args, **options):
        payments_count = options["payments_count"]
        expenses_count = options["expenses_count"]
        should_clear = options["clear"]

        self.stdout.write(self.style.SUCCESS("=" * 65))
        self.stdout.write(
            self.style.SUCCESS(
                "💰 ЗАПОВНЕННЯ БАЗИ ДАНИХ ФІНАНСАМИ (ДОХОДИ ТА ВИТРАТИ)"
            )
        )
        self.stdout.write(self.style.SUCCESS("=" * 65))

        # 1. Cleaning if necessary
        if should_clear:
            self.stdout.write("🗑️  Видаляємо існуючі записи...")
            del_pay, _ = Payment.objects.all().delete()
            del_exp, _ = Expense.objects.all().delete()
            self.stdout.write(
                f"   ✅ Видалено: {del_pay} платежів, {del_exp} витрат"
            )

        members = list(Member.objects.filter(status="active"))
        if not members:
            self.stdout.write(
                self.style.ERROR(
                    "❌ Немає активних членів. Спершу запустіть seed_members."
                )
            )
            return

        # =========================================================================
        # 2. GENERATION OF PAYMENTS (INCOME)
        # =========================================================================
        self.stdout.write(
            f"\n💵 Створюємо {payments_count} платежів (надходжень)..."
        )

        created_payments = 0
        for _ in range(payments_count):
            payment_type = random.choice(list(Payment.PaymentType.values))
            year = random.randint(2023, 2026)
            month = random.randint(1, 12)
            day = random.randint(1, 28)
            payment_date = date(year, month, day)

            if payment_type == Payment.PaymentType.MEMBERSHIP_FEE:
                member = random.choice(members)
                amount = Decimal(random.choice([50, 100, 150, 200, 500]))
                payment = Payment.objects.create(
                    member=member,
                    amount=amount,
                    date=payment_date,
                    type=payment_type,
                    period=year,
                    comment="",
                )
            else:
                is_from_member = random.random() < 0.4
                amount = Decimal(random.randint(200, 5000))
                if is_from_member:
                    member = random.choice(members)
                    payment = Payment.objects.create(
                        member=member,
                        amount=amount,
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
                        "Анонімний донор",
                        "Grant Foundation EU",
                        'ГО "Європейська Ініціатива"',
                    ])
                    payment = Payment.objects.create(
                        payer_type=external_payer_type,
                        source_name=source_name,
                        amount=amount,
                        date=payment_date,
                        type=payment_type,
                        period=year,
                    )

            created_payments += 1
            who = payment.member or payment.source_name
            self.stdout.write(
                f"  🟢 Дохід: {who} — {payment.amount} € ({payment.get_type_display()}, {payment.date})"
            )

        # =========================================================================
        # 3. VITRATE GENERATION (EXPENSES)
        # =========================================================================
        self.stdout.write(f"\n📉 Створюємо {expenses_count} витрат...")

        # Set of templates with realistic amounts
        EXPENSE_TEMPLATES = [
            ("Оренда офісного приміщення", (600, 2200)),
            ("Комунальні послуги (електроенергія, вода, тепло)", (120, 480)),
            ("Придбання продукції та матеріалів", (300, 3500)),
            ("Канцелярські товари та офісний папір", (25, 180)),
            ("Транспортні та логістичні витрати", (80, 850)),
            ("Банківське розрахункове обслуговування та комісії", (15, 75)),
            ("Оплата послуг юридичного та бухгалтерського супроводу", (200, 900)),
            ("Поліграфія, банери та інформаційні матеріали", (50, 450)),
            ("Поштові та кур'єрські відправлення", (10, 95)),
            ("Господарські товари та послуги клінінгу", (40, 220)),
            ("Оплата послуг зв'язку та інтернету", (30, 110)),
            ("Придбання комп'ютерної периферії (миші, клавіатури, кабелі)", (45, 320)),
        ]

        created_expenses = 0
        for _ in range(expenses_count):
            title, (min_amt, max_amt) = random.choice(EXPENSE_TEMPLATES)
            amount = Decimal(random.randint(min_amt, max_amt))
            year = random.randint(2023, 2026)
            month = random.randint(1, 12)
            day = random.randint(1, 28)
            expense_date = date(year, month, day)

            expense = Expense.objects.create(
                title=title,
                amount=amount,
                date=expense_date,
            )
            created_expenses += 1
            self.stdout.write(
                f"  🔴 Витрата: {expense.title} — {expense.amount} € ({expense.date})"
            )

        # =========================================================================
        # Financial Statistics
        # =========================================================================
        total_income = sum(
            p.amount for p in Payment.objects.all()
        ) or Decimal("0")
        total_expenses = sum(
            e.amount for e in Expense.objects.all()
        ) or Decimal("0")
        balance = total_income - total_expenses

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 65))
        self.stdout.write(self.style.SUCCESS("📊 ФІНАНСОВИЙ ПІДСУМОК"))
        self.stdout.write(self.style.SUCCESS("=" * 65))
        self.stdout.write(
            f"   📥 Створено надходжень: {created_payments} на суму: {total_income:.2f} €"
        )
        self.stdout.write(
            f"   📤 Створено витрат:     {created_expenses} на суму: {total_expenses:.2f} €"
        )
        self.stdout.write(f"   ⚖️  Поточний баланс:     {balance:.2f} €")
        self.stdout.write(self.style.SUCCESS("=" * 65))
        self.stdout.write(self.style.SUCCESS("✅ Успішно завершено!"))
        self.stdout.write(self.style.SUCCESS("=" * 65))