import json
import logging
import uuid
from dataclasses import asdict

from elasticsearch import Elasticsearch
from .globalvars import get_es_client
from .entities.product import Product

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(handler)


def list_products_by_keyword(keyword: str, sort_field: str = "price", sort_order: str = "desc"):
    try:
        es: Elasticsearch = get_es_client()
        es_result = es.search(index="product", size=20, query={
            "bool": {
                "must": [
                    {
                        "multi_match": {
                            "query": keyword,
                            "fields": [
                                "title^3",
                                "description^1",
                                "category^2",
                            ],
                            "type": "best_fields",
                            "fuzziness": "AUTO",
                        }
                    }
                ],
                "filter": [
                    {"range": {"quantity": {"gt": 0}}}
                ],
            }
        }, sort=[{sort_field: {"order": sort_order}}])
        logger.info(es_result)
    except Exception as e:
        logger.error(e)
        return None
    hits = es_result.get("hits", {}).get("hits", [])
    if not hits:
        return []
    products = []
    for hit in hits:
        item = hit["_source"]
        item["id"] = hit["_id"]
        products.append(item)
    logger.info("keyword=%s, total=%s, returned=%s", keyword,
                es_result["hits"]["total"]["value"], len(products))
    return products

def add_product(product: Product, product_id: str) -> bool:
    try:
        es: Elasticsearch = get_es_client()
        document = asdict(product)
        logger.debug(json.dumps(document))
        es.index(index="product", id=product_id, document=document)
        logger.info(f"Product {product_id} created")
        return True
    except Exception as e:
        logger.error(e)
        return False