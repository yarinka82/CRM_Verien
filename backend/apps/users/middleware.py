
import logging
from .models import RequestLog

logger = logging.getLogger(__name__)

def get_client_ip(request):
    """
    Корректно извлекает IP пользователя, даже если сервер
    работает за прокси (Nginx, Cloudflare, Traefik).
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


class APIStatisticsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 1. Сначала даем Django обработать запрос и сформировать ответ
        response = self.get_response(request)

        # 2. Тихо логируем только API-запросы (чтобы не забивать базу статикой, картинками и админкой)
        if request.path.startswith('/api/'):  # Укажите ваш префикс API (или уберите if для всех запросов)
            try:
                user = request.user if request.user.is_authenticated else None
                ip = get_client_ip(request)
                user_agent = request.META.get('HTTP_USER_AGENT', '')

                RequestLog.objects.create(
                    user=user,
                    ip_address=ip,
                    method=request.method,
                    path=request.path,
                    status_code=response.status_code,
                    user_agent=user_agent[:500]  # обрезаем, если строка слишком длинная
                )
            except Exception as e:
                # Тихо подавляем ошибку, чтобы сбой логирования не ломал работу сайта
                logger.error(f"Ошибка при записи лога в БД: {e}")

        return response