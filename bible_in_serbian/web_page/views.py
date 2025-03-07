from django.shortcuts import render
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.urls import reverse

from verse_fetcher.models import Books, Verses


def index(request):
    books = Books.objects.all()
    return render(request, "web_page/index.html", {
        "books": books
    })

def show_book(request, book_id):
    book = Books.objects.get(id=book_id)
    verses = Verses.objects.filter(book=book) 
    return render(request, "web_page/book.html", {
        "book": book,
        "verses": verses
    })