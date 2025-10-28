import uuid

from django.http import HttpResponse, HttpRequest
from django.views.decorators.http import require_http_methods
import logging
from product import productService
from product.product import Product

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(handler)

@require_http_methods(["GET"])
def list_products(request):
    data = request.GET
    logger.info(data)
    if data.get("keyword"):
        products: list[Product] = productService.list_products_by_keyword(data.get("keyword"))
        if products:
            return HttpResponse(products)
        else:
            return HttpResponse("product not found", status=404)
    else:
        return HttpResponse("keyword not found", status=400)

@require_http_methods(["POST"])
def add_product(request:HttpRequest):
    data = request.POST
    picture = request.FILES.get("picture")
    logger.info(data)
    if (data.get("title") and data.get("description") and data.get("price")
            and data.get("category") and data.get("seller_username") and data.get("seller_name")
            and data.get("quantity") and picture):
        title = request.POST.get("title")
        description = request.POST.get("description")
        price = request.POST.get("price")
        category = request.POST.get("category")
        seller_username = request.POST.get("seller_username")
        seller_name = request.POST.get("seller_name")
        quantity = request.POST.get("quantity")
        product_id = uuid.uuid4().hex
        picture_url = f"backend/imageStorage/{product_id}.jpg"
        try:
            with open(picture_url, "wb") as file:
                file.write(picture.read())
        except Exception as e:
            logger.error(e)
            return HttpResponse("writing picture failed", status=500)

        success = productService.add_product(Product(title=title,
                                                     description=description,
                                                     price=float(price),
                                                     category=category,
                                                     seller_username=seller_username,
                                                     seller_name=seller_name,
                                                     quantity=int(quantity),
                                                     picture_url=picture_url),
                                             product_id)
        if success:
            return HttpResponse(product_id)
        else:
            return HttpResponse("add product failed", status=500)
    else:
        return HttpResponse("product info not complete", status=400)

