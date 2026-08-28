
from django.contrib import admin
from .models import Member

@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ('last_name', 'first_name', 'email', 'phone', 'join_date', 'status', 'is_founder')
    list_filter = ('status', 'is_founder')
    search_fields = ('last_name', 'first_name', 'email')