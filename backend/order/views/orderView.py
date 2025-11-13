import logging
from collections import defaultdict

from django.db import transaction
from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.status import HTTP_400_BAD_REQUEST, HTTP_201_CREATED, HTTP_200_OK
from rest_framework.views import APIView
from snowflake import SnowflakeGenerator

from order.models import MasterOrder, SubOrder, OrderItem
from order.serializers import OrderSerializer, OrderCreateRequestSerializer
from product import productService
from product.product import Product

logger = logging.getLogger(__name__)
generator = SnowflakeGenerator(1)

class OrderView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='create order',
        request=OrderCreateRequestSerializer,
        responses={
            201: OrderSerializer,
            400: {"example": {"error": "string"}},
            401: OpenApiResponse(description='user not authenticated')
        },
    )

    @transaction.atomic
    def post(self, request: Request) -> Response:
        ser = OrderCreateRequestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        items = ser.validated_data['items']
        customer_username = ser.validated_data['customer_username']
        seller_groups = defaultdict(list)
        total_amount = 0

        # group products by sellers
        for row in items:
            product: Product|None = productService.get_product_by_id(product_id=row["product_id"])
            if product is None:
                return Response({"error": f"product {row['product_id']} not found"}, status=HTTP_400_BAD_REQUEST)
            if product.quantity < row["quantity"]:
                return Response({"error": f"product {row['product_id']} stock insufficient"}, status=HTTP_400_BAD_REQUEST)
            subtotal = row["quantity"] * product.price
            seller_groups[product.seller_username].append((product, row["quantity"], subtotal))
            total_amount += subtotal

        master_order_number = next(generator)
        master_order = MasterOrder.objects.create(
            order_number=master_order_number,
            customer_username=customer_username,
            total_amount=total_amount,
        )

        for seller_username, rows in seller_groups.items():
            sub_order_number = f"S-{next(generator)}"
            sub_total = sum(r[2] for r in rows)
            SubOrder.objects.create(
                master_order_number=master_order_number,
                sub_order_number=sub_order_number,
                seller_username=seller_username,
                total_amount=sub_total,
            )

            OrderItem.objects.bulk_create([
                OrderItem(
                    order_number=f"I-{next(generator)}",
                    master_order_number=master_order_number,
                    sub_order_number=sub_order_number,
                    product_id=r[0].id,
                    quantity=r[1],
                    unit_price=r[0].price,
                    total_amount=r[2],
                    status="placed"
                ) for r in rows
            ])

            for product, qty, _ in rows:
                product.quantity -= qty
                productService.add_or_update_product(product)
        return Response(OrderSerializer(master_order).data, status=HTTP_201_CREATED)

    @extend_schema(
        summary='list orders of an user',
        responses={
            401: OpenApiResponse(description='user not authenticated')
        },
    )
    def get(self, request: Request) -> Response:
        username = request.user.username
        orders = MasterOrder.objects.filter(customer_username=username)
        return Response(OrderSerializer(orders, many=True).data, status=HTTP_200_OK)




