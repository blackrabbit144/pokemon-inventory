from django.contrib import admin
from .models import ExpansionPack


@admin.register(ExpansionPack)
class ExpansionPackAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'serial_code', 'price1', 'price2', 'quantity')
    list_editable = ('serial_code', 'price1', 'price2', 'quantity')
    search_fields = ('name', 'serial_code')
    ordering = ('id',)
