import logging

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from user.serializers import UserSerializer

logger = logging.getLogger(__name__)

class UserRegisterView(APIView):

    @extend_schema(
        summary='add user',
        request=UserSerializer,
        description="username must be alphanumeric characters, number or -_  and between 3-20 characters.",
        responses={
            201: UserSerializer,
            400: {
                "example": {
                    "username": ["This field is required."]
                }
            }
        },
    )
    def post(self, request: Request):
        data = request.data
        logger.info(data)
        serializer = UserSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


