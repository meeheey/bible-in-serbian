import { 
    getCookie, 
    fetchComments, 
    fetchBookmarks, 
    getSelectedVerse, 
    getTargetDivIdForVerse, 
    refetchVerseAnnotations 
} from './utils.js';

const box = document.getElementById('floating-box');

// Set the initial position of the box
box.style.position = 'fixed';
box.style.top = '10px';
box.style.left = '10px';

let isDragging = false;
let offsetX, offsetY;
let isHighlightActive = false;
let isCommentActive = false;

// Initialize the toolbox
transformBoxIntoToolbox();

// Drag functionality
box.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - box.getBoundingClientRect().left;
    offsetY = e.clientY - box.getBoundingClientRect().top;
    box.style.cursor = 'grabbing';
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        box.style.left = `${e.clientX - offsetX}px`;
        box.style.top = `${e.clientY - offsetY}px`;
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    box.style.cursor = 'move';
});

// Function to highlight the selected text
function highlightSelectedText() {
    if (!isHighlightActive) return;

    const selection = window.getSelection();
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const containsHighlight = Array.from(range.cloneContents().querySelectorAll('.highlight')).length > 0;

        if (containsHighlight) {
            const span = document.createElement('span');
            span.appendChild(range.extractContents());
            range.insertNode(span);

            span.querySelectorAll('.highlight').forEach(highlightedElement => {
                const textNode = document.createTextNode(highlightedElement.textContent);
                highlightedElement.parentNode.replaceChild(textNode, highlightedElement);
            });

            span.parentNode.normalize();
        } else {
            const span = document.createElement('span');
            span.className = 'highlight';
            range.surroundContents(span);
        }

        selection.removeAllRanges();
    }
}

// Add event listener for text selection
document.addEventListener('mouseup', highlightSelectedText);

// Function to transform the floating box into a comment form
function transformBoxIntoCommentForm() {
    box.innerHTML = `
        <div id="header">Коментариши</div>
        <textarea id="comment-text" placeholder="Унесите коментар..." rows="4"></textarea>
        <button id="save-comment">Сачувај</button>
        <button id="exit-comment">Изађи</button>
    `;

    document.getElementById('save-comment').addEventListener('click', saveComment);
    document.getElementById('exit-comment').addEventListener('click', () => {
        isCommentActive = false;
        transformBoxIntoToolbox();
    });
}

// Function to transform the floating box back into the toolbox
function transformBoxIntoToolbox() {
    box.innerHTML = `
        <div id="header">Алати</div>
        <button id="highlight">Подвуци</button>
        <button id="comment">Коментариши</button>
        <button id="quote">Цитирај</button>
        <button id="bookmark">Обележи</button>
    `;

    // Update bookmark button based on current verse's bookmark status
    updateBookmarkButton();

    document.getElementById('highlight').addEventListener('click', () => {
        isHighlightActive = !isHighlightActive;
        alert(`Highlight functionality is ${isHighlightActive ? 'active' : 'inactive'}`);
    });
    
    document.getElementById('comment').addEventListener('click', () => {
        isCommentActive = !isCommentActive;
        if (isCommentActive) {
            transformBoxIntoCommentForm();
        } else {
            transformBoxIntoToolbox();
        }
    });
    
    document.getElementById('quote').addEventListener('click', () => {
        alert('Quote action triggered');
    });
    
    document.getElementById('bookmark').addEventListener('click', toggleBookmark);
}

// Function to update bookmark button text based on current verse's status
function updateBookmarkButton() {
    const bookmarkBtn = document.getElementById('bookmark');
    if (!bookmarkBtn) return;

    const selectedVerse = getSelectedVerse();
    if (!selectedVerse) {
        bookmarkBtn.textContent = 'Обележи';
        return;
    }

    // Check if current verse has a bookmark
    const verseElement = document.querySelector(
        `.verse[data-book-id="${selectedVerse.bookId}"][data-chapter="${selectedVerse.chapter}"][data-verse-number="${selectedVerse.verseNumber}"] .fa-bookmark`
    );

    if (verseElement) {
        bookmarkBtn.textContent = 'Уклони обележивач';
    } else {
        bookmarkBtn.textContent = 'Обележи';
    }
}

// Function to toggle bookmark
function toggleBookmark() {
    const selectedVerse = getSelectedVerse();
    if (!selectedVerse) {
        alert('Молимо изаберите стих пре него што сачувате обележивач.');
        return;
    }

    // Check if current verse has a bookmark
    const verseElement = document.querySelector(
        `.verse[data-book-id="${selectedVerse.bookId}"][data-chapter="${selectedVerse.chapter}"][data-verse-number="${selectedVerse.verseNumber}"] .fa-bookmark`
    );

    if (verseElement) {
        removeBookmark(selectedVerse);
    } else {
        saveBookmark(selectedVerse);
    }
}

// Function to save a comment
function saveComment() {
    const commentText = document.getElementById('comment-text').value.trim();
    if (!commentText) {
        alert('Коментар не може бити празан.');
        return;
    }

    const selectedVerse = getSelectedVerse();
    if (!selectedVerse) {
        alert('Молимо изаберите стих пре него што сачувате коментар.');
        return;
    }

    const data = {
        book_id: selectedVerse.bookId,
        chapter: selectedVerse.chapter,
        verse_number: selectedVerse.verseNumber,
        comment: commentText,
    };

    fetch('/fetch/save_comment/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify(data),
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then((data) => {
        if (data.status === 'success') {
            alert('Коментар је успешно сачуван.');
            const targetDivId = getTargetDivIdForVerse(selectedVerse.bookId);
            refetchVerseAnnotations(selectedVerse.bookId, selectedVerse.chapter, selectedVerse.verseNumber, targetDivId);
            transformBoxIntoToolbox();
        } else {
            alert(`Грешка: ${data.message}`);
        }
    })
    .catch((error) => {
        console.error('Грешка:', error);
        alert('Дошло је до грешке приликом чувања коментара.');
    });
}

// Function to save a bookmark
function saveBookmark(selectedVerse) {
    const data = {
        book_id: selectedVerse.bookId,
        chapter: selectedVerse.chapter,
        verse_number: selectedVerse.verseNumber,
    };

    fetch('/fetch/save_bookmark/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify(data),
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then((data) => {
        if (data.status === 'success') {
            alert('Обележивач је успешно сачуван.');
            const targetDivId = getTargetDivIdForVerse(selectedVerse.bookId);
            refetchVerseAnnotations(selectedVerse.bookId, selectedVerse.chapter, selectedVerse.verseNumber, targetDivId);
            updateBookmarkButton();
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
function removeBookmark(selectedVerse) {
    const data = {
        book_id: selectedVerse.bookId,
        chapter: selectedVerse.chapter,
        verse_number: selectedVerse.verseNumber,
    };

    fetch('/fetch/delete_bookmark/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify(data),
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then((data) => {
        if (data.status === 'success') {
            alert('Обележивач је успешно уклоњен.');
            const targetDivId = getTargetDivIdForVerse(selectedVerse.bookId);
            refetchVerseAnnotations(selectedVerse.bookId, selectedVerse.chapter, selectedVerse.verseNumber, targetDivId);
            updateBookmarkButton();
        } else {
            alert(`Грешка: ${data.message}`);
        }
    })
    .catch((error) => {
        console.error('Грешка:', error);
        alert('Дошло је до грешке приликом уклањања обележивача.');
    });
}

// Add event listener for verse selection
document.addEventListener('click', function(event) {
    const clickedElement = event.target;
    const verseElement = clickedElement.closest('.verse');

    if (verseElement) {
        // Remove the 'selected' class from all verses
        document.querySelectorAll('.verse').forEach((verse) => verse.classList.remove('selected'));

        // Add the 'selected' class to the clicked verse
        verseElement.classList.add('selected');
        
        // Update bookmark button when verse selection changes
        updateBookmarkButton();
    }
});