from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

from . import views

urlpatterns = [
    path('<int:book_id>/', views.fetch_book, name='fetch_book'),
    path('save_comment/', views.save_comment, name='save_comment'),
    path('<int:book_id>/comments/', views.fetch_comments, name='fetch_comments'),
    path('delete_comment/', views.delete_comment, name='delete_comment'),
    path('save_bookmark/', views.save_bookmark, name='save_bookmark'),
    path('delete_bookmark/', views.delete_bookmark, name='delete_bookmark'),
    path('<int:book_id>/bookmarks/', views.fetch_bookmarks, name='fetch_bookmarks'),
    path('toggle-read-status/', views.toggle_read_status, name='toggle_read_status'),
    path('random_verse/', views.fetch_random_verse, name='fetch_random_verse'),
    path('<int:book_id>/highlights/', views.fetch_highlights, name='fetch_highlights'),
    path('save_highlight/', views.save_highlight, name='save_highlight'),
    path('remove_highlight/', views.remove_highlight, name='remove_highlight'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
