from django.contrib.auth import get_user_model
User = get_user_model()

user = User(email="alice@example.com", username="testuser", first_name="alice", last_name="Smith")
user.set_password("test")
if not User.objects.filter(username="testuser").exists():
    user.save()
    print("[INFO] test user created")
user2 = User(email="bob@example.com", username="testuser2", first_name="bob", last_name="Smith")
user2.set_password("test")
if not User.objects.filter(username="testuser2").exists():
    user2.save()
    print("[INFO] test user 2 created")