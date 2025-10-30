import logging

from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.request import Request
from rest_framework.response import Response
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
            404: NotFound,
        },
    )
    def get(self, request: Request, id: str) -> Response:
        data = request.data
        logger.info(data)
        product: Product = productService.get_product_by_id(id)
        if product:
            return Response(ProductSerializer(product).data)
        else:
            raise NotFound()

    @extend_schema(
        summary='modify a product',
        request=ProductSerializer,
        responses={
            200: {'type': 'object', 'properties': {'id': {'type': 'string'}}},
            400: OpenApiResponse(description="product info not complete"),
        },
    )
    def put(self, request: Request, product_id: str) -> OpenApiResponse:
        data = request.data
        picture = request.FILES.get("picture")
        logger.info(data)
        serializer = ProductSerializer(data=data)
        if serializer.is_valid() and picture:
            picture_url = f"backend/imageStorage/{product_id}.jpg"
            with open(picture_url, "wb") as file:
                file.write(picture.read())
            productService.add_or_update_product(
                Product(picture_url=picture_url, **serializer.validated_data), product_id)
            return OpenApiResponse({'id': product_id})
        else:
            raise ValidationError(serializer.errors)
