import json
import logging

from dataclasses import asdict
from elasticsearch import Elasticsearch, NotFoundError
from backend.globalvars import get_es_client
from product.product import Product

logger = logging.getLogger(__name__)


def list_products_by_keyword(keyword: str, sort_field: str = "price", sort_order: str = "desc") -> list[dict]:
    es: Elasticsearch = get_es_client()
    try:
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
    except NotFoundError:
        return []
    logger.info(es_result)
    hits = es_result.get("hits", {}).get("hits", [])
    products = []
    for hit in hits:
        item = hit["_source"]
        item["id"] = hit["_id"]
        products.append(item)
    logger.info("keyword=%s, total=%s, returned=%s", keyword,
                es_result["hits"]["total"]["value"], len(products))
    return products


def add_or_update_product(product: Product, product_id: str):
    es: Elasticsearch = get_es_client()
    document = asdict(product)
    logger.debug(json.dumps(document))
    es.index(index="product", id=product_id, document=document)
    logger.info(f"Product {product_id} created")



def get_product_by_id(product_id) -> Product|None:
    es: Elasticsearch = get_es_client()
    try:
        es_result = es.get(index="product", id=product_id)
        logger.info(es_result)
        product = Product(**es_result["_source"])
        return product
    except NotFoundError:
        return None