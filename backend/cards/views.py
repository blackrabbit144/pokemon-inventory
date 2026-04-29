from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction
from .models import ExpansionPack, InventoryLog
from .serializers import ExpansionPackSerializer, InventoryLogSerializer

LOCATION_FIELD = {
    'gwangju': 'qty_gwangju',
    'busan': 'qty_busan',
    'bonbu': 'qty_bonbu',
}


class ExpansionPackViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ExpansionPack.objects.all()
    serializer_class = ExpansionPackSerializer
    permission_classes = [IsAuthenticated]


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def inventory_add(request):
    """在庫入庫"""
    pack_id = request.data.get('pack_id')
    location = request.data.get('location')
    quantity = int(request.data.get('quantity', 0))

    if quantity <= 0:
        return Response({'error': '수량은 1 이상이어야 합니다.'}, status=400)
    if location not in LOCATION_FIELD:
        return Response({'error': '올바른 위치를 선택해주세요.'}, status=400)

    with transaction.atomic():
        pack = ExpansionPack.objects.select_for_update().get(id=pack_id)
        setattr(pack, LOCATION_FIELD[location], getattr(pack, LOCATION_FIELD[location]) + quantity)
        pack.save()
        InventoryLog.objects.create(
            pack=pack, action='add', location=location, quantity=quantity
        )

    return Response(ExpansionPackSerializer(pack).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def inventory_remove(request):
    """在庫出庫"""
    pack_id = request.data.get('pack_id')
    location = request.data.get('location')
    quantity = int(request.data.get('quantity', 0))

    if quantity <= 0:
        return Response({'error': '수량은 1 이상이어야 합니다.'}, status=400)
    if location not in LOCATION_FIELD:
        return Response({'error': '올바른 위치를 선택해주세요.'}, status=400)

    with transaction.atomic():
        pack = ExpansionPack.objects.select_for_update().get(id=pack_id)
        current = getattr(pack, LOCATION_FIELD[location])
        if current < quantity:
            return Response({'error': '재고가 부족합니다.'}, status=400)
        setattr(pack, LOCATION_FIELD[location], current - quantity)
        pack.save()
        InventoryLog.objects.create(
            pack=pack, action='remove', location=location, quantity=quantity
        )

    return Response(ExpansionPackSerializer(pack).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def inventory_transfer(request):
    """在庫移動"""
    pack_id = request.data.get('pack_id')
    from_location = request.data.get('from_location')
    to_location = request.data.get('to_location')
    quantity = int(request.data.get('quantity', 0))

    if quantity <= 0:
        return Response({'error': '수량은 1 이상이어야 합니다.'}, status=400)
    if from_location not in LOCATION_FIELD or to_location not in LOCATION_FIELD:
        return Response({'error': '올바른 위치를 선택해주세요.'}, status=400)
    if from_location == to_location:
        return Response({'error': '출발지와 도착지가 같습니다.'}, status=400)

    with transaction.atomic():
        pack = ExpansionPack.objects.select_for_update().get(id=pack_id)
        current = getattr(pack, LOCATION_FIELD[from_location])
        if current < quantity:
            return Response({'error': '재고가 부족합니다.'}, status=400)
        setattr(pack, LOCATION_FIELD[from_location], current - quantity)
        setattr(pack, LOCATION_FIELD[to_location], getattr(pack, LOCATION_FIELD[to_location]) + quantity)
        pack.save()
        InventoryLog.objects.create(
            pack=pack, action='transfer',
            from_location=from_location, to_location=to_location,
            quantity=quantity
        )

    return Response(ExpansionPackSerializer(pack).data)


class InventoryLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = InventoryLog.objects.select_related('pack').all()
    serializer_class = InventoryLogSerializer
    permission_classes = [IsAuthenticated]
