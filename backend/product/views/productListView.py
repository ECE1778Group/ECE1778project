import logging

from django.http import HttpRequest
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from product import productService
from product.serializers import ProductSerializer

logger = logging.getLogger(__name__)


class ProductListView(APIView):
    @extend_schema(
        summary='search product by keyword',
        parameters=[OpenApiParameter(name='keyword', type=str, location=OpenApiParameter.QUERY, required=True)],
        responses={200: ProductSerializer(many=True)},
    )
    def get(self,request: HttpRequest):
        """
        get products by keyword
        """
        data = request.GET
        logger.info(data)
        if data.get("keyword"):
            products: list[dict] = productService.list_products_by_keyword(data.get("keyword"))
            serializer = ProductSerializer(products, many=True)
            return Response(serializer.data)
        else:
            raise ValidationError(detail="keyword not provided")

