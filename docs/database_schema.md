# Database Architecture Guidelines (MVP: Phase 1)

Цей документ описує еталонну структуру бази даних для Verein Management System, правила якості даних (Data Quality) та вимоги до реалізації на рівні Django Backend.

**Головний принцип архітектури:** Simple now. Scalable later. Відмова від зайвих таблиць-словників на користь `CHECK` constraints для оптимізації продуктивності (уникнення проблеми N+1 query).

## 1. Table: `members`

**Business purpose**
Єдине джерело інформації про членів організації, їхній статус та життєвий цикл для CRM. База для майбутнього розрахунку Membership KPI (Retention, Churn Rate, Active Members).

**Fields**

| Field | PostgreSQL type | NULL | Default | Constraints | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `FALSE` | `IDENTITY` | `PRIMARY KEY` | Унікальний ID (сумісно з Django BigAutoField). |
| `first_name` | `VARCHAR(100)` | `FALSE` | - | - | Ім'я члена. |
| `last_name` | `VARCHAR(100)` | `FALSE` | - | - | Прізвище члена. |
| `email` | `VARCHAR(255)` | `TRUE` | - | `UNIQUE` | Унікальний email на рівні БД для уникнення дублів. |
| `phone` | `VARCHAR(50)` | `TRUE` | - | - | Контактний телефон. |
| `join_date` | `DATE` | `FALSE` | - | - | Офіційна дата вступу (Cohort Analysis). |
| `leave_date` | `DATE` | `TRUE` | - | `CHECK (leave_date >= join_date)` | Захист історичних даних для аналітики Churn Rate. |
| `status` | `VARCHAR(20)` | `FALSE` | `'active'` | `CHECK (status IN ('active', 'inactive'))` | Контроль статусу членства. |
| `is_founder` | `BOOLEAN` | `FALSE` | `false` | - | Прапорець засновника для юридичних звітів. |
| `created_at` | `TIMESTAMPTZ` | `FALSE` | `NOW()` | - | Аудит створення запису. |
| `updated_at` | `TIMESTAMPTZ` | `FALSE` | `NOW()` | - | Аудит останнього оновлення. |

**Relationships**
* Parent-таблиця, не має Foreign Keys.

**Indexes**
* `idx_members_status`: `(status)` — Оптимізація вибірки активних членів (`WHERE status = 'active'`).
* `idx_members_join_date`: `(join_date)` — Оптимізація побудови графіків росту бази (Member Growth).

**Data quality rules**
* Унікальність `email` захистить від створення дублікатів профілів.
* `leave_date` логічно не може передувати `join_date`.

**Future analytics & Scalability**
У майбутньому таблиця легко розширюється зв'язком One-to-One (наприклад, `member_profiles`) для збереження додаткової біографічної інформації без перевантаження основної таблиці.

---

## 2. Table: `payments`

**Business purpose**
Центральний фінансовий реєстр організації. Використовує поліморфну структуру для об'єднання індивідуальних членських внесків та зовнішніх надходжень (гранти, пожертви).

**Fields**

| Field | PostgreSQL type | NULL | Default | Constraints | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `FALSE` | `IDENTITY` | `PRIMARY KEY` | Унікальний ID транзакції. |
| `member_id` | `BIGINT` | `TRUE` | - | `FOREIGN KEY` | Прив'язка до члена. NULL для грантів/пожертв. |
| `amount` | `NUMERIC(12,2)` | `FALSE` | - | `CHECK (amount > 0)` | Заборона від'ємних платежів. |
| `payment_date`| `DATE` | `FALSE` | - | - | Фактична дата надходження коштів. |
| `payment_type`| `VARCHAR(30)` | `FALSE` | - | `CHECK (payment_type IN (...))`| `membership_fee`, `donation`, `sponsorship`, `grant`. |
| `source_name` | `VARCHAR(255)` | `TRUE` | - | - | Назва фонду/спонсора (якщо `member_id` IS NULL). |
| `period_start`| `DATE` | `TRUE` | - | - | Початок оплаченого періоду (для внесків). |
| `period_end` | `DATE` | `TRUE` | - | `CHECK (period_end >= period_start)`| Кінець оплаченого періоду. |
| `status` | `VARCHAR(20)` | `FALSE` | `'completed'`| `CHECK (status IN ('completed', 'pending', 'failed'))`| Статус платежу. |
| `comment` | `TEXT` | `TRUE` | - | - | Додатковий контекст (наприклад, номер грантової угоди). |
| `created_at` | `TIMESTAMPTZ` | `FALSE` | `NOW()` | - | Аудит транзакції. |
| `updated_at` | `TIMESTAMPTZ` | `FALSE` | `NOW()` | - | Аудит останнього оновлення. |

**Relationships**
* `FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL`. **Критично:** При видаленні члена історія його платежів має залишатися для коректної фінансової аналітики.

**Indexes**
* `idx_payments_member_id`: `(member_id)` — Оптимізує завантаження історії платежів на "Картці члена".
* `idx_payments_date_type`: `(payment_date, payment_type)` — Оптимізує побудову "Фінансового огляду" та розрахунок Revenue.

**Data quality rules**
* Текстовий `period` з початкового ТЗ замінено на `period_start` та `period_end` (`DATE`), щоб забезпечити можливість розрахунку заборгованості (Outstanding Payments) через SQL.

**Future analytics & Scalability**
Готовність до Forecasting (Time Series моделі). При розширенні системи достатньо буде додати поле `project_id` для прив'язки фінансів до конкретних проєктів та заходів.

---

## 3. Інструкції для Backend (Django) Developers

Шановна команда бекенду, під час перенесення цієї архітектури в Django Models, будь ласка, дотримуйтесь наступних правил:

* **Enum / Choices:** Для полів `status` (в обох таблицях) та `payment_type` використовуйте `models.TextChoices`. Не створюйте окремі таблиці-словники, це вдарить по продуктивності БД.
* **Amount Field:** Використовуйте `models.DecimalField(max_digits=12, decimal_places=2)`. Уникайте `FloatField` для фінансів.
* **Constraints in Meta:** Реалізуйте перевірки БД безпосередньо в класі `Meta` кожної моделі за допомогою `CheckConstraint`:
  * Перевірка цілісності дат: `leave_date >= join_date` та `period_end >= period_start`.
  * Перевірка суми: `amount > 0`.
* **On Delete:** Для `member_id` в таблиці `payments` обов'язково встановіть `on_delete=models.SET_NULL, null=True`.

---

## 4. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    MEMBERS ||--o{ PAYMENTS : "makes (member_id SET NULL)"
    
    MEMBERS {
        BIGINT id PK
        VARCHAR first_name
        VARCHAR last_name
        VARCHAR email "UNIQUE, NULL"
        VARCHAR phone "NULL"
        DATE join_date
        DATE leave_date "CHECK >= join_date"
        VARCHAR status "active, inactive"
        BOOLEAN is_founder "DEFAULT false"
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }
    
    PAYMENTS {
        BIGINT id PK
        BIGINT member_id FK "NULL"
        NUMERIC amount "CHECK > 0"
        DATE payment_date
        VARCHAR payment_type
        VARCHAR source_name "NULL"
        DATE period_start "NULL"
        DATE period_end "NULL (CHECK >= period_start)"
        VARCHAR status "completed, pending, failed"
        TEXT comment "NULL"
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }