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