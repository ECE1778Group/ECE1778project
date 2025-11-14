import logging
import uuid

from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from product import productService
from product.product import Product
from product.serializers import ProductSerializer

logger = logging.getLogger(__name__)


class ProductView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary='add product',
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'title': {'type': 'string'},
                    'description': {'type': 'string'},
                    'category': {'type': 'string'},
                    'price': {'type': 'number'},
                    'quantity': {'type': 'number'},
                    'picture': {'type': 'string', 'format': 'binary'},
                },
                'required': ['title', 'description', 'category', 'seller_username', 'price', 'picture'],
            }
        },
        responses={
            201: ProductSerializer,
            400: OpenApiResponse(description="product info not complete or no picture uploaded"),
            401: OpenApiResponse(description='user not authenticated'),
        },
    )
    def post(self, request: Request):
        data = request.data
        seller_username = request.user.username
        picture = request.FILES.get("picture")
        logger.info(data)
        serializer = ProductSerializer(data=data)
        if serializer.is_valid() and picture:
            product_id = uuid.uuid4().hex
            picture_url = f"backend/imageStorage/{product_id}.jpg"
            with open(picture_url, "wb") as file:
                file.write(picture.read())
            product = Product(id=product_id, picture_url=picture_url, seller_username=seller_username, **serializer.validated_data)
            productService.add_or_update_product(product)
            return Response({
                'id': product_id,
                "picture_url": picture_url,
                "seller_username": seller_username,
                **serializer.data
            },
                            status=status.HTTP_201_CREATED)
        else:
            raise ValidationError(serializer.errors)
