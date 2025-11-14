import logging
import time

import jwt
import redis
from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.layers import get_channel_layer
from django.http import QueryDict

from backend import settings
from user.models import User

logger = logging.getLogger(__name__)
channel_layer = get_channel_layer()
redis_connection = redis.from_url(settings.CHANNEL_LAYERS["default"]["CONFIG"]["hosts"][0])

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        query_string = self.scope["query_string"].decode('utf-8')
        query_dict = QueryDict(query_string)
        if "token" not in query_dict:
            logger.info("No token provided")
            await self.close()
        token = query_dict["token"]
        try:
            jwt_payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            logger.debug(jwt_payload)
            current_time = time.time()
            if current_time >= jwt_payload["exp"]:
                logger.info("token expired")
                await self.close()
            else:
                user = await sync_to_async(User.objects.get)(id=jwt_payload["user_id"])
                username = user.username
                logger.info(self.channel_name)
                await self.accept()
                await sync_to_async(redis_connection.set)(f"ws:u:{username}", self.channel_name)
        except Exception as e:
            logger.info("jwt parse error")
            logger.info(e)
            await self.close()



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