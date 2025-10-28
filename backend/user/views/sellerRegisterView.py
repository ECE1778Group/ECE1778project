import logging

from django.http import HttpRequest
from drf_spectacular.utils import extend_schema
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from user import sellerService
from user.seller import Seller
from user.serializers import SellerSerializer

logger = logging.getLogger(__name__)


class SellerRegisterView(APIView):
    @extend_schema(
        summary='add seller',
        request=SellerSerializer,
        responses={
            200: {'type': 'object', 'properties': {'username': {'type': 'string'}}},
            400: {
                "example": {
                    "name": ["This field is required."]
                }
            }
        },
    )
    def post(self, request:HttpRequest):
        data = request.POST
        logger.info(data)
        serializer = SellerSerializer(data=data)
        if serializer.is_valid():
            username = data.get("username")
            sellerService.seller_register(Seller(**serializer.validated_data))
            return Response({"username": username})
        else:
            raise ValidationError(serializer.errors)


