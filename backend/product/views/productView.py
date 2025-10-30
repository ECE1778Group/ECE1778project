import logging
import uuid

from django.http import HttpRequest
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from product import productService
from product.product import Product
from product.serializers import ProductSerializer

logger = logging.getLogger(__name__)


class ProductView(APIView):

    @extend_schema(
        summary='add product',
        request=ProductSerializer,
        responses={
            201: ProductSerializer,
            400: OpenApiResponse(description="product info not complete or no picture uploaded"),
        },
    )
    def post(self, request: Request):
        data = request.data
        picture = request.FILES.get("picture")
        logger.info(data)
        serializer = ProductSerializer(data=data)
        if serializer.is_valid() and picture:
            product_id = uuid.uuid4().hex
            picture_url = f"backend/imageStorage/{product_id}.jpg"
            with open(picture_url, "wb") as file:
                file.write(picture.read())
            product = Product(picture_url=picture_url, **serializer.validated_data)
            productService.add_or_update_product(product, product_id)
            return Response({'id': product_id, "picture_url": picture_url, **serializer.data},
                            status=status.HTTP_201_CREATED)
        else:
            raise ValidationError(serializer.errors)
