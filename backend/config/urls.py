from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse

def home_view(request):
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>CRM System</title>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .container { max-width: 600px; margin: 0 auto; }
            .links { margin-top: 30px; }
            .links a { display: inline-block; margin: 10px; padding: 12px 24px;
                       background: #007bff; color: white; text-decoration: none;
                       border-radius: 5px; }
            .links a:hover { background: #0056b3; }
            .status { color: green; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🏢 CRM System</h1>
            <p class="status">✅ Сервер работает успешно!</p>
            <p>Версия: Django 6.1</p>
            <div class="links">
                <a href="/admin/">🔐 Войти в админку</a>
                <a href="/admin/">📊 Административная панель</a>
            </div>
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
                API доступен по адресу: /api/
            </p>
        </div>
    </body>
    </html>
    """
    return HttpResponse(html)

urlpatterns = [
    path('', home_view),
    path('admin/', admin.site.urls),
    path('api/members/', include('apps.members.urls')),
    path('api/payments/', include('apps.payments.urls')),
]