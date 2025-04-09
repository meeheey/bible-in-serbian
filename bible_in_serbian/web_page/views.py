from django.contrib.auth import authenticate, login, logout
from django.shortcuts import render
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.urls import reverse

from .models import User, Comment, Bookmark, ReadBook
from verse_fetcher.models import Books, Verses


def index(request):
    books = Books.objects.all()
    return render(request, "web_page/index.html", {
        "books": books
    })

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "web_page/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "web_page/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "web_page/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "web_page/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "web_page/register.html")


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

def view_comment(request, comment_id):
    comment = Comment.objects.get(id=comment_id)
    return render(request, "web_page/comment.html",{
        "comment": comment
    })

def view_verse(request, book_id, chapter, verse_number):
    book = Books.objects.get(id=book_id)
    verse = Verses.objects.get(book=book, chapter=chapter, verse_number=verse_number)
    exists = Bookmark.objects.filter(verse=verse).exists()
    return render(request, "web_page/verse.html",{
        "verse": verse,
        "is_bookmarked": exists
    })

def show_read_books(request):
    books = Books.objects.all()
    read_book_ids = ReadBook.objects.filter(author=request.user).values_list('book_id', flat=True)
    books_data = [
        {"book": book, "read": "yes" if book.id in read_book_ids else "no"}
        for book in books
    ]
    return render(request, "web_page/read_books.html", {
        "books_data": books_data
    })

def show_bookmarks(request):
    bookmarks = Bookmark.objects.filter(author=request.user).order_by('creation_date')
    return render(request, "web_page/bookmarks.html", {
        "bookmarks": bookmarks
    })

def random_verse_generator(request):
        return render(request, "web_page/random_verse_generator.html")