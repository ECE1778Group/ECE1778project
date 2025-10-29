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
    def get(self, request: Request, id: str) -> Response:
        data = request.data
        logger.info(data)
        order: Order = orderService.get_order_by_id(id)
        if order:
            order_data = OrderSerializer(order).data
            order_data['id'] = str(order.id)
            return Response(order_data)
        else:
            raise NotFound()
