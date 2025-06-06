import { getCookie } from './utils.js';

document.addEventListener('DOMContentLoaded', function () {
    // Get initial data
    const bookId = JSON.parse(document.getElementById('book_id').textContent);
    const chapter = JSON.parse(document.getElementById('chapter').textContent);
    const verseNumber = JSON.parse(document.getElementById('verse_number').textContent);
    let isBookmarked = JSON.parse(document.getElementById('is_bookmarked').textContent);
    let commentText = JSON.parse(document.getElementById('comment_text').textContent); // Will be null if no comment
    
    // DOM elements
    const commentBtn = document.getElementById('comment-btn');
    const quoteBtn = document.getElementById('quote-btn');
    const bookmarkBtn = document.getElementById('save-or-remove-bookmark-btn');
    const verseContainer = document.getElementById('verse-container');
    const csrfToken = getCookie('csrftoken');
    
    // Track active form state
    let activeForm = null;
    
    // Update comment button icon based on existing comment
    function updateCommentButton() {
        if (!commentBtn) return;
        
        if (commentText) {
            commentBtn.innerHTML = `<i class='fas fa-comment'></i>`;
            commentBtn.title = 'Измени коментар';
        } else {
            commentBtn.innerHTML = `<i class='far fa-comment'></i>`;
            commentBtn.title = 'Додај коментар';
        }
    }
    
    // Clear any existing form before showing new one
    function clearActiveForm() {
        if (activeForm) {
            verseContainer.removeChild(activeForm);
            activeForm = null;
        }
        showActionButtons();
    }
    
    // Show comment form (for new or edit)
    function showCommentForm() {
        clearActiveForm();
        hideActionButtons();
        
        activeForm = document.createElement('div');
        activeForm.className = 'comment-form';
        
        if (commentText) {
            // Show existing comment with actions
            activeForm.innerHTML = `
                <div class="comment-header">Ваш коментар</div>
                <div class="existing-comment">${commentText}</div>
                <div class="comment-actions">
                    <button id="edit-comment" class="btn btn-primary">Измени</button>
                    <button id="delete-comment" class="btn btn-primary">Обриши</button>
                    <button id="exit-comment" class="btn btn-primary">Изађи</button>
                </div>
            `;
            
            verseContainer.appendChild(activeForm);
            
            document.getElementById('edit-comment').addEventListener('click', () => showEditForm());
            document.getElementById('delete-comment').addEventListener('click', deleteComment);
            document.getElementById('exit-comment').addEventListener('click', clearActiveForm);
        } else {
            // Show new comment form
            activeForm.innerHTML = `
                <div class="comment-header">Додај коментар</div>
                <textarea id="comment-text" placeholder="Унесите коментар..." rows="4"></textarea>
                <div class="comment-buttons">
                    <button id="save-comment" class="btn btn-primary">Сачувај</button>
                    <button id="cancel-comment" class="btn btn-primary">Откажи</button>
                </div>
            `;
            
            verseContainer.appendChild(activeForm);
            
            document.getElementById('save-comment').addEventListener('click', saveNewComment);
            document.getElementById('cancel-comment').addEventListener('click', clearActiveForm);
        }
    }
    
    // Show edit form
    function showEditForm() {
        clearActiveForm();
        hideActionButtons();
        
        activeForm = document.createElement('div');
        activeForm.className = 'comment-form';
        activeForm.innerHTML = `
            <div class="comment-header">Измени коментар</div>
            <textarea id="comment-text" placeholder="Унесите коментар..." rows="4">${commentText}</textarea>
            <div class="comment-buttons">
                <button id="update-comment" class="btn btn-primary">Ажурирај</button>
                <button id="cancel-edit" class="btn btn-primary">Откажи</button>
            </div>
        `;
        
        verseContainer.appendChild(activeForm);
        
        document.getElementById('update-comment').addEventListener('click', updateComment);
        document.getElementById('cancel-edit').addEventListener('click', () => showCommentForm());
    }
    
    // Hide action buttons
    function hideActionButtons() {
        document.querySelectorAll('#comment-btn, #save-or-remove-bookmark-btn, #quote-btn').forEach(btn => {
            btn.style.display = 'none';
        });
    }
    
    // Show action buttons
    function showActionButtons() {
        document.querySelectorAll('#comment-btn, #save-or-remove-bookmark-btn, #quote-btn').forEach(btn => {
            btn.style.display = 'inline-block';
        });
    }
    
    // Save new comment
    function saveNewComment() {
        const textarea = document.getElementById('comment-text');
        const newComment = textarea ? textarea.value.trim() : '';
        
        if (!newComment) {
            alert('Коментар не може бити празан.');
            return;
        }
        
        saveCommentData(newComment, 'new');
    }
    
    // Update existing comment
    function updateComment() {
        const textarea = document.getElementById('comment-text');
        const updatedComment = textarea ? textarea.value.trim() : '';
        
        if (!updatedComment) {
            alert('Коментар не може бити празан.');
            return;
        }
        
        saveCommentData(updatedComment, 'edit');
    }
    
    // Save comment to server
    function saveCommentData(comment, mode) {
        const data = {
            book_id: bookId,
            chapter: chapter,
            verse_number: verseNumber,
            comment: comment,
            mode: mode
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
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                // Update the comment text and show the comment immediately
                commentText = data.comment_text || comment;
                updateCommentButton();
                showCommentForm(); // Show the comment view after saving
            } else {
                throw new Error(data.message || 'Unknown error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert(`Дошло је до грешке: ${error.message}`);
        });
    }
    
    // Delete comment
    function deleteComment() {
        if (!confirm('Да ли сте сигурни да желите да обришете овај коментар?')) return;
        
        const data = {
            book_id: bookId,
            chapter: chapter,
            verse_number: verseNumber
        };
        
        fetch('/fetch/delete_comment/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify(data),
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                commentText = null;
                updateCommentButton();
                clearActiveForm();
            } else {
                throw new Error(data.message || 'Unknown error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert(`Дошло је до грешке: ${error.message}`);
        });
    }
    
    // Copy verse to clipboard
    function copyVerseToClipboard() {
        const verseText = document.getElementById('verse-text').textContent.trim();
        const verseReference = document.getElementById('verse-reference').textContent.trim();
        
        let cleanedText = verseText
            .replace(/\s+/g, ' ')
            .replace(/\s([,.;:!?])/g, '$1')
            .trim();
    
        cleanedText = cleanedText.replace(/[.,;:!?]+([”"]?)$/, '$1');
    
        if (!/[”"]$/.test(cleanedText)) {
            cleanedText = `„${cleanedText}“`;
        } else {
            cleanedText = cleanedText.replace(/^["']|["']$/g, '');
            cleanedText = `„${cleanedText}“`;
        }
    
        const formattedText = `${cleanedText} (${verseReference})`;
        
        // Create a temporary textarea element
        const textarea = document.createElement('textarea');
        textarea.value = formattedText;
        textarea.style.position = 'fixed';  // Prevent scrolling to bottom
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            // Try using modern clipboard API first
            if (navigator.clipboard) {
                navigator.clipboard.writeText(formattedText)
                    .then(() => {
                        alert('Стих је копиран у клипборд!');
                    })
                    .catch(() => {
                        // If modern API fails, fall back to execCommand
                        fallbackCopy();
                    });
            } else {
                // If clipboard API not available, use execCommand
                fallbackCopy();
            }
        } catch (err) {
            fallbackCopy();
        } finally {
            document.body.removeChild(textarea);
        }
        
        function fallbackCopy() {
            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    alert('Стих је копиран у клипборд!');
                } else {
                    throw new Error('Copy command failed');
                }
            } catch (err) {
                console.error('Грешка при копирању:', err);
                alert('Није успело копирање стиха. Молимо пробајте ручно.');
            }
        }
    }
    
    // Bookmark functions
    function toggleBookmark() {
        if (isBookmarked) {
            removeBookmark();
        } else {
            saveBookmark();
        }
    }
    
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
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                alert('Обележивач је успешно сачуван.');
                isBookmarked = true;
                updateBookmarkButton();
            } else {
                throw new Error(data.message || 'Unknown error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Дошло је до грешке приликом чувања обележивача.');
        });
    }

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
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                alert('Обележивач је успешно уклоњен.');
                isBookmarked = false;
                updateBookmarkButton();
            } else {
                throw new Error(data.message || 'Unknown error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Дошло је до грешке приликом уклањања обележивача.');
        });
    }

    function updateBookmarkButton() {
        if (bookmarkBtn) {
            if (isBookmarked) {
                bookmarkBtn.innerHTML = `<i class='fas fa-bookmark'></i>`;
                bookmarkBtn.title = 'Уклони обележивач';
            } else {
                bookmarkBtn.innerHTML = `<i class='far fa-bookmark'></i>`;
                bookmarkBtn.title = 'Додај обележивач';
            }
        }
    }

// Initialize buttons
updateCommentButton();
updateBookmarkButton();

// Event listeners
if (commentBtn) {
    commentBtn.addEventListener('click', showCommentForm);
}

if (quoteBtn) {
    quoteBtn.addEventListener('click', function(e) {
    copyVerseToClipboard();
    e.target.blur();
    });
}

if (bookmarkBtn) {
    bookmarkBtn.addEventListener('click', function (e) {
        toggleBookmark();
        e.target.blur();
    });
}
});