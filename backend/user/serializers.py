from rest_framework import serializers

from user.models import Customer


class SellerSerializer(serializers.Serializer):
    username = serializers.CharField()
    name = serializers.CharField()
    description = serializers.CharField()


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'