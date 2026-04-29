from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import ExpansionPack
from .serializers import ExpansionPackSerializer


class ExpansionPackViewSet(viewsets.ReadOnlyModelViewSet):
    """拡張パック一覧・詳細API（ログイン必須）"""
    queryset = ExpansionPack.objects.all()
    serializer_class = ExpansionPackSerializer
    permission_classes = [IsAuthenticated]
