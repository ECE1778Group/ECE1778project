import logging

from order.models import MasterOrder, OrderItem

logger = logging.getLogger(__name__)

def get_order_by_id(order_number: str):
    """
    get master order item by order number
    """
    try:
        order = MasterOrder.objects.get(order_number=int(order_number))
        return order
    except MasterOrder.DoesNotExist:
        return None


def get_order_items_by_master_order_id(order_number: str):
    """
    get order item by master order number
    """
    try:
        order_items = OrderItem.objects.filter(master_order_number=int(order_number))
        return order_items
    except OrderItem.DoesNotExist:
        return None