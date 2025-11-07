# user/services/userService.py
import random
import logging
from django.core.mail import send_mail
from django.core.cache import cache
from django.contrib.auth import authenticate
from user.models import User

logger = logging.getLogger(__name__)

VERIFICATION_CODE_EXPIRE_SECONDS = 300  # 验证码 5 分钟有效
VERIFIED_EMAIL_EXPIRE_SECONDS = 600     # 邮箱验证状态 10 分钟有效


# 生成随机验证码
def generate_code(length=6):
    return ''.join(str(random.randint(0, 9)) for _ in range(length))


# 发送验证码邮件
def send_verification_code(email: str):
    try:
        code = generate_code()
        cache_key = f"verify_code:{email}"
        cache.set(cache_key, code, timeout=VERIFICATION_CODE_EXPIRE_SECONDS)

        subject = "Your Verification Code"
        message = f"Your verification code is: {code}\n(This code will expire in 5 minutes.)"
        from_email = "liaozijin7@gmail.com"
        send_mail(subject, message, from_email, [email])

        logger.info(f"Sent verification code to {email}: {code}")
        return True, "Verification code sent successfully."
    except Exception as e:
        logger.error(f"Failed to send verification email to {email}: {e}")
        return False, f"Failed to send verification email: {e}"


# 校验验证码
def verify_code(email: str, code: str):
    cache_key = f"verify_code:{email}"
    cached_code = cache.get(cache_key)

    if not cached_code:
        return False, "Verification code expired or not found."
    if code != cached_code:
        return False, "Incorrect verification code."

    verified_key = f"verified_email:{email}"
    cache.set(verified_key, True, timeout=VERIFIED_EMAIL_EXPIRE_SECONDS)
    return True, "Verification successful."


# 检查邮箱是否通过验证
def is_email_verified(email: str):
    return cache.get(f"verified_email:{email}") is True


def create_user(email, password, first_name="", last_name="", username=""):
    if not is_email_verified(email):
        return False, "Email not verified. Please verify before signup."

    if User.objects.filter(email=email).exists():
        return False, "Email already registered."

    user = User(
        email=email,
        username=username or email.split("@")[0],
        first_name=first_name,
        last_name=last_name,
    )
    user.set_password(password)
    user.save()

    cache.delete(f"verified_email:{email}")
    return True, user


def authenticate_user(email, password):
    user = authenticate(username=email, password=password)
    return user