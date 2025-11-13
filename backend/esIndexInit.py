from elasticsearch import Elasticsearch

es = Elasticsearch(
    hosts=["http://elasticsearch:9200"],
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
            "id": {"type": "keyword"},
            "title": {"type": "text", "analyzer": "standard"},
            "description": {"type": "text", "analyzer": "standard"},
            "price": {"type": "float"},
            "picture_url": {"type": "keyword"},
            "quantity": {"type": "integer"},
            "category": {"type": "keyword"},
            "seller_username": {"type": "keyword"},
        }
    },
}


def create_product_index():
    if not es.indices.exists(index="product"):
        es.indices.create(index="product", body=PRODUCT_INDEX)
        print(f"[INFO] product index created")
    else:
        print(f"[INFO] product index already exists")



if __name__ == "__main__":
    create_product_index()