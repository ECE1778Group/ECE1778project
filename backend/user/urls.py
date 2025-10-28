"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path

from .views.customerRegisterView import CustomerRegisterView
from .views.sellerRegisterView import SellerRegisterView
from .views.sellerView import SellerView
from .views.customerView import CustomerView
urlpatterns = [
    path('seller/register/', SellerRegisterView.as_view()),
    path('customer/register/', CustomerRegisterView.as_view()),

    path('seller/<str:username>/', SellerView.as_view()),
    path('customer/<str:username>/', CustomerView.as_view()),
]

