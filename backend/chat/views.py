import logging

import redis
from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.layers import get_channel_layer

from backend import settings

logger = logging.getLogger(__name__)
channel_layer = get_channel_layer()
redis_connection = redis.from_url(settings.CHANNEL_LAYERS["default"]["CONFIG"]["hosts"][0])

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        await self.accept()
        headers = {k.decode(): v.decode() for k, v in self.scope["headers"]}
        username = headers["username"]
        logger.info(self.channel_name)
        await sync_to_async(redis_connection.set)(f"ws:u:{username}", self.channel_name)

    async def chat_message(self, event):
        # event = {"type": "chat_message", "message": ..., "sender": ...}
        await self.send_json(event)

    async def receive_json(self, content, **kwargs):
        type = content["type"]
        if type == "chat_message":
            me = content["me"]
            peer = content["peer"]
            peer_channel = await sync_to_async(redis_connection.get)(f"ws:u:{peer}")
            peer_channel = peer_channel.decode('utf-8')
            logger.info(peer_channel)
            # TODO peer offline
            message = content["message"]
            await channel_layer.send(peer_channel, {"type": "chat_message", "message": message, "sender": me})