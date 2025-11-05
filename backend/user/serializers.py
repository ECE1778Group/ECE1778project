from rest_framework import serializers
from django.contrib.auth.hashers import check_password
from .models import User

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['user_id', 'username', 'password', 'email', 'first_name', 'last_name']

    def create(self, validated_data):
        raw_pwd = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(raw_pwd)
        return user
