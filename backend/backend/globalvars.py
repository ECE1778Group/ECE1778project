from elasticsearch import Elasticsearch

_es_client = None

def get_es_client():
    return _es_client

def init_es_client():
    global _es_client
    _es_client = Elasticsearch("http://127.0.0.1:9200")
    if not _es_client.ping():
        print("[INFO] elasticsearch not available")
        exit(1)
    else:
        print("[INFO] elasticsearch ready")