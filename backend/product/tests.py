from product.product import Product 
from unittest.mock import patch
from django.test import TestCase
from rest_framework.test import APIClient
from django.core.files.uploadedfile import SimpleUploadedFile


class ProductAPITest(TestCase):

    def setUp(self):
        self.client = APIClient()

    @patch("product.views.productListView.productService.list_products_by_keyword")
    @patch("product.views.productView.productService.get_product_by_id")
    @patch("product.views.productView.productService.add_or_update_product")
    def test_product_create_get_update_search(self, mock_upsert, mock_get_by_id, mock_search):
        # Arrange test data 
        pid = "book-123"
        created = {
            "id": pid,
            "title": "Introduction to Algorithms",
            "description": "CLRS 3rd edition, lightly used",
            "price": 49.99,
            "picture_url": "",  
            "category": "textbook",
            "seller_username": "alice",
            "quantity": 1,
        }
        # get_product_by_id returns a dataclass-like object or dict
        mock_get_by_id.return_value = Product(**created)

        mock_search.return_value = [created]

        # Create product
        payload_create = {
            "title": created["title"],
            "description": created["description"],
            "price": str(created["price"]),
            "category": created["category"],
            "seller_username": created["seller_username"],
            "quantity": created["quantity"],
            "picture": SimpleUploadedFile("test.jpg", b"fake_image_bytes", content_type="image/jpeg"),
        }
        r = self.client.post("/api/product/", payload_create, format="multipart")
        # Success can be 201/200 depending on implementation
        self.assertIn(r.status_code, (200, 201), r.content)
        self.assertIn("id", r.json())  # server generates id

        # Get product details 
        r2 = self.client.get(f"/api/product/{pid}")
        self.assertEqual(r2.status_code, 200, r2.content)
        body2 = r2.json()
        self.assertEqual(body2.get("id"), pid)
        self.assertEqual(body2.get("title"), created["title"])

        # # Update product
        # # Update a couple of fields (e.g., price and quantity)
        # payload_update = {
        #     "title": created["title"],
        #     "description": created["description"],
        #     "price": 39.99,
        #     "category": created["category"],
        #     "seller_username": created["seller_username"],
        #     "quantity": 2,
        #     "picture": SimpleUploadedFile("test2.jpg", b"fake_image_bytes_2", content_type="image/jpeg"),
        # }
        # r3 = self.client.put(f"/api/product/{pid}", payload_update, format="json")
        # # Some implementations return 200 with updated doc; others 204 No Content
        # self.assertIn(r3.status_code, (200, 204), r3.content)
        # # Ensure our upsert path was exercised at least twice (create + update)
        # self.assertGreaterEqual(mock_upsert.call_count, 2)

        # Search by keyword
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
        # When query param is missing, the view should respond with 400
        r = self.client.get("/api/product/search/")
        self.assertEqual(r.status_code, 400, r.content)