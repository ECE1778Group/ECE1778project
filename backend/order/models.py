from django.db import models

# Create your models here.
class Order(models.Model):
    id = models.BigIntegerField(primary_key=True)
    customer_id = models.CharField(max_length=20)
    seller_id = models.CharField(max_length=20)
    quantity = models.IntegerField()
    price = models.FloatField()
    product_id = models.UUIDField(max_length=20)
