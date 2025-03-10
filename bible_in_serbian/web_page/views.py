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
    books = Books.objects.all() 
    return render(request, "web_page/book.html", {
        "book": book,
        "books": books
    })

def comparative_reading(request):
    books = Books.objects.all()
    return render(request, "web_page/comparative_reading.html", {
        "books": books
    })