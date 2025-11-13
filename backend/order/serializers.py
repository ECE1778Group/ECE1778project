from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from order.models import MasterOrder, OrderItem


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

class OrderItemSerializer(serializers.ModelSerializer):
    master_order_number = serializers.CharField(write_only=True)
    sub_order_number = serializers.CharField(write_only=True)
    class Meta:
        model = OrderItem
        fields = '__all__'

class OrderDetailSerializer(OrderSerializer):
    items = serializers.SerializerMethodField()

    @extend_schema_field(OrderItemSerializer(many=True))
    def get_items(self, obj: MasterOrder):
        items = self.context.get('items')
        return OrderItemSerializer(items, many=True).data

    class Meta(OrderSerializer.Meta):
        fields = '__all__'