from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

from . import views

urlpatterns = [
    path('<int:book_id>/', views.fetch_book, name='fetch_book'),
    path('save_comment/', views.save_comment, name='save_comment'),
    path('<int:book_id>/comments/', views.fetch_comments, name='fetch_comments'),
    path('save_bookmarks/', views.save_bookmark, name='save_bookmark'),
    path('<int:book_id>/bookmarks/', views.fetch_bookmarks, name='fetch_bookmarks'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
