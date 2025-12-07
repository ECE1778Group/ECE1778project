import logging
import time

import jwt
import redis
from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.layers import get_channel_layer
from django.http import QueryDict
from django.db.models import Q

from backend import settings
from user.models import User
from chat.models import ChatThread, ChatMessage

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

from uuid import UUID

import os
import uuid
from django.core.files.storage import default_storage




logger = logging.getLogger(__name__)
channel_layer = get_channel_layer()
redis_connection = redis.from_url(
    settings.CHANNEL_LAYERS["default"]["CONFIG"]["hosts"][0]
)


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        query_string = self.scope["query_string"].decode("utf-8")
        query_dict = QueryDict(query_string)

        if "token" not in query_dict:
            logger.info("WS connect: No token provided")
            await self.close()
            return

        token = query_dict["token"]
        try:
            jwt_payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            logger.debug("WS connect jwt payload: %s", jwt_payload)
            current_time = time.time()
            if current_time >= jwt_payload["exp"]:
                logger.info("WS connect: token expired")
                await self.close()
                return

            user = await sync_to_async(User.objects.get)(id=jwt_payload["user_id"])
            username = user.username

            logger.info(
                "WS connect OK, username=%s, channel=%s", username, self.channel_name
            )
            await self.accept()

            # 把 username -> channel_name 存进 redis
            await sync_to_async(redis_connection.set)(
                f"ws:u:{username}", self.channel_name
            )

            # 可选：告诉前端“连接成功”
            await self.send_json(
                {"type": "system", "event": "connected", "username": username}
            )

        except Exception:
            logger.exception("WS connect: jwt parse error")
            await self.close()

    async def chat_message(self, event):
        await self.send_json(event)

    async def receive_json(self, content, **kwargs):
        msg_type = content.get("type")

        if msg_type == "chat_message":
            me = content.get("me")
            peer = content.get("peer")
            message = content.get("message")
            thread_id = content.get("threadId")

            logger.info(
                "WS receive chat_message: me=%s peer=%s threadId=%s msg=%s",
                me, peer, thread_id, message
            )

            if not (me and peer and message and thread_id):
                logger.warning("WS chat_message missing fields: %s", content)
                return

            try:
                sender_user = await sync_to_async(User.objects.get)(username=me)

                try:
                    thread_uuid = UUID(str(thread_id))
                except Exception:
                    logger.exception("invalid threadId=%s, cannot parse as UUID", thread_id)
                    return

                try:
                    thread = await sync_to_async(ChatThread.objects.get)(id=thread_uuid)
                except ChatThread.DoesNotExist:
                    logger.warning("ChatThread %s not found, skip saving", thread_uuid)
                else:
                    await sync_to_async(ChatMessage.objects.create)(
                        thread=thread,
                        sender=sender_user,
                        text=message,
                        image_url="",
                    )
                    logger.info("ChatMessage saved (text), thread=%s sender=%s", thread_uuid, me)

            except Exception:
                logger.exception("save chat message error")

            try:
                peer_channel = await sync_to_async(redis_connection.get)(f"ws:u:{peer}")
                if peer_channel:
                    peer_channel = peer_channel.decode("utf-8")
                    logger.info("send text to peer channel %s", peer_channel)
                    await channel_layer.send(
                        peer_channel,
                        {
                            "type": "chat_message",
                            "message": message,
                            "sender": me,
                            "image_url": "",
                        },
                    )
                else:
                    logger.info("peer %s offline (no ws channel)", peer)
            except Exception:
                logger.exception("send to peer channel error")
            return

        if msg_type == "chat_image":
            me = content.get("me")
            peer = content.get("peer")
            image_url = content.get("image_url")
            thread_id = content.get("threadId")

            logger.info(
                "WS receive chat_image: me=%s peer=%s threadId=%s url=%s",
                me, peer, thread_id, image_url
            )

            if not (me and peer and image_url and thread_id):
                logger.warning("WS chat_image missing fields: %s", content)
                return

            try:
                sender_user = await sync_to_async(User.objects.get)(username=me)

                try:
                    thread_uuid = UUID(str(thread_id))
                except Exception:
                    logger.exception("invalid threadId=%s, cannot parse as UUID", thread_id)
                    return

                try:
                    thread = await sync_to_async(ChatThread.objects.get)(id=thread_uuid)
                except ChatThread.DoesNotExist:
                    logger.warning("ChatThread %s not found, skip saving", thread_uuid)
                else:
                    await sync_to_async(ChatMessage.objects.create)(
                        thread=thread,
                        sender=sender_user,
                        text="",
                        image_url=image_url,   # ✅ 把 URL 存进去
                    )
                    logger.info("ChatMessage saved (image), thread=%s sender=%s", thread_uuid, me)

            except Exception:
                logger.exception("save chat image error")

            try:
                peer_channel = await sync_to_async(redis_connection.get)(f"ws:u:{peer}")
                if peer_channel:
                    peer_channel = peer_channel.decode("utf-8")
                    logger.info("send image to peer channel %s", peer_channel)
                    await channel_layer.send(
                        peer_channel,
                        {
                            "type": "chat_message",
                            "message": "",
                            "sender": me,
                            "image_url": image_url,
                        },
                    )
                else:
                    logger.info("peer %s offline (no ws channel)", peer)
            except Exception:
                logger.exception("send to peer channel error")
            return

        logger.debug("WS receive_json ignore msg_type=%s, content=%s", msg_type, content)

class CreateThreadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        peer_username = request.data.get("peer_username")
        if not peer_username:
            return Response(
                {"detail": "peer_username required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            peer = User.objects.get(username=peer_username)
        except User.DoesNotExist:
            return Response(
                {"detail": "peer not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        me = request.user

        if me.id < peer.id:
            buyer = me
            seller = peer
        else:
            buyer = peer
            seller = me

        thread, created = ChatThread.objects.get_or_create(
            buyer=buyer,
            seller=seller,
        )

        return Response({"id": str(thread.id)}, status=status.HTTP_200_OK)


class LoadMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, thread_id):
        try:
            thread = ChatThread.objects.get(id=thread_id)
        except ChatThread.DoesNotExist:
            return Response(
                {"detail": "thread not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if request.user != thread.buyer and request.user != thread.seller:
            return Response(
                {"detail": "forbidden"},
                status=status.HTTP_403_FORBIDDEN,
            )

        qs = thread.messages.select_related("sender").order_by("created_at")
        data = [
            {
                "id": m.id,
                "text": m.text,
                "image_url": m.image_url,
                "sender": m.sender.username,
                "created_at": m.created_at.isoformat(),
            }
            for m in qs
        ]
        return Response(data, status=status.HTTP_200_OK)
    
class LoadThreadsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        me = request.user

        threads = (
            ChatThread.objects
            .filter(Q(buyer=me) | Q(seller=me))
            .order_by("-created_at")
        )

        data = []
        for th in threads:
            peer = th.seller if th.buyer_id == me.id else th.buyer
            last_msg = th.messages.order_by("-created_at").first()

            if last_msg is None:
                preview = ""
                last_time = th.created_at.isoformat()
            else:
                if last_msg.image_url:
                    preview = "[Image]"
                elif last_msg.text:
                    preview = last_msg.text
                else:
                    preview = ""

                last_time = last_msg.created_at.isoformat()

            data.append({
                "id": str(th.id),
                "peer_username": peer.username,
                "peer_first_name": peer.first_name,
                "peer_last_name": peer.last_name,
                "last_message": preview,
                "last_time": last_time,
            })

        return Response(data, status=status.HTTP_200_OK)

class UploadImageView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file_obj = request.FILES.get("image")
        if not file_obj:
            return Response({"detail": "image required"}, status=400)

        if not file_obj.content_type.startswith("image/"):
            return Response({"detail": "only image files allowed"}, status=400)

        ext = os.path.splitext(file_obj.name)[1] or ".jpg"
        filename = f"{uuid.uuid4().hex}{ext}"

        path = default_storage.save(f"chat_images/{filename}", file_obj)

        url = default_storage.url(path)

        full_url = request.build_absolute_uri(url)

        return Response({"url": full_url}, status=201)
