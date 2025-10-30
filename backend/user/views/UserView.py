import logging

from drf_spectacular.utils import extend_schema
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from user.models import User
from user.serializers import UserSerializer

logger = logging.getLogger(__name__)

class UserView(APIView):
    @extend_schema(
        summary='get User details',
        request={'type': 'object', 'properties': {'username': {'type': 'string'}}},
        responses={
            200: UserSerializer,
            404: {
                "example": {
                    "detail": "Not found."
                }
            }
        },
    )
    def get(self, request,username):
        try:
            user = User.objects.get(username=username)
            serializer = UserSerializer(user)
            return Response(serializer.data)
        except User.DoesNotExist:
            raise NotFound()
