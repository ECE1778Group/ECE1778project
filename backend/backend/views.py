from django.http import HttpResponse, HttpRequest
from django.views.decorators.http import require_http_methods
import logging
from . import productService
from . import sellerService

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(handler)

@require_http_methods(["GET"])
def list_products(request):
    productService.list_products()
    return HttpResponse("Hello World")

@require_http_methods(["POST"])
def seller_register(request:HttpRequest):
    data = request.POST
    logger.info(data)
    if data.get("username") and data.get("name") and data.get("description"):
        username = request.POST.get("username")
        name = request.POST.get("name")
        description = request.POST.get("description")
        username = sellerService.seller_register(username, name, description)
        if username:
            return HttpResponse(username)
        else:
            return HttpResponse("registration failed", status=500)
    else:
        return HttpResponse("username, name or description not provided", status=400)

@require_http_methods(["GET"])
def get_seller_details(request,username):
    details = sellerService.get_seller_details(username)
    if details:
        return HttpResponse(details)
    else:
        return HttpResponse("seller details not found", status=404)