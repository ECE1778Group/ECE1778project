from django.http import HttpResponse


def list_products(request):
    return HttpResponse("Hello World")