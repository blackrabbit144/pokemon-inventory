from rest_framework import serializers
from .models import ExpansionPack, InventoryLog, PhotoRecord


class ExpansionPackSerializer(serializers.ModelSerializer):
    qty_total = serializers.ReadOnlyField()

    class Meta:
        model = ExpansionPack
        fields = '__all__'


class InventoryLogSerializer(serializers.ModelSerializer):
    pack_name = serializers.CharField(source='pack.name', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    location_display = serializers.SerializerMethodField()

    class Meta:
        model = InventoryLog
        fields = '__all__'

    def get_location_display(self, obj):
        location_map = {'gwangju': '광주', 'busan': '부산', 'bonbu': '본부'}
        if obj.action == 'transfer':
            return f"{location_map.get(obj.from_location, '')} → {location_map.get(obj.to_location, '')}"
        return location_map.get(obj.location, '')


class PhotoRecordSerializer(serializers.ModelSerializer):
    location_display = serializers.SerializerMethodField()

    class Meta:
        model = PhotoRecord
        fields = '__all__'

    def get_location_display(self, obj):
        location_map = {'gwangju': '광주', 'busan': '부산', 'bonbu': '본부'}
        return location_map.get(obj.location, '')
