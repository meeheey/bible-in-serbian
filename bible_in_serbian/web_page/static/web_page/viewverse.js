import { getCookie } from './utils.js';

// Declare csrfToken at the top of the script
const csrfToken = getCookie('csrftoken');

document.addEventListener('DOMContentLoaded', function () {
    let verse = {};  // Define verse globally
    let bookId = JSON.parse(document.getElementById('book_id').textContent);
    let chapter = JSON.parse(document.getElementById('chapter').textContent);
    let verseNumber = JSON.parse(document.getElementById('verse_number').textContent);
    let isBookmarked = JSON.parse(document.getElementById('is_bookmarked').textContent);

    // Comment system functionality
    const commentBtn = document.getElementById('comment-btn');
    const quoteBtn = document.getElementById('quote-btn');
    const verseContainer = document.getElementById('verse-container');

    // Function to show comment form
    function showCommentForm() {
        // Check for existing comment (you'll need to implement this)
        // For now, we'll assume we don't know if there's an existing comment
        
        const commentForm = document.createElement('div');
        commentForm.className = 'comment-form';
        commentForm.innerHTML = `
            <div class="comment-header">Додај коментар</div>
            <textarea id="comment-text" placeholder="Унесите коментар..." rows="4"></textarea>
            <div class="comment-buttons">
                <button id="save-comment" class="btn btn-primary">Сачувај</button>
                <button id="cancel-comment" class="btn btn-primary">Откажи</button>
            </div>
        `;
        
        verseContainer.appendChild(commentForm);
        
        document.getElementById('save-comment').addEventListener('click', saveComment);
        document.getElementById('cancel-comment').addEventListener('click', () => {
            verseContainer.removeChild(commentForm);
        });
    }

    // Function to save a comment
    function saveComment() {
        const commentText = document.getElementById('comment-text').value.trim();
        if (!commentText) {
            alert('Коментар не може бити празан.');
            return;
        }

        const data = {
            book_id: bookId,
            chapter: chapter,
            verse_number: verseNumber,
            comment: commentText,
        };

        fetch('/fetch/save_comment/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify(data),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                alert('Коментар је успешно сачуван.');
                // Remove the comment form
                const commentForm = document.querySelector('.comment-form');
                if (commentForm) {
                    verseContainer.removeChild(commentForm);
                }
                // You might want to refresh the page or update the UI to show the comment was saved
            } else {
                throw new Error(data.message || 'Unknown error occurred while saving comment');
            }
        })
        .catch(error => {
            console.error('Error saving comment:', error);
            alert(`Дошло је до грешке приликом чувања коментара: ${error.message}`);
        });
    }

    function copyVerseToClipboard() {
        const verseText = document.getElementById('verse-text').textContent.trim();
        const verseReference = document.getElementById('verse-reference').textContent.trim();
        
        // Clean the verse text - remove unwanted spaces and normalize
        let cleanedText = verseText
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .replace(/\s([,.;:!?])/g, '$1') // Remove space before punctuation
            .trim();
    
        // Remove punctuation before closing quote, but preserve the quote
        cleanedText = cleanedText.replace(/[.,;:!?]+([”"]?)$/, '$1');
    
        // If the text doesn't end with a quote, add proper Serbian-style quotes
        if (!/[”"]$/.test(cleanedText)) {
            cleanedText = `„${cleanedText}“`;
        } else {
            // If it already has quotes, ensure proper formatting
            cleanedText = cleanedText.replace(/^["']|["']$/g, '');
            cleanedText = `„${cleanedText}“`;
        }
    
        // Final formatted text
        const formattedText = `${cleanedText} (${verseReference})`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(formattedText)
            .then(() => {
                // Optional: You can remove this alert if you prefer silent copying
                alert('Стих је копиран у клипборд!');
            })
            .catch(err => {
                console.error('Грешка при копирању:', err);
                // Fallback method
                const textarea = document.createElement('textarea');
                textarea.value = formattedText;
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    alert('Стих је копиран у клипборд!');
                } catch (e) {
                    alert('Није успело копирање стиха. Молимо пробајте ручно.');
                }
                document.body.removeChild(textarea);
            });
    }

    // Function to save a bookmark
    function saveBookmark() {
        const data = {
            book_id: bookId,
            chapter: chapter,
            verse_number: verseNumber,
        };

        fetch('/fetch/save_bookmark/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify(data),
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.status === 'success') {
                alert('Обележивач је успешно сачуван.');
                isBookmarked = true;
                changeButton();
            } else {
                alert(`Грешка: ${data.message}`);
            }
        })
        .catch((error) => {
            console.error('Грешка:', error);
            alert('Дошло је до грешке приликом чувања обележивача.');
        });
    }

    // Function to remove a bookmark
    function removeBookmark() {
        const data = {
            book_id: bookId,
            chapter: chapter,
            verse_number: verseNumber,
        };

        fetch('/fetch/delete_bookmark/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify(data),
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.status === 'success') {
                alert('Обележивач је успешно уклоњен.');
                isBookmarked = false;
                changeButton();
            } else {
                alert(`Грешка: ${data.message}`);
            }
        })
        .catch((error) => {
            console.error('Грешка:', error);
            alert('Дошло је до грешке приликом уклањања обележивача.');
        });
    }

    // Function to update the button based on bookmark status
    function changeButton() {
        const buttonElement = document.getElementById('save-or-remove-bookmark-btn');
        if (buttonElement) {
            if (isBookmarked) {
                buttonElement.innerHTML = `<i class='fas fa-bookmark'></i>`;
                buttonElement.title = 'Уклони обележивач';
            } else {
                buttonElement.innerHTML = `<i class='far fa-bookmark'></i>`;
                buttonElement.title = 'Додај обележивач';
            }
        }
    }

    // Event listeners
    if (commentBtn) {
        commentBtn.addEventListener('click', showCommentForm);
    }

    if (quoteBtn) {
        quoteBtn.addEventListener('click', copyVerseToClipboard);
    }

    const bookmarkBtn = document.getElementById('save-or-remove-bookmark-btn');
    if (bookmarkBtn) {
        bookmarkBtn.addEventListener('click', function (e) {
            if (isBookmarked) {
                removeBookmark();
            } else {
                saveBookmark();
            }
            e.target.blur(); // Remove focus
        });
    }

    // Change button initially based on the first fetched verse
    changeButton();
});