import logging

from order.models import Order

logger = logging.getLogger(__name__)


def create_order(order: Order):
    order.save()

def get_order_by_id(id: str):
    order = Order.objects.get(id=int(id))
    return order

