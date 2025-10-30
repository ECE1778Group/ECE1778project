from django.contrib.auth.hashers import make_password
from rest_framework import serializers

from user.models import User


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = '__all__'

    def create(self, validated_data):
        raw_pwd = validated_data.pop('password')
        validated_data['password'] = make_password(raw_pwd)
        user = User(**validated_data)
        user.save()
        return user
