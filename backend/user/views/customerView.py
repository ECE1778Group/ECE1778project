import logging

from drf_spectacular.utils import extend_schema
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from user import customerService
from user.serializers import CustomerSerializer

logger = logging.getLogger(__name__)

class CustomerView(APIView):
    @extend_schema(
        summary='get customer details',
        request={'type': 'object', 'properties': {'username': {'type': 'string'}}},
        responses={
            200: CustomerSerializer,
            404: {
                "example": {
                    "detail": "Not found."
                }
            }
        },
    )
    def get(self, request,username):
        customer = customerService.get_customer_details(username)
        if customer:
            serializer = CustomerSerializer(customer, many=False)
            return Response(serializer.data)
        else:
            raise NotFound()
