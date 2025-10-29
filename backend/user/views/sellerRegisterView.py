import logging

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import ValidationError
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
            201: SellerSerializer,
            400: {
                "example": {
                    "name": ["This field is required."]
                }
            }
        },
    )
    def post(self, request:Response):
        data = request.data
        logger.info(data)
        serializer = SellerSerializer(data=data)
        if serializer.is_valid():
            seller = Seller(**serializer.validated_data)
            sellerService.seller_register(seller)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            raise ValidationError(serializer.errors)


