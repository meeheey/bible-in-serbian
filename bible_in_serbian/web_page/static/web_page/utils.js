// utils.js

// Function to get a cookie by name
export function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Function to fetch comments for a book
export function fetchComments(bookId, targetDivId, csrfToken) {
    return fetch(`/fetch/${bookId}/comments/`, {
        headers: {
            'X-CSRFToken': csrfToken
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // First remove all existing comment icons
        document.querySelectorAll(`#${targetDivId} .verse .fa-comment`).forEach(icon => {
            icon.remove();
        });

        // Add new comment icons
        if (data.comments && data.comments.length > 0) {
            data.comments.forEach(comment => {
                const verseElement = document.querySelector(
                    `#${targetDivId} .verse[data-chapter="${comment.chapter}"][data-verse-number="${comment.verse_number}"]`
                );
                if (verseElement) {
                    const commentIcon = document.createElement('i');
                    commentIcon.className = 'fas fa-comment';
                    commentIcon.title = `${comment.comment}\nCreated on: ${comment.creation_date}`;
                    verseElement.appendChild(commentIcon);
                }
            });
        }
    })
    .catch(error => {
        console.error('Error fetching comments:', error);
    });
}

// Function to fetch bookmarks for a book
export function fetchBookmarks(bookId, targetDivId, csrfToken) {
    return fetch(`/fetch/${bookId}/bookmarks/`, {
        headers: {
            'X-CSRFToken': csrfToken
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // First remove all existing bookmark icons
        document.querySelectorAll(`#${targetDivId} .verse .fa-bookmark`).forEach(icon => {
            icon.remove();
        });

        // Add new bookmark icons
        if (data.bookmarks && data.bookmarks.length > 0) {
            data.bookmarks.forEach(bookmark => {
                const verseElement = document.querySelector(
                    `#${targetDivId} .verse[data-chapter="${bookmark.chapter}"][data-verse-number="${bookmark.verse_number}"]`
                );
                if (verseElement) {
                    const bookmarkIcon = document.createElement('i');
                    bookmarkIcon.className = 'fas fa-bookmark';
                    bookmarkIcon.title = `Created on: ${bookmark.creation_date}`;
                    verseElement.appendChild(bookmarkIcon);
                }
            });
        }
    })
    .catch(error => {
        console.error('Error fetching bookmarks:', error);
    });
}

// Function to get the selected verse
export function getSelectedVerse() {
    const selectedElement = document.querySelector('.verse.selected');
    if (selectedElement) {
        return {
            bookId: selectedElement.dataset.bookId,
            chapter: selectedElement.dataset.chapter,
            verseNumber: selectedElement.dataset.verseNumber,
        };
    }
    return null;
}

// Function to get the target div ID for a verse
export function getTargetDivIdForVerse(bookId) {
    if (document.getElementById('verses')) {
        return 'verses';
    } else if (document.getElementById('verses1') && 
               document.querySelector(`#verses1 .verse[data-book-id="${bookId}"]`)) {
        return 'verses1';
    } else if (document.getElementById('verses2') && 
               document.querySelector(`#verses2 .verse[data-book-id="${bookId}"]`)) {
        return 'verses2';
    }
    return 'verses';
}

// Function to refetch comments and bookmarks
export function refetchVerseAnnotations(bookId, chapter, verseNumber, targetDivId, csrfToken) {
    fetchComments(bookId, targetDivId, csrfToken);
    fetchBookmarks(bookId, targetDivId, csrfToken);
}