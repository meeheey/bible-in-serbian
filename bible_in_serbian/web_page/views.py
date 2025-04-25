from django.contrib.auth import authenticate, login, logout
from django.shortcuts import render
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.urls import reverse
from django.contrib.sites.shortcuts import get_current_site
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.template.loader import render_to_string
from django.core.mail import EmailMessage
from django.contrib.auth import get_user_model

from .utils import account_activation_token
from .models import User, Comment, Bookmark, ReadBook
from verse_fetcher.models import Books, Verses


def index(request):
    books = Books.objects.all()
    return render(request, "web_page/index.html", {
        "books": books
    })

def login_view(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        if user is not None:
            if user.is_active:
                login(request, user)
                return HttpResponseRedirect(reverse("index"))
            else:
                return render(request, "web_page/login.html", {
                    "message": "Налог није активиран. Провери електронску пошту."
                })
        else:
            return render(request, "web_page/login.html", {
                "message": "Погрешно корисничко име или лозинка."
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

        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "web_page/register.html", {
                "message": "Лозинке се морају подударати."
            })

        try:
            user = User.objects.create_user(username, email, password)
            user.is_active = False  # user must activate via email
            user.save()

            send_verification_email(request, user)

            return render(request, "web_page/check_email.html", {
                "email": email
            })

        except IntegrityError:
            return render(request, "web_page/register.html", {
                "message": "Корисничко име је заузето."
            })

    else:
        return render(request, "web_page/register.html")

    
def send_verification_email(request, user):
    current_site = get_current_site(request)
    mail_subject = 'Activate your account'
    message = render_to_string('web_page/activation_email.html', {
        'user': user,
        'domain': current_site.domain,
        'uid': urlsafe_base64_encode(force_bytes(user.pk)),
        'token': account_activation_token.make_token(user),
    })
    to_email = user.email
    email = EmailMessage(mail_subject, message, to=[to_email])
    email.send()

def activate(request, uidb64, token):
    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = get_user_model().objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, get_user_model().DoesNotExist):
        user = None

    if user is not None and account_activation_token.check_token(user, token):
        user.is_active = True
        user.save()
        return render(request, 'web_page/activation_success.html')
    else:
        return render(request, 'web_page/activation_invalid.html')

def show_book(request, book_id):
    book = Books.objects.get(id=book_id)
    books = Books.objects.all() 
    return render(request, "web_page/book.html", {
        "book": book,
        "books": books
    })

def quick_search(request):
    query = request.GET.get('q', '').strip()
    
    if not query:
        return render(request, "web_page/search_results.html", {
            "verses": [],
            "query": query,
            "show_controls": True
        })
    
    verses = Verses.objects.filter(verse__icontains=query).select_related('book')
    
    return render(request, "web_page/quick_search_results.html", {
        "verses": verses,
        "query": query,
        "show_controls": True  # Show the same controls as your verse page
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
    
    is_bookmarked = False
    comment_text = None

    if request.user.is_authenticated:
        is_bookmarked = Bookmark.objects.filter(verse=verse, author=request.user).exists()
        try:
            comment = Comment.objects.get(verse=verse, author=request.user)
            comment_text = comment.comment
        except Comment.DoesNotExist:
            comment_text = None

    return render(request, "web_page/verse.html", {
        "verse": verse,
        "comment_text": comment_text,
        "is_bookmarked": is_bookmarked
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