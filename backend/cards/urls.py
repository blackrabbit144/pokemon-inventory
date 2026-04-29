from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExpansionPackViewSet

router = DefaultRouter()
router.register(r'packs', ExpansionPackViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
