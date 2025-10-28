import logging
import uuid

from django.http import HttpRequest
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter
from rest_framework.exceptions import NotFound, ValidationError
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
            200: {'type': 'object', 'properties': {'id': {'type': 'string'}}},
            400: OpenApiResponse(description="product info not complete"),
        },
    )
    def post(self, request: HttpRequest):
        data = request.POST
        picture = request.FILES.get("picture")
        logger.info(data)
        serializer = ProductSerializer(data=data)
        if serializer.is_valid() and picture:
            product_id = uuid.uuid4().hex
            picture_url = f"backend/imageStorage/{product_id}.jpg"
            with open(picture_url, "wb") as file:
                file.write(picture.read())
            productService.add_or_update_product(
                Product(picture_url=picture_url, **serializer.validated_data), product_id)
            return Response({'id': product_id})
        else:
            raise ValidationError(serializer.errors)
