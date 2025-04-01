from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.conf import settings
from django.core.validators import MinLengthValidator

from verse_fetcher.models import Books, Verses

class User(AbstractUser):
    pass

class Comment(models.Model):
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comments_authored')
    book = models.ForeignKey('verse_fetcher.Books', on_delete=models.CASCADE, related_name='book_comments')
    verse = models.ForeignKey('verse_fetcher.Verses', on_delete=models.CASCADE, related_name='verse_comments')
    creation_date = models.DateTimeField(default=timezone.now, editable=False)
    comment = models.TextField(validators=[MinLengthValidator(10)])

    class Meta:
        verbose_name = 'Comment'
        verbose_name_plural = 'Comments'
        unique_together = ('author', 'verse')
        indexes = [
            models.Index(fields=['author']),
            models.Index(fields=['book']),
            models.Index(fields=['verse']),
        ]

    def __str__(self):
        return f'({self.book.acronym} {self.verse.chapter}:{self.verse.verse_number}) {self.comment}'

class Bookmark(models.Model):
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookmarks_authored')
    book = models.ForeignKey('verse_fetcher.Books', on_delete=models.CASCADE, related_name='book_bookmarks')
    verse = models.ForeignKey('verse_fetcher.Verses', on_delete=models.CASCADE, related_name='verse_bookmarks')
    creation_date = models.DateTimeField(default=timezone.now, editable=False)

    class Meta:
        verbose_name = 'Bookmark'
        verbose_name_plural = 'Bookmarks'
        unique_together = ('author', 'verse')
        indexes = [
            models.Index(fields=['author']),
            models.Index(fields=['book']),
            models.Index(fields=['verse']),
        ]

    def __str__(self):
        return f'Означено: ({self.book.acronym} {self.verse.chapter}:{self.verse.verse_number})'
    
class ReadBook(models.Model):
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='books_read')
    book = models.ForeignKey('verse_fetcher.Books', on_delete=models.CASCADE, related_name='book_read_by')
    creation_date = models.DateTimeField(default=timezone.now, editable=False)

    class Meta:
        verbose_name = 'ReadBook'
        verbose_name_plural = 'ReadBooks'
        unique_together = ('author', 'book')
        indexes = [
            models.Index(fields=['author']),
            models.Index(fields=['book'])        ]

    def __str__(self):
        return f'{self.book.acronym} прочитао {self.user.username}'

