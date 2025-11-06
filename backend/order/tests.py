from product.product import Product 
from unittest.mock import patch
from django.test import TestCase
from rest_framework.test import APIClient

class OrderAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

    @patch("order.views.orderCreateView.productService.add_or_update_product")
    @patch("order.views.orderCreateView.productService.get_product_by_id")
    def test_order_create_and_get(self, mock_get_product, mock_add_or_update):
        
        product_obj = Product(
            id="book_123",
            title="Operating Systems: Three Easy Pieces (Used)",
            description="Gently used, minor notes, no missing pages.",
            price=25.50,                 
            picture_url="",             
            category="books",
            seller_username="alice",
            quantity=1
        )
        mock_get_product.return_value = product_obj
        mock_add_or_update.return_value = None  
        payload = {
            "customer_username": "alice",
            "items": [
                {"product_id": "book_123", "quantity": 1, "unit_price": 25.50}
            ]
        }
        res = self.client.post("/api/order/", payload, format="json")
        self.assertIn(res.status_code, (200, 201), res.content)
        order_no = res.json()["order_number"]

        res2 = self.client.get(f"/api/order/{order_no}/")
        self.assertEqual(res2.status_code, 200, res2.content)

    def test_order_not_found(self):
        res = self.client.get("/api/order/999999999999/")
        self.assertEqual(res.status_code, 404, res.content)