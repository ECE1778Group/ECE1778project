# user/services/userService.py
import random
import logging
from django.core.mail import send_mail
from django.core.cache import cache
from django.contrib.auth.hashers import make_password, check_password
from user.models import User

logger = logging.getLogger(__name__)

VERIFICATION_CODE_EXPIRE_SECONDS = 300  # 5分钟验证码有效期
VERIFIED_EMAIL_EXPIRE_SECONDS = 600     # 验证成功的邮箱状态保留10分钟


def generate_code(length=6):
    return ''.join([str(random.randint(0, 9)) for _ in range(length)])


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


def verify_code(email: str, code: str):
    cache_key = f"verify_code:{email}"
    cached_code = cache.get(cache_key)

    if not cached_code:
        return False, "Verification code expired or not found."
    if code != cached_code:
        return False, "Incorrect verification code."

    # 验证成功后设置邮箱通过标记
    verified_key = f"verified_email:{email}"
    cache.set(verified_key, True, timeout=VERIFIED_EMAIL_EXPIRE_SECONDS)
    return True, "Verification successful."


def is_email_verified(email: str):
    verified_key = f"verified_email:{email}"
    return cache.get(verified_key) is True


def create_user(username, password, email, first_name, last_name):
    # 检查邮箱验证状态
    if not is_email_verified(email):
        return False, "Email not verified. Please verify before signup."

    if User.objects.filter(username=username).exists():
        return False, "Username already exists."
    if User.objects.filter(email=email).exists():
        return False, "Email already registered."

    user = User.objects.create(
        username=username,
        password=make_password(password),
        email=email,
        first_name=first_name,
        last_name=last_name,
    )

    # 注册成功后删除验证标记
    cache.delete(f"verified_email:{email}")
    return True, user


def authenticate_user(username, password):
    try:
        user = User.objects.get(username=username)
        if check_password(password, user.password):
            return user
        return None
    except User.DoesNotExist:
        return None
