from elasticsearch import Elasticsearch

es = Elasticsearch(
    hosts=["http://127.0.0.1:9200"],
    request_timeout=10
)

PRODUCT_INDEX = {
    "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 0,
        "analysis": {"analyzer": {"standard": {"tokenizer": "standard"}}},
    },
    "mappings": {
        "properties": {
            "title": {"type": "text", "analyzer": "standard"},
            "description": {"type": "text", "analyzer": "standard"},
            "price": {"type": "float"},
            "picture_url": {"type": "keyword"},
            "quantity": {"type": "integer"},
            "category": {"type": "keyword"},
            "seller_id": {"type": "keyword"},
            "seller_name": {"type": "keyword"},
        }
    },
}

SELLER_INDEX = {
    "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 0,
        "analysis": {"analyzer": {"standard": {"tokenizer": "standard"}}},
    },
    "mappings": {
        "properties": {
            "username": {"type": "keyword"},
            "name": {"type": "text", "analyzer": "standard"},
            "description": {"type": "text", "analyzer": "standard"},
        }
    },
}

def create_product_index():
    es.indices.create(index="product", body=PRODUCT_INDEX)
    print(f"[INFO] product index created")

def create_seller_index():
    es.indices.create(index="seller", body=SELLER_INDEX)
    print(f"[INFO] seller index created")



if __name__ == "__main__":
    create_product_index()
    create_seller_index()