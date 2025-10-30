from django.core.validators import MinLengthValidator, MaxLengthValidator, RegexValidator
from django.db import models

# Create your models here.
class User(models.Model):
    username = models.CharField(max_length = 20, primary_key=True, validators=[
        MinLengthValidator(3),
        MaxLengthValidator(20),
        RegexValidator(regex=r'^[a-zA-Z0-9_-]+$', message="Only alphanumeric characters, number, -_ are allowed.")
    ])
    password = models.CharField(max_length = 128)
