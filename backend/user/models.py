from django.db import models

# Create your models here.
class Customer(models.Model):
    username = models.CharField(max_length = 20, primary_key=True)
    name = models.CharField(max_length = 20)
