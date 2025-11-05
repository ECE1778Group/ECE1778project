import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema
from user.services.userService import (
    send_verification_code,
    verify_code,
    create_user,
    authenticate_user,
)

logger = logging.getLogger(__name__)

class SendVerificationCodeView(APIView):
    @extend_schema(
        summary="Send verification code to email",
        request={"type": "object", "properties": {"email": {"type": "string"}}},
        responses={200: {"example": {"message": "Verification code sent"}}},
    )
    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

        success, msg = send_verification_code(email)
        if success:
            return Response({"message": msg}, status=status.HTTP_200_OK)
        else:
            return Response({"error": msg}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerifyCodeView(APIView):
    @extend_schema(
        summary="Verify email verification code",
        request={
            "type": "object",
            "properties": {
                "email": {"type": "string"},
                "code": {"type": "string"},
            },
            "required": ["email", "code"],
        },
        responses={200: {"example": {"message": "Verification successful"}}},
    )
    def post(self, request):
        email = request.data.get("email")
        code = request.data.get("code")

        if not email or not code:
            return Response({"error": "Email and code are required"}, status=status.HTTP_400_BAD_REQUEST)

        success, msg = verify_code(email, code)
        if success:
            return Response({"message": msg}, status=status.HTTP_200_OK)
        else:
            return Response({"error": msg}, status=status.HTTP_400_BAD_REQUEST)

class SignupView(APIView):
    @extend_schema(
        summary="User signup",
        request={
            "type": "object",
            "properties": {
                "username": {"type": "string"},
                "password": {"type": "string"},
                "email": {"type": "string"},
                "first_name": {"type": "string"},
                "last_name": {"type": "string"},
            },
            "required": ["username", "password", "email"],
        },
        responses={201: {"example": {"message": "User created successfully"}}},
    )
    def post(self, request):
        data = request.data
        username = data.get("username")
        password = data.get("password")
        email = data.get("email")
        first_name = data.get("first_name", "")
        last_name = data.get("last_name", "")

        if not all([username, password, email]):
            return Response({"error": "username, password, and email are required"}, status=status.HTTP_400_BAD_REQUEST)

        success, result = create_user(username, password, email, first_name, last_name)
        if success:
            return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)
        else:
            return Response({"error": result}, status=status.HTTP_400_BAD_REQUEST)

class SigninView(APIView):
    @extend_schema(
        summary="User signin",
        request={
            "type": "object",
            "properties": {
                "username": {"type": "string"},
                "password": {"type": "string"},
            },
            "required": ["username", "password"],
        },
        responses={200: {"example": {"message": "Login successful"}}},
    )
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response({"error": "Username and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate_user(username, password)
        if user:
            return Response({"message": "Login successful"}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid username or password"}, status=status.HTTP_401_UNAUTHORIZED)
