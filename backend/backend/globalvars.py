from elasticsearch import Elasticsearch

_es_client = None

def get_es_client():
    return _es_client

def init_es_client():
    global _es_client
    _es_client = Elasticsearch("http://elasticsearch:9200")
    if not _es_client.ping():
        print("[INFO] elasticsearch not available")
    else:
        print("[INFO] elasticsearch ready")