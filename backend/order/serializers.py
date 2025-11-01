from rest_framework import serializers

from order.models import MasterOrder


class OrderSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(max_length=50, read_only=True)
    class Meta:
        model = MasterOrder
        fields = '__all__'

        def get_order_number(self, obj):
            return str(obj.order_number)

class OrderItemRequestSerializer(serializers.Serializer):
    product_id = serializers.CharField(max_length=50)
    quantity   = serializers.IntegerField(min_value=1)


class OrderCreateRequestSerializer(serializers.Serializer):
    items             = OrderItemRequestSerializer(many=True, allow_empty=False)
    customer_username = serializers.CharField(max_length=20)
