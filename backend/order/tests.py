from types import SimpleNamespace
from unittest.mock import patch
from django.test import TestCase
from rest_framework.test import APIClient

class OrderAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

    @patch("order.views.orderCreateView.productService.add_or_update_product")
    @patch("order.views.orderCreateView.productService.get_product_by_id")
    def test_order_create_and_get(self, mock_get_product, mock_add_or_update):
        
        product = SimpleNamespace(
            id="p123",
            title="Phone",
            description="Test",
            price=9999,          
            picture_url="",
            category="electronics",
            seller_username="seller_x",
            quantity=100
        )
        mock_get_product.return_value = product
        mock_add_or_update.return_value = None  
        payload = {
            "customer_username": "alice",
            "items": [
                {"product_id": "p123", "quantity": 2, "unit_price": 9999}
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