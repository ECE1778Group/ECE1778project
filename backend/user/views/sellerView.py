import logging

from drf_spectacular.utils import extend_schema
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from user import sellerService
from user.serializers import SellerSerializer

logger = logging.getLogger(__name__)


class SellerView(APIView):

    @extend_schema(
        summary='get seller details',
        request={'type': 'object', 'properties': {'username': {'type': 'string'}}},
        responses={
            200: SellerSerializer,
            404: {
                "example": {
                    "detail": "Not found."
                }
            }
        },
    )
    def get(self, request,username):
        seller = sellerService.get_seller_details(username)
        if seller:
            serializer = SellerSerializer(seller)
            return Response(serializer.data)
        else:
            raise NotFound()
