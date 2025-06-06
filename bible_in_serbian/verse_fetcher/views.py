from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.http import require_http_methods, require_POST
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from random import choice

import json

from .models import Books, Verses
from web_page.models import User, Comment, Bookmark, Highlight, ReadBook

def fetch_book(request, book_id):
    book = Books.objects.get(id=book_id)
    verses = Verses.objects.filter(book=book) 
    verses_data = [{"book_id": book.id, "book_acronym": book.acronym, "chapter": verse.chapter, "chapter_mask": verse.chapter_mask, "verse_number": verse.verse_number, "verse_number_mask": verse.verse_number_mask, "verse": verse.verse} for verse in verses]
    return JsonResponse({"verses": verses_data})

def fetch_random_verse(request):
    verse_ids = Verses.objects.values_list('id', flat=True)
    random_verse_id = choice(verse_ids)
    random_verse = Verses.objects.get(id=random_verse_id)
    while random_verse.verse_number == 0:
        random_verse_id = choice(verse_ids)
        random_verse = Verses.objects.get(id=random_verse_id)
    exists = Bookmark.objects.filter(verse=random_verse).exists()
    random_verse_data = {
        "book_acronym": random_verse.book.acronym,
        "book_id": random_verse.book.id,
        "chapter": random_verse.chapter,
        "chapter_mask": random_verse.chapter_mask,
        "verse_number": random_verse.verse_number,
        "verse_number_mask": random_verse.verse_number_mask,
        "verse": random_verse.verse,
        "is_bookmarked": exists
    }
    return JsonResponse({"random_verse": random_verse_data})

# views.py
@require_http_methods(["POST"])
@csrf_exempt
def save_comment(request):
    try:
        data = json.loads(request.body)
        book_id = data.get('book_id')
        chapter = data.get('chapter')
        verse_number = data.get('verse_number')
        comment_text = data.get('comment')

        if book_id is None or chapter is None or verse_number is None or not comment_text:
            return JsonResponse({
                'status': 'error',
                'message': 'Missing required fields.'
            }, status=400)

        book = get_object_or_404(Books, id=book_id)
        verse = get_object_or_404(Verses, book=book, chapter=chapter, verse_number=verse_number)

        # Try to get existing comment or create new one
        comment, created = Comment.objects.get_or_create(
            author=request.user,
            book=book,
            verse=verse,
            defaults={'comment': comment_text}
        )

        if not created:
            comment.comment = comment_text
            comment.save()

        return JsonResponse({
            'status': 'success',
            'message': 'Comment saved successfully.',
        })

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e),
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
        # Handle unexpected errorssave
        return JsonResponse({"error": str(e)}, status=500)@require_http_methods(["POST"])  # Restrict this view to POST requests only
    
@require_http_methods(["POST"])
@csrf_exempt
def save_comment(request):
    try:
        # Parse request data
        data = json.loads(request.body)
        book_id = data.get('book_id')
        chapter = data.get('chapter')
        verse_number = data.get('verse_number')
        comment_text = data.get('comment')

        # Validate required fields
        if book_id is None or chapter is None or verse_number is None or not comment_text:
            return JsonResponse({
                'status': 'error',
                'message': 'All fields are required: book_id, chapter, verse_number, comment'
            }, status=400)

        # Get related objects
        book = get_object_or_404(Books, id=book_id)
        verse = get_object_or_404(Verses, book=book, chapter=chapter, verse_number=verse_number)

        # Create or update comment
        comment, created = Comment.objects.update_or_create(
            author=request.user,
            book=book,
            verse=verse,
            defaults={'comment': comment_text}
        )

        return JsonResponse({
            'status': 'success',
            'message': 'Comment saved successfully',
            'comment_id': comment.id,
            'created': created
        })

    except Exception as e:
        import traceback
        traceback.print_exc()  # Log the full traceback
        return JsonResponse({
            'status': 'error',
            'message': f'An error occurred while saving the comment: {str(e)}'
        }, status=500)
    
@require_http_methods(["POST"])  # Restrict this view to POST requests only
@csrf_exempt  # Disable CSRF for simplicity (not recommended for production)
def save_bookmark(request):
    """
    A Django view to save a bookmark for a specific verse.
    """
    try:
        # Parse JSON data from the request body
        data = json.loads(request.body)

        # Extract data
        book_id = data.get('book_id')
        chapter = data.get('chapter')
        verse_number = data.get('verse_number')

        # Validate required fields
        if book_id is None or chapter is None or verse_number is None:
            return HttpResponseBadRequest("Missing required fields.")

        # Convert book_id, chapter, and verse_number to integers
        try:
            book_id = int(book_id)
            chapter = int(chapter)
            verse_number = int(verse_number)
        except (TypeError, ValueError):
            return HttpResponseBadRequest("Invalid input for book_id, chapter, or verse_number.")

        # Get the book and verse
        book = get_object_or_404(Books, id=book_id)
        verse = get_object_or_404(Verses, book=book, chapter=chapter, verse_number=verse_number)

        # Create and save the comment
        bookmark = Bookmark.objects.create(
            author=request.user,
            book=book,
            verse=verse
        )

        # Return a success response
        return JsonResponse({
            'status': 'success',
            'message': 'Bookmark saved successfully.',
            'bookmark_id': bookmark.id,
        }, status=201)

    except ValidationError as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e),
        }, status=400)

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': 'An error occurred while saving the bookmark.',
        }, status=500)
    
@require_http_methods(["POST"])
@csrf_exempt
def delete_bookmark(request):
    """
    A Django view to delete a bookmark for a specific verse.
    """
    try:
        data = json.loads(request.body)
        book_id = data.get('book_id')
        chapter = data.get('chapter')
        verse_number = data.get('verse_number')

        if book_id is None or chapter is None or verse_number is None:
            return HttpResponseBadRequest("Missing required fields.")

        book = get_object_or_404(Books, id=book_id)
        verse = get_object_or_404(Verses, book=book, chapter=chapter, verse_number=verse_number)

        # Get and delete the bookmark
        bookmark = get_object_or_404(Bookmark, author=request.user, book=book, verse=verse)
        bookmark.delete()

        return JsonResponse({
            'status': 'success',
            'message': 'Bookmark deleted successfully.',
        })

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': 'An error occurred while deleting the bookmark.',
        }, status=500)

@login_required
def fetch_bookmarks(request, book_id):
    """
    Fetches bookmarks for a specific book authored by the current user.

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
        bookmarks = Bookmark.objects.filter(book=book, author=request.user)

        # Prepare the comments data
        bookmarks_data = [
            {
                "author": bookmark.author.username,
                "chapter": bookmark.verse.chapter,
                "verse_number": bookmark.verse.verse_number,
                "creation_date": bookmark.creation_date.strftime("%Y-%m-%d %H:%M:%S"),
            }
            for bookmark in bookmarks
        ]

        # Return the bookmarks as a JSON response
        return JsonResponse({"bookmarks": bookmarks_data}, safe=False)

    except Exception as e:
        # Handle unexpected errors
        return JsonResponse({"error": str(e)}, status=500)
    
@require_http_methods(["POST"])
@csrf_exempt
def delete_comment(request):
    try:
        data = json.loads(request.body)
        book_id = data.get('book_id')
        chapter = data.get('chapter')
        verse_number = data.get('verse_number')

        if book_id is None or chapter is None or verse_number is None:
            return HttpResponseBadRequest("Missing required fields.")

        book = get_object_or_404(Books, id=book_id)
        verse = get_object_or_404(Verses, book=book, chapter=chapter, verse_number=verse_number)
        comment = get_object_or_404(Comment, author=request.user, book=book, verse=verse)
        comment.delete()

        return JsonResponse({
            'status': 'success',
            'message': 'Comment deleted successfully.',
        })

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': 'An error occurred while deleting the comment.',
        }, status=500)
    
@require_POST
@csrf_exempt  # Only for development, use proper CSRF in production
def toggle_read_status(request):
    book_id = request.POST.get('book_id')
    user = request.user
    
    if not user.is_authenticated:
        return JsonResponse({'status': 'error', 'message': 'Not authenticated'}, status=401)
    
    try:
        book = Books.objects.get(id=book_id)
        read_book, created = ReadBook.objects.get_or_create(
            author=user,
            book=book
        )
        
        if not created:
            read_book.delete()
            return JsonResponse({'status': 'success', 'is_read': False})
        
        return JsonResponse({'status': 'success', 'is_read': True})
    
    except Books.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Book not found'}, status=404)
    
# In views.py
@require_http_methods(["POST"])
@csrf_exempt
def save_highlight(request):
    try:
        data = json.loads(request.body)
        book_id = data.get('book_id')
        chapter = data.get('chapter')
        verse_number = data.get('verse_number')
        color = data.get('color')
        text = data.get('text')
        start_offset = data.get('start_offset')
        end_offset = data.get('end_offset')

        if (
            book_id is None or
            chapter is None or
            verse_number is None or
            color is None or
            text is None or
            start_offset is None or
            end_offset is None
        ):
            return JsonResponse({'status': 'error', 'message': 'Missing required fields'}, status=400)


        book = get_object_or_404(Books, id=book_id)
        verse = get_object_or_404(Verses, book=book, chapter=chapter, verse_number=verse_number)

        highlight = Highlight.objects.create(
            author=request.user,
            book=book,
            verse=verse,
            color=color,
            start_offset=start_offset,
            end_offset=end_offset,
            highlighted_text=text
        )

        return JsonResponse({
            'status': 'success',
            'message': 'Highlight saved successfully',
            'highlight_id': highlight.id
        })

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@require_http_methods(["POST"])
@csrf_exempt
def remove_highlight(request):
    try:
        data = json.loads(request.body)
        book_id = data.get('book_id')
        chapter = data.get('chapter')
        verse_number = data.get('verse_number')
        start_offset = data.get('start_offset')
        end_offset = data.get('end_offset')
        
        if (
            book_id is None or
            chapter is None or
            verse_number is None or
            start_offset is None or
            end_offset is None
        ):
            return JsonResponse({'status': 'error', 'message': 'Missing required fields'}, status=400)

        book = get_object_or_404(Books, id=book_id)
        verse = get_object_or_404(Verses, book=book, chapter=chapter, verse_number=verse_number)

        Highlight.objects.filter(
            author=request.user,
            book=book,
            verse=verse,
            start_offset=start_offset,
            end_offset=end_offset
        ).delete()

        return JsonResponse({'status': 'success', 'message': 'Highlight removed successfully'})

    except Exception as e:
        return JsonResponse({
            'status': 'error', 
            'message': str(e)
        }, status=500)

@login_required
def fetch_highlights(request, book_id):
    try:
        book = get_object_or_404(Books, id=book_id)
        highlights = Highlight.objects.filter(author=request.user, book=book)
        
        highlights_data = []
        for highlight in highlights:
            highlights_data.append({
                'chapter': highlight.verse.chapter,
                'verse_number': highlight.verse.verse_number,
                'color': highlight.color,
                'start_offset': highlight.start_offset,
                'end_offset': highlight.end_offset,
                'text': highlight.highlighted_text,
                'creation_date': highlight.creation_date.strftime("%Y-%m-%d %H:%M:%S")
            })
            
        return JsonResponse({'highlights': highlights_data})
    
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)