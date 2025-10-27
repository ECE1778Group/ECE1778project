import os
from django.apps import AppConfig
from .globalvars import init_es_client

class StartupConfig(AppConfig):
    _es_client = None
    name = 'backend'
    def ready(self):
        if os.environ.get('RUN_MAIN') != 'true':
            return
        init_es_client()

    def get_es_client(self):
        return self._es_client


