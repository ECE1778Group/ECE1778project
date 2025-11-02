from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

# Create your tests here.
class UserAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_user_register_and_get(self):
        payload = {
            "username": "user_testcase",
            "password": "Passw0rd!"
        }
        res = self.client.post("/api/user/register/", payload, format="json")
        self.assertIn(res.status_code, (200, 201))
        data = res.json()
        self.assertEqual(data.get("username"), payload["username"])

        res2 = self.client.get(f"/api/user/{payload['username']}/")
        self.assertEqual(res2.status_code, 200)
        got = res2.json()
        self.assertEqual(got.get("username"), payload["username"])

        res3 = self.client.get("/api/user/nonexistent_user/")
        self.assertEqual(res3.status_code, status.HTTP_404_NOT_FOUND)
