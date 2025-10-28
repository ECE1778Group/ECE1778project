import json
from dataclasses import asdict
import logging

from elasticsearch import Elasticsearch
from user.seller import Seller
from backend.globalvars import get_es_client

logger = logging.getLogger(__name__)


def seller_register(seller: Seller) -> bool:
    try:
        es: Elasticsearch = get_es_client()
        document = asdict(seller)
        logger.debug(json.dumps(document))
        es.index(index="seller", id=seller.username, document=document)
        logger.info(f"Seller {seller.username} created")
        return True
    except Exception as e:
        logger.error(e)
        return False


def get_seller_details(username: str) -> dict|None:
    try:
        es: Elasticsearch = get_es_client()
        es_result = es.get(index="seller", id=username)
        logger.info(es_result)
        return es_result["_source"]
    except Exception as e:
        logger.error(e)
        return None
