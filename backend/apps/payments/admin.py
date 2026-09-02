from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Admin configuration for Payment: list view, filters, search and actions."""

    list_display = (
        "id",
        "member",
        "member_full_name",
        "amount",
        "type",
        "status",
        "date",
        "created_at",
    )
    list_select_related = ("member",)
    list_filter = ("type", "status", "date")
    search_fields = (
        "member__first_name",
        "member__last_name",
        "source_name",
        "comment",
    )
    readonly_fields = ("created_at",)
    date_hierarchy = "date"
    ordering = ("-date", "-created_at")
    list_per_page = 50

    actions = ("mark_as_paid", "mark_as_owed")

    def member_full_name(self, obj):
        if obj.member:
            return f"{obj.member.first_name} {obj.member.last_name}"
        return obj.source_name or "-"

    member_full_name.short_description = "Member"

    def mark_as_paid(self, request, queryset):
        updated = queryset.update(status=Payment.PaymentStatus.PAID)
        self.message_user(request, f"Marked {updated} payment(s) as paid.")

    mark_as_paid.short_description = "Mark selected payments as paid"

    def mark_as_owed(self, request, queryset):
        updated = queryset.update(status=Payment.PaymentStatus.OWED)
        self.message_user(request, f"Marked {updated} payment(s) as owed.")

    mark_as_owed.short_description = "Mark selected payments as owed"
