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
from user.views.userView import (
    SendVerificationCodeView,
    VerifyCodeView,
    SignupView,
    SigninView,
    UpdateProfileView,
)

urlpatterns = [
    path("sendVerificationCode/", SendVerificationCodeView.as_view()),
    path("verifyCode/", VerifyCodeView.as_view()),
    path("signup/", SignupView.as_view()),
    path("signin/", SigninView.as_view()),
    path("updateProfile/", UpdateProfileView.as_view()),
]

