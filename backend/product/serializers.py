from rest_framework import serializers

class ProductSerializer(serializers.Serializer):
    """
    Serializer for product
    id, picture_url, seller_username is not required in the request, they will be generated
    """
    id = serializers.CharField(read_only=True)
    title = serializers.CharField()
    description = serializers.CharField()
    price = serializers.FloatField()
    picture_url = serializers.URLField(read_only=True)
    category = serializers.CharField()
    seller_username = serializers.CharField(read_only=True)
    quantity = serializers.IntegerField()
