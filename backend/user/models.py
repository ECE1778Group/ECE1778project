from django.db import models
from django.core.validators import MinLengthValidator, MaxLengthValidator, RegexValidator
from django.contrib.auth.hashers import make_password, check_password

class User(models.Model):
    user_id = models.AutoField(primary_key=True)
    username = models.CharField(
        max_length=20,
        unique=True,
        validators=[
            MinLengthValidator(3),
            MaxLengthValidator(20),
            RegexValidator(regex=r'^[a-zA-Z0-9_-]+$', message="Only letters, numbers, -_ are allowed.")
        ]
    )
    password = models.CharField(max_length=128)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)

    def set_password(self, raw_password):
        self.password = make_password(raw_password)
        self.save()

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)

    def __str__(self):
        return self.username
