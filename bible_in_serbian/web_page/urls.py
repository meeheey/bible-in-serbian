from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path('books/<int:book_id>/', views.show_book, name='show_book'),
    path('comparative_reading/', views.comparative_reading, name='comparative reading'),
    path('comment/<comment_id>/', views.view_comment, name="view_comment"),
    path('read/', views.show_read_books, name='show_read_books'),
    path('bookmarks/', views.show_bookmarks, name='show_bookmarks'),
    path('random_verse_generator', views.random_verse_generator, name='random_verse_generator'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
