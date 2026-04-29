from django.contrib import admin
from .models import ExpansionPack, InventoryLog


@admin.register(ExpansionPack)
class ExpansionPackAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'serial_code', 'price1', 'price2', 'qty_gwangju', 'qty_busan', 'qty_bonbu', 'qty_total')
    list_editable = ('serial_code', 'price1', 'price2', 'qty_gwangju', 'qty_busan', 'qty_bonbu')
    search_fields = ('name', 'serial_code')
    ordering = ('id',)
    readonly_fields = ('qty_total',)


@admin.register(InventoryLog)
class InventoryLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'pack', 'action', 'location', 'from_location', 'to_location', 'quantity')
    list_filter = ('action', 'location', 'from_location', 'to_location')
    search_fields = ('pack__name',)
    ordering = ('-timestamp',)
