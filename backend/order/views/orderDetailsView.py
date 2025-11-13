from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from order import orderService
from order.orderService import *
from order.serializers import OrderDetailSerializer

logger = logging.getLogger(__name__)


class OrderDetailsView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='get an order details',

        responses={
            200: OrderDetailSerializer,
            404: NotFound,
            401: OpenApiResponse(description='user not authenticated')
        },
    )
    def get(self, request: Request, order_number: str) -> Response:
        data = request.data
        logger.info(data)
        order: MasterOrder = orderService.get_order_by_id(order_number)
        order_items = orderService.get_order_items_by_master_order_id(order_number)
        logger.info(f'query result:{order_items}')
        if order:
            logger.info(f"Order: {order.order_number}")
            serializer = OrderDetailSerializer(order, context={
                'items': order_items
            })
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            raise NotFound()
