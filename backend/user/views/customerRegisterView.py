import logging

from django.http import HttpRequest
from drf_spectacular.utils import extend_schema
from rest_framework.exceptions import ValidationError
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from user import customerService
from user.models import Customer
from user.serializers import CustomerSerializer

logger = logging.getLogger(__name__)

class CustomerRegisterView(APIView):

    @extend_schema(
        summary='add Customer',
        request=CustomerSerializer,
        responses={
            200: {'type': 'object', 'properties': {'username': {'type': 'string'}}},
            400: {
                "example": {
                    "name": ["This field is required."]
                }
            }
        },
    )
    def post(self, request: Request):
        data = request.data
        logger.info(data)
        serializer = CustomerSerializer(data=data)
        if serializer.is_valid():
            username = request.data.get("username")
            customerService.customer_register(Customer(**serializer.validated_data))
            return Response({"username": username})
        else:
            raise ValidationError(serializer.errors)


