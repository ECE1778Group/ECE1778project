from django.db import models

# Create your models here.


class MasterOrder(models.Model):
    order_number = models.BigIntegerField(primary_key=True)
    customer_username = models.CharField(max_length=20)
    total_amount = models.PositiveIntegerField(default=0, help_text="cents")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class SubOrder(models.Model):
    master_order_number = models.BigIntegerField()
    sub_order_number = models.CharField(primary_key=True, max_length=23)
    seller_username = models.CharField(max_length=20)
    total_amount = models.PositiveIntegerField(default=0, help_text="cents")

class OrderItem(models.Model):
    master_order_number = models.BigIntegerField()
    order_number = models.CharField(primary_key=True, max_length=23)
    sub_order_number = models.CharField(max_length=23)
    product_id = models.CharField(max_length=50)
    quantity = models.PositiveIntegerField(default=0)
    unit_price = models.PositiveIntegerField(default=0, help_text="cents")
    total_amount = models.PositiveIntegerField(default=0, help_text="cents")
    status = models.CharField(max_length=50, default="placed")

    def save(self, *args, **kwargs):
        self.total_amount = self.quantity * self.unit_price
        super().save(*args, **kwargs)