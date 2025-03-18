from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse

from .models import Books, Verses
from web_page.models import User, Comment

def fetch_book(request, book_id):
    book = Books.objects.get(id=book_id)
    verses = Verses.objects.filter(book=book) 
    verses_data = [{"book_id": book.id, "chapter": verse.chapter, "verse_number": verse.verse_number, "verse": verse.verse} for verse in verses]
    return JsonResponse({"verses": verses_data})

@require_http_methods(["POST"])  # Restrict this view to POST requests only
@csrf_exempt  # Disable CSRF for simplicity (not recommended for production)
def save_comment(request):
    """
    A Django view to save a comment for a specific verse.
    """
    try:
        # Extract data from the request
        book_id = request.POST.get('book_id')
        chapter = request.POST.get('chapter')
        verse_number = request.POST.get('verse_number')
        comment_text = request.POST.get('comment')

        # Validate required fields
        if not all([book_id, chapter, verse_number, comment_text]):
            return HttpResponseBadRequest("Missing required fields.")

        # Convert book_id, chapter, and verse_number to integers
        try:
            book_id = int(book_id)
            chapter = int(chapter)
            verse_number = int(verse_number)
        except (TypeError, ValueError):
            return HttpResponseBadRequest("Invalid input for book_id, chapter, or verse_number.")

        # Validate the comment text
        if not comment_text.strip():
            raise ValidationError("Comment text cannot be empty.")

        # Get the book and verse
        book = get_object_or_404(Books, id=book_id)
        verse = get_object_or_404(Verses, book=book, chapter=chapter, verse_number=verse_number)

        # Create and save the comment
        comment = Comment.objects.create(
            author=request.user,
            book=book,
            verse=verse,
            comment=comment_text
        )

        # Return a success response
        return JsonResponse({
            'status': 'success',
            'message': 'Comment saved successfully.',
            'comment_id': comment.id,
        }, status=201)

    except ValidationError as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e),
        }, status=400)

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': 'An error occurred while saving the comment.',
        }, status=500)

@login_required
def fetch_comments(request, book_id):
    """
    Fetches comments for a specific book authored by the current user.

    Args:
        request: The HTTP request object.
        book_id: The ID of the book.

    Returns:
        JsonResponse: A JSON response containing the comments.
    """
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        # Get the book or return a 404 error if it doesn't exist
        book = get_object_or_404(Books, id=book_id)

        # Fetch comments for the book authored by the current user
        comments = Comment.objects.filter(book=book, author=request.user)

        # Prepare the comments data
        comments_data = [
            {
                "comment": comment.comment,
                "author": comment.author.username,
                "chapter": comment.verse.chapter,
                "verse_number": comment.verse.verse_number,
                "creation_date": comment.creation_date.strftime("%Y-%m-%d %H:%M:%S"),
            }
            for comment in comments
        ]

        # Return the comments as a JSON response
        return JsonResponse({"comments": comments_data}, safe=False)

    except Exception as e:
        # Handle unexpected errors
        return JsonResponse({"error": str(e)}, status=500)