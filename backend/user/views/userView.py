import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema
from rest_framework_simplejwt.tokens import RefreshToken
from user.services.userService import (
    send_verification_code,
    verify_code,
    create_user,
    authenticate_user,
)
from ..models import User
from ..serializers import UserSerializer
from rest_framework.permissions import IsAuthenticated

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
        summary="user signup",
        request=UserSerializer,
    )
    def post(self, request):
        data = request.data
        username = data.get("username")
        password = data.get("password")
        email = data.get("email")
        first_name = data.get("first_name", "")
        last_name = data.get("last_name", "")

        success, result = create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            username=username
        )

        if not success:
            return Response({"error": result}, status=status.HTTP_400_BAD_REQUEST)
        
        user = result
        serializer = UserSerializer(user)
        return Response(
            {"message": "User created successfully", "user": serializer.data},
            status=status.HTTP_201_CREATED
        )
    
class SigninView(APIView):
    @extend_schema(
        summary="User Signin",
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "email": {"type": "string"},
                    "password": {"type": "string"},
                },
                "required": ["email", "password"],
            }

        },
        responses={
            200: {
                "example": {
                    "token": "<JWT_ACCESS_TOKEN>",
                    "user": {
                        "userId": 1,
                        "username": "zijin",
                        "email": "zijin@example.com",
                        "first_name": "Zijin",
                        "last_name": "Liao"
                    },
                }
            }
        },
    )
    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        if not email or not password:
            return Response(
                {"error": "email and password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate_user(email, password)
        if not user:
            return Response(
                {"error": "Invalid username or password"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        user_data = {
            "userId": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
        }

        return Response(
            {
                "access": access_token,
                "refresh": str(refresh),
                "user": user_data,
            },
            status=status.HTTP_200_OK,
        )

class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = request.user
        
        if "email" in request.data:
            new_email = request.data["email"]
            if user.email != new_email and user.__class__.objects.filter(email=new_email).exists():
                return Response(
                    {"error": "This email is already registered."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Profile updated successfully",
                    "user": serializer.data
                },
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
