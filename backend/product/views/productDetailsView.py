import logging

from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK
from rest_framework.views import APIView

from product import productService
from product.product import Product
from product.serializers import ProductSerializer

logger = logging.getLogger(__name__)


class ProductDetailsView(APIView):

    @extend_schema(
        summary='get a product details',

        responses={
            200: ProductSerializer,
            404: OpenApiResponse(description='product not found'),
        },
    )
    def get(self, request: Request, id: str) -> Response:
        """
        get product by id, if not found, return 404
        """
        data = request.data
        logger.info(data)
        product: Product = productService.get_product_by_id(id)
        if product:
            return Response(ProductSerializer(product).data)
        else:
            raise NotFound()

    @extend_schema(
        summary='modify a product',
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'title': {'type': 'string'},
                    'description': {'type': 'string'},
                    'category': {'type': 'string'},
                    'seller_username': {'type': 'string'},
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
        },
    )
    def put(self, request: Request, product_id: str) -> Response:
        """
        update product details
        1. verify the request is valid, new picture is provided
        """
        data = request.data
        picture = request.FILES.get("picture")
        logger.info(data)
        serializer = ProductSerializer(data=data)
        if serializer.is_valid() and picture:
            picture_url = f"backend/imageStorage/{product_id}.jpg"
            with open(picture_url, "wb") as file:
                file.write(picture.read())
            productService.add_or_update_product(
                Product(id=product_id, picture_url=picture_url, **serializer.validated_data))
            return Response({'id': product_id, "picture_url": picture_url, **serializer.data},
                            status=HTTP_200_OK)
        else:
            raise ValidationError(serializer.errors)
