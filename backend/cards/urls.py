from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExpansionPackViewSet, InventoryLogViewSet, inventory_add, inventory_remove, inventory_transfer

router = DefaultRouter()
router.register(r'packs', ExpansionPackViewSet)
router.register(r'logs', InventoryLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('inventory/add/', inventory_add),
    path('inventory/remove/', inventory_remove),
    path('inventory/transfer/', inventory_transfer),
]
