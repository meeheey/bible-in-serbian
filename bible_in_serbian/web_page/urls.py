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
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
