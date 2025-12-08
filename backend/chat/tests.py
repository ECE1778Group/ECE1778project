from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile

from rest_framework import status
from rest_framework.test import APITestCase

from user.models import User
from chat.models import ChatThread, ChatMessage

import uuid


class BaseChatAPITestCase(APITestCase):
    def setUp(self):
        # Create two users
        self.user1 = User.objects.create_user(
            email="alice@example.com", username="alice", password="pass1234"
        )
        self.user2 = User.objects.create_user(
            email="bob@example.com", username="bob", password="pass1234"
        )

        # Authenticate as alice
        self.client.force_authenticate(user=self.user1)


class CreateThreadViewTests(BaseChatAPITestCase):
    def test_create_thread_success(self):
        url = reverse("chat-thread")
        resp = self.client.post(url, {"peer_username": "bob"}, format="json")

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("id", resp.data)

        thread_id = resp.data["id"]
        thread = ChatThread.objects.get(id=thread_id)

        self.assertIn(self.user1, [thread.buyer, thread.seller])
        self.assertIn(self.user2, [thread.buyer, thread.seller])

    def test_create_thread_missing_peer(self):
        url = reverse("chat-thread")
        resp = self.client.post(url, {}, format="json")

        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(resp.data["detail"], "peer_username required")

    def test_create_thread_peer_not_found(self):
        url = reverse("chat-thread")
        resp = self.client.post(url, {"peer_username": "nobody"}, format="json")

        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(resp.data["detail"], "peer not found")


class LoadMessagesViewTests(BaseChatAPITestCase):
    def setUp(self):
        super().setUp()

        # Create a thread
        self.thread = ChatThread.objects.create(
            buyer=min(self.user1, self.user2, key=lambda u: u.id),
            seller=max(self.user1, self.user2, key=lambda u: u.id),
            created_at=timezone.now(),
        )

        # Add messages
        ChatMessage.objects.create(thread=self.thread, sender=self.user1, text="hello")
        ChatMessage.objects.create(thread=self.thread, sender=self.user2, text="hi")

    def test_load_messages_success(self):
        url = reverse("chat-thread-messages", kwargs={"thread_id": self.thread.id})
        resp = self.client.get(url)

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 2)
        self.assertEqual(resp.data[0]["text"], "hello")
        self.assertEqual(resp.data[1]["text"], "hi")

    def test_load_messages_forbidden(self):
        charlie = User.objects.create_user(email="charlie@example.com", username="charlie", password="pass")
        self.client.force_authenticate(user=charlie)

        url = reverse("chat-thread-messages", kwargs={"thread_id": self.thread.id})
        resp = self.client.get(url)

        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(resp.data["detail"], "forbidden")

    def test_load_messages_thread_not_found(self):
        fake_id = uuid.uuid4()
        url = reverse("chat-thread-messages", kwargs={"thread_id": fake_id})
        resp = self.client.get(url)

        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(resp.data["detail"], "thread not found")


class LoadThreadsViewTests(BaseChatAPITestCase):
    def setUp(self):
        super().setUp()

        # Create thread
        self.thread = ChatThread.objects.create(
            buyer=min(self.user1, self.user2, key=lambda u: u.id),
            seller=max(self.user1, self.user2, key=lambda u: u.id),
            created_at=timezone.now(),
        )

        ChatMessage.objects.create(
            thread=self.thread,
            sender=self.user1,
            text="",
            image_url="http://example.com/x.png",
        )

    def test_load_threads_success(self):
        url = reverse("chat-threads")
        resp = self.client.get(url)

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)

        item = resp.data[0]
        self.assertEqual(item["id"], str(self.thread.id))
        self.assertEqual(item["peer_username"], "bob")
        self.assertEqual(item["last_message"], "[Image]")
        self.assertIn("last_time", item)


class UploadImageViewTests(BaseChatAPITestCase):
    def test_upload_image_success(self):
        # fake GIF
        image = SimpleUploadedFile(
            "test.gif",
            b"\x47\x49\x46\x38",
            content_type="image/gif"
        )

        url = "/api/chat/upload-image/"
        resp = self.client.post(url, {"image": image}, format="multipart")

        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIn("url", resp.data)
        self.assertTrue(resp.data["url"].startswith("http"))

    def test_upload_missing_file(self):
        url = "/api/chat/upload-image/"
        resp = self.client.post(url, {}, format="multipart")

        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.data["detail"], "image required")

    def test_upload_non_image(self):
        txt = SimpleUploadedFile(
            "a.txt", b"hello", content_type="text/plain"
        )
        url = "/api/chat/upload-image/"
        resp = self.client.post(url, {"image": txt}, format="multipart")

        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.data["detail"], "only image files allowed")
