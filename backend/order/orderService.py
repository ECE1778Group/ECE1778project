import logging

from order.models import MasterOrder

logger = logging.getLogger(__name__)

def get_order_by_id(order_number: str):
    try:
        order = MasterOrder.objects.get(order_number=int(order_number))
        return order
    except MasterOrder.DoesNotExist:
        return None

