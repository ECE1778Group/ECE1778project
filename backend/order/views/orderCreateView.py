import logging

from drf_spectacular.utils import extend_schema
from elasticsearch import Elasticsearch
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from snowflake import SnowflakeGenerator

from backend.globalvars import get_es_client
from order import orderService
from order.models import Order
from order.serializers import OrderSerializer
from product.product import Product

logger = logging.getLogger(__name__)


class OrderCreateView(APIView):
    @extend_schema(
        summary='create order',
        request=OrderSerializer,
        responses={
            201: OrderSerializer,
            400: {
                "example": {
                    "price": ["This field is required."]
                }
            }
        },
    )
    # TODO add validation
    def post(self, request: Request) -> Response:
        data = request.data
        logger.info(data)
        serializer = OrderSerializer(data=data)
        if serializer.is_valid():
            generator = SnowflakeGenerator(1)
            id = next(generator)
            order = Order(id=id, **serializer.validated_data)
            product_id = order.product_id
            es: Elasticsearch = get_es_client()
            es_result = es.get(index="product", id=product_id.hex)
            product = Product(**es_result.get("_source"))
            if product and product.quantity >= order.quantity:
                orderService.create_order(order)
                # don't consider data consistency here
                es.update(index="product", id=product_id.hex, doc={
                    "quantity": product.quantity - order.quantity,
                })
                return Response({"id": str(id), **serializer.data}, status=status.HTTP_201_CREATED)
            else:
                raise ValidationError({"message": "This product is not available"})
        else:
            raise ValidationError(serializer.errors)


