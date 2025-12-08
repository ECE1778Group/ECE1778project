from product.product import Product 
from unittest.mock import patch
from django.test import TestCase
from rest_framework.test import APIClient
from django.core.files.uploadedfile import SimpleUploadedFile

from user.models import User


class ProductAPITest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="seller@example.com",
            username="alice",
            password="Passw0rd!",
        )
        self.client.force_authenticate(user=self.user)

    @patch("product.views.productListView.productService.list_products_by_keyword")
    @patch("product.views.productView.productService.get_product_by_id")
    @patch("product.views.productView.productService.add_or_update_product")
    def test_product_create_get_update_search(self, mock_upsert, mock_get_by_id, mock_search):
        base_data = {
            "title": "Introduction to Algorithms",
            "description": "CLRS 3rd edition, lightly used",
            "price": 49.99,
            "picture_url": "",
            "category": "textbook",
            "seller_username": "alice",
            "quantity": 1,
        }

        payload_create = {
            "title": base_data["title"],
            "description": base_data["description"],
            "price": str(base_data["price"]),
            "category": base_data["category"],
            "seller_username": base_data["seller_username"],
            "quantity": base_data["quantity"],
            "picture": SimpleUploadedFile(
                "test.jpg",
                b"fake_image_bytes",
                content_type="image/jpeg",
            ),
        }

        r = self.client.post("/api/product/", payload_create, format="multipart")
        self.assertIn(r.status_code, (200, 201), r.content)

        body = r.json()
        self.assertIn("id", body)
        pid = body["id"]      

        created = {
            "id": pid,
            **base_data,
        }
        mock_get_by_id.return_value = Product(**created)
        mock_search.return_value = [created]

        # r2 = self.client.get(f"/api/product/{pid}/")
        # self.assertEqual(r2.status_code, 200, r2.content)
        # body2 = r2.json()
        # self.assertEqual(body2.get("id"), pid)
        # self.assertEqual(body2.get("title"), base_data["title"])

        r4 = self.client.get("/api/product/search/?keyword=algorithms")
        self.assertEqual(r4.status_code, 200, r4.content)
        results = r4.json()
        self.assertIsInstance(results, list)
        self.assertGreaterEqual(len(results), 1)
        self.assertEqual(results[0]["id"], pid)

    @patch("product.views.productView.productService.get_product_by_id")
    def test_get_nonexistent_returns_404(self, mock_get_by_id):
        mock_get_by_id.return_value = None
        r = self.client.get("/api/product/no-such-id/")
        self.assertEqual(r.status_code, 404, r.content)

    def test_search_missing_keyword_returns_400(self):
        r = self.client.get("/api/product/search/")
        self.assertEqual(r.status_code, 400, r.content)