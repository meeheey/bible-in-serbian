from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth import views as auth_views

from .forms import CustomPasswordResetForm, CustomSetPasswordForm
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path('books/<int:book_id>/', views.show_book, name='show_book'),
    path('books/search/', views.quick_search, name='quick_search'),
    path('comparative_reading/', views.comparative_reading, name='comparative reading'),
    path('books/<int:book_id>/<int:chapter>/<int:verse_number>/', views.view_verse, name='view_verse'),
    path('read/', views.show_read_books, name='show_read_books'),
    path('bookmarks/', views.show_bookmarks, name='show_bookmarks'),
    path('comments/', views.show_comments, name='show_comments'),
    path('my_profile/', views.user_profile, name='user_profile'),
    path('random_verse_generator', views.random_verse_generator, name='random_verse_generator'),
    path('activate/<uidb64>/<token>/', views.activate, name='activate'),
    path('project_info', views.project_info, name='project_info'),
    path('translations_info', views.translations_info, name='translations_info'),
    path('daily_readings/', views.daily_readings, name='daily_readings'),
    path('send_email/', views.send_email, name='send_email'),
    path(
        'password-reset/',
        auth_views.PasswordResetView.as_view(
            form_class=CustomPasswordResetForm,
            template_name='registration/password_reset_form.html'
        ),
        name='password_reset'
    ),
    path(
        'password-reset/done/',
        auth_views.PasswordResetDoneView.as_view(
            template_name='registration/password_reset_done.html'
        ),
        name='password_reset_done'
    ),
    path(
        'reset/<uidb64>/<token>/',
        auth_views.PasswordResetConfirmView.as_view(
            form_class=CustomSetPasswordForm,
            template_name='registration/password_reset_confirm.html'
        ),
        name='password_reset_confirm'
    ),
    path(
        'reset/done/',
        auth_views.PasswordResetCompleteView.as_view(
            template_name='registration/password_reset_complete.html'
        ),
        name='password_reset_complete'
    ),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
