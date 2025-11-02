"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

import chat.urls

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

http_application = get_asgi_application()
ws_application = URLRouter(chat.urls.websocket_urlpatterns)

application = ProtocolTypeRouter({
    'http': http_application,
    'websocket': ws_application,
})
