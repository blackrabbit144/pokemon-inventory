from rest_framework import serializers
from .models import ExpansionPack


class ExpansionPackSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpansionPack
        fields = '__all__'
