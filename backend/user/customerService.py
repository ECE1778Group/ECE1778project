import logging

from user.models import Customer

logger = logging.getLogger(__name__)


def customer_register(customer: Customer):
    customer.save()


def get_customer_details(username: str) -> Customer:
    customer = Customer.objects.get(username=username)
    return customer

