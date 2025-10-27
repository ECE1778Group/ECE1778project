import json
from dataclasses import asdict
import logging

from elasticsearch import Elasticsearch

from .entities.seller import Seller
from .globalvars import get_es_client

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(handler)

def seller_register(seller: Seller, username:str) -> bool:
    try:
        es: Elasticsearch = get_es_client()
        document = asdict(seller)
        logger.debug(json.dumps(document))
        es.index(index="seller", id=username, document=document)
        logger.info(f"Seller {username} created")
        return True
    except Exception as e:
        logger.error(e)
        return False

def get_seller_details(username:str):
    try:
        es: Elasticsearch = get_es_client()
        es_result = es.get(index="seller", id=username)
        logger.info(es_result)
        return Seller(es_result["_source"]["name"], es_result["_source"]["description"])
    except Exception as e:
        logger.error(e)
        return None