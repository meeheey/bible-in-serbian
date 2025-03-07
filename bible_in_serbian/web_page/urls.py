from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path('<int:book_id>/', views.show_book, name='show_book'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
