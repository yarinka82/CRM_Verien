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
| `phone` | `VARCHAR(30)` | `TRUE` | - | - | Контактний телефон. |
| `join_date` | `DATE` | `FALSE` | - | - | Офіційна дата вступу (Cohort Analysis). |
| `status` | `VARCHAR(20)` | `FALSE` | `'active'` | `CHECK (status IN ('active', 'inactive'))` | Контроль статусу членства. |
| `is_founder` | `BOOLEAN` | `FALSE` | `false` | - | Прапорець засновника для юридичних звітів. |
| `birth_date` | `DATE` | `TRUE` | - | - | Дата народження. |
| `address` | `VARCHAR(255)` | `TRUE` | - | - | Адреса проживання. |
| `notes` | `TEXT` | `TRUE` | - | - | Додаткові примітки. |
| `created_at` | `TIMESTAMPTZ` | `FALSE` | `NOW()` | - | Аудит створення запису. |
| `updated_at` | `TIMESTAMPTZ` | `FALSE` | `NOW()` | - | Аудит останнього оновлення. |

**Relationships**
* Parent-таблиця, не має Foreign Keys.

**Indexes**
* `idx_member_status_join`: `(status, join_date)` — Оптимізація вибірки активних членів та сортування за датою вступу.

**Data quality rules**
* Унікальність `email` захистить від створення дублікатів профілів.

**Future analytics & Scalability**
У майбутньому таблиця легко розширюється зв'язком One-to-One для збереження додаткової інформації без перевантаження основної таблиці.

---

## 2. Table: `payments`

**Business purpose**
Центральний фінансовий реєстр організації. Об'єднує індивідуальні членські внески та зовнішні надходження (гранти, пожертви, спонсорство) згідно з вимогами бухгалтерії громадської організації (*Verein*).

**Fields**

| Field | PostgreSQL type | NULL | Default | Constraints | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `FALSE` | `IDENTITY` | `PRIMARY KEY` | Унікальний ID транзакції. |
| `member_id` | `BIGINT` | `TRUE` | - | `FOREIGN KEY` | Прив'язка до члена. NULL для грантів/пожертв/спонсорства. |
| `amount` | `NUMERIC(10,2)` | `FALSE` | - | `CHECK (amount > 0)` | Заборона від'ємних платежів. |
| `date` | `DATE` | `FALSE` | - | - | Фактична дата надходження коштів. |
| `type` | `VARCHAR(50)` | `FALSE` | - | `CHECK (type IN ('membership_fee', 'donation', 'sponsorship', 'grant'))` | Тип надходження. |
| `source_name` | `VARCHAR(100)` | `TRUE` | - | - | Назва фонду, спонсора або донора (якщо `member_id` IS NULL). |
| `period` | `VARCHAR(50)` | `TRUE` | - | - | Оплачуваний період (наприклад, "2026", "2026-Q1"). |
| `status` | `VARCHAR(20)` | `FALSE` | `'paid'` | `CHECK (status IN ('paid', 'owed'))` | Бухгалтерський статус: оплачено або заборговано. |
| `comment` | `TEXT` | `TRUE` | - | - | Додатковий контекст (наприклад, номер грантової угоди). |
| `created_at` | `TIMESTAMPTZ` | `FALSE` | `NOW()` | - | Аудит транзакції. |

**Relationships**
* `FOREIGN KEY (member_id) REFERENCES member(id) ON DELETE SET NULL`. **Критично:** При видаленні члена історія його платежів має залишатися (поле стає NULL) для збереження фінансової звітності та аудиту.

**Indexes**
* `idx_payment_date_status`: `(date, status)` — Оптимізує побудову фінансового огляду та аналіз заборгованостей (`owed`).
* `idx_payment_type_date`: `(type, date)` — Оптимізує звітність у розрізі джерел надходжень (членські внески проти грантів).

**Data quality rules**
* Використання бухгалтерських статусів (`paid` / `owed`) замість статусів платіжних шлюзів дозволяє ефективно вести облік заборгованостей членів організації.

**Future analytics & Scalability**
Архітектура готова до інтеграції Time Series моделей та прогнозування надходжень (Forecasting).

---

## 3. Інструкції для Backend (Django) Developers

Шановна команда бекенду, під час перенесення цієї архітектури в Django Models, будь ласка, дотримуйтесь наступних правил:

* **Enum / Choices:** Для полів `type` (`PaymentType`) та `status` (`PaymentStatus`) використовуйте `models.TextChoices`.
* **Amount Field:** Використовуйте `models.DecimalField(max_digits=10, decimal_places=2)`.
* **On Delete:** Для `member` у моделі `Payment` обов'язково використовуйте `on_delete=models.SET_NULL, null=True, blank=True`.

---

## 4. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    Member ||--o{ Payment : "makes (member_id SET NULL)"
    
    Member {
        BIGINT id PK
        VARCHAR first_name
        VARCHAR last_name
        VARCHAR email "UNIQUE"
        VARCHAR phone "NULL"
        DATE join_date
        VARCHAR status "active, inactive"
        BOOLEAN is_founder "DEFAULT false"
        DATE birth_date "NULL"
        VARCHAR address "NULL"
        TEXT notes "NULL"
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }
    
    Payment {
        BIGINT id PK
        BIGINT member_id FK "NULL"
        NUMERIC amount "CHECK > 0"
        DATE date
        VARCHAR type "membership_fee, donation, sponsorship, grant"
        VARCHAR source_name "NULL"
        VARCHAR period "NULL"
        VARCHAR status "paid, owed"
        TEXT comment "NULL"
        TIMESTAMPTZ created_at
    }