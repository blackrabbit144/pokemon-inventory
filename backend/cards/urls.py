from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ExpansionPackViewSet, InventoryLogViewSet,
    inventory_add, inventory_remove, inventory_transfer,
    PhotoRecordViewSet, photo_upload, photo_delete,
)

router = DefaultRouter()
router.register(r'packs', ExpansionPackViewSet)
router.register(r'logs', InventoryLogViewSet)
router.register(r'photos', PhotoRecordViewSet)

urlpatterns = [
    path('inventory/add/', inventory_add),
    path('inventory/remove/', inventory_remove),
    path('inventory/transfer/', inventory_transfer),
    path('photos/upload/', photo_upload),
    path('photos/<int:pk>/delete/', photo_delete),
    path('', include(router.urls)),
]
