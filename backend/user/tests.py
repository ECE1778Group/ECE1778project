from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from unittest.mock import patch

from user.models import User


class UserAPITest(APITestCase):
    @patch("user.views.userView.create_user")
    def test_user_signup_and_get(self, mock_create_user):
        user = User.objects.create_user(
            email="alice@example.com",
            username="alice",
            password="Passw0rd!",
            first_name="Alice",
            last_name="Test",
        )

        mock_create_user.return_value = (True, user)

        payload = {
            "username": "alice",
            "password": "Passw0rd!",
            "email": "alice@example.com",
            "first_name": "Alice",
            "last_name": "Test",
        }

        url = "/api/user/signup/"

        res = self.client.post(url, payload, format="json")

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        self.assertIn("user", res.data)
        user_data = res.data["user"]
        self.assertEqual(user_data["email"], payload["email"])
        self.assertEqual(user_data["username"], payload["username"])
        self.assertEqual(user_data["first_name"], payload["first_name"])
        self.assertEqual(user_data["last_name"], payload["last_name"])