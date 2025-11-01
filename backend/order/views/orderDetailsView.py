from drf_spectacular.utils import extend_schema
from rest_framework.exceptions import NotFound
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from order import orderService
from order.orderService import *
from order.serializers import OrderSerializer

logger = logging.getLogger(__name__)


class OrderDetailsView(APIView):

    @extend_schema(
        summary='get an order details',

        responses={
            200: OrderSerializer,
            404: NotFound,
        },
    )
    def get(self, request: Request, order_number: str) -> Response:
        data = request.data
        logger.info(data)
        order: MasterOrder = orderService.get_order_by_id(order_number)
        if order:
            logger.info(f"Order: {order.order_number}")
            return Response(OrderSerializer(order).data)
        else:
            raise NotFound()
