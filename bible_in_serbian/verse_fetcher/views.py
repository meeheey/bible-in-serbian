from django.http import JsonResponse

from .models import Books, Verses

def fetch_book(request, book_id):
    book = Books.objects.get(id=book_id)
    verses = Verses.objects.filter(book=book) 
    verses_data = [{"book_id": book.id, "chapter": verse.chapter, "verse_number": verse.verse_number, "verse": verse.verse} for verse in verses]
    return JsonResponse({"verses": verses_data})