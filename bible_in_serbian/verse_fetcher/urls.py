from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

from . import views

urlpatterns = [
    path('<int:book_id>/', views.fetch_book, name='fetch_book'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
