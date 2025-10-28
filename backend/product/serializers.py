from rest_framework import serializers

class ProductSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    title = serializers.CharField()
    description = serializers.CharField()
    price = serializers.FloatField()
    picture_url = serializers.URLField(read_only=True)
    category = serializers.CharField()
    seller_username = serializers.CharField()
    seller_name = serializers.CharField()
    quantity = serializers.IntegerField()
