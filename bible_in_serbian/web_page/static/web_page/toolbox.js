const box = document.getElementById('floating-box');

// Set the initial position of the box with 10px spacing
box.style.position = 'fixed';
box.style.top = '10px'; // 10px from the top
box.style.left = '10px'; // 10px from the left

let isDragging = false;
let offsetX, offsetY;
let isHighlightActive = false; // State variable to track highlight functionality
let isCommentActive = false; // State variable to track comment functionality
let isBookmarkActive = false; // State variable to track bookmark functionality

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

// Button actions
document.getElementById('highlight').addEventListener('click', () => {
    isHighlightActive = !isHighlightActive; // Toggle the highlight functionality
    alert(`Highlight functionality is ${isHighlightActive ? 'active' : 'inactive'}`);
});

document.getElementById('comment').addEventListener('click', () => {
    isCommentActive = !isCommentActive; // Toggle comment functionality
    if (isCommentActive) {
        transformBoxIntoCommentForm();
    } else {
        transformBoxIntoToolbox();
    }
});

document.getElementById('quote').addEventListener('click', () => {
    alert('Quote action triggered');
});

// Update the bookmark button click handler
document.getElementById('bookmark').addEventListener('click', () => {
    isBookmarkActive = !isBookmarkActive; // Toggle bookmark functionality
    if (isBookmarkActive) {
        saveBookmark();
    }
});

// Function to highlight the selected text
function highlightSelectedText() {
    if (!isHighlightActive) return; // Only highlight if the functionality is active

    const selection = window.getSelection();
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);

        // Check if the selection contains any highlighted text
        const containsHighlight = Array.from(range.cloneContents().querySelectorAll('.highlight')).length > 0;

        if (containsHighlight) {// Declare csrfToken at the top of the script
            const csrfToken = getCookie('csrftoken');
            
            // If the selection contains highlighted text, remove the highlight from the entire selection
            const span = document.createElement('span');
            span.appendChild(range.extractContents());
            range.insertNode(span);

            // Remove the highlight class from all elements within the span
            span.querySelectorAll('.highlight').forEach(highlightedElement => {
                const textNode = document.createTextNode(highlightedElement.textContent);
                highlightedElement.parentNode.replaceChild(textNode, highlightedElement);
            });

            // Normalize the text nodes to merge adjacent text nodes
            span.parentNode.normalize();
        } else {
            // If the selection does not contain highlighted text, add a new highlight
            const span = document.createElement('span');
            span.className = 'highlight';
            range.surroundContents(span);
        }

        selection.removeAllRanges(); // Clear the selection after highlighting
    }
}

// Add event listener for text selection
document.addEventListener('mouseup', function() {
    highlightSelectedText();
});

document.getElementById('comment').addEventListener('click', () => {
    isCommentActive = !isCommentActive; // Toggle comment functionality
    if (isCommentActive) {
        transformBoxIntoCommentForm();
    } else {
        transformBoxIntoToolbox();
    }
});

document.getElementById('quote').addEventListener('click', () => {
    alert('Quote action triggered');
});

// Update the bookmark button click handler
document.getElementById('bookmark').addEventListener('click', () => {
    isBookmarkActive = !isBookmarkActive; // Toggle bookmark functionality
    if (isBookmarkActive) {
        saveBookmark();
    }
});

// Function to transform the floating box into a comment form
function transformBoxIntoCommentForm() {
    box.innerHTML = `
        <div id="header">Коментариши</div>
        <textarea id="comment-text" placeholder="Унесите коментар..." rows="4"></textarea>
        <button id="save-comment">Сачувај</button>
        <button id="exit-comment">Изађи</button>
    `;

    // Add event listeners for the new buttons
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
        <button id="bookmark">Означи</button>
    `;

    // Reattach event listeners for the toolbox buttons
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
    document.getElementById('bookmark').addEventListener('click', () => {
        alert('Bookmark action triggered');
    });
}

function saveComment() {
    const commentText = document.getElementById('comment-text').value.trim();
    if (!commentText) {
        alert('Коментар не може бити празан.');
        return;
    }

    // Get the selected verse
    const selectedVerse = getSelectedVerse();
    if (!selectedVerse) {
        alert('Молимо изаберите стих пре него што сачувате коментар.');
        return;
    }

    // Prepare data for the AJAX request
    const data = {
        book_id: selectedVerse.bookId,
        chapter: selectedVerse.chapter,
        verse_number: selectedVerse.verseNumber,
        comment: commentText,
    };

    // Send the AJAX request
    fetch('/fetch/save_comment/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'), // Include CSRF token for Django
        },
        body: JSON.stringify(data),
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json(); // Parse the response as JSON
    })
    .then((data) => {
        if (data.status === 'success') {
            alert('Коментар је успешно сачуван.');
            document.addEventListener('click', function(event) {
                const clickedElement = event.target;
                const selectedVerse = getSelectedVerse(clickedElement);
            
                if (selectedVerse) {
                    // Remove the 'selected' class from all verses
                    document.querySelectorAll('.verse').forEach(verse => verse.classList.remove('selected'));
            
                    // Add the 'selected' class to the clicked verse
                    const selectedElement = clickedElement.closest('.verse');
                    selectedElement.classList.add('selected');
            
                    console.log('Selected Verse:', selectedVerse);
                }
            });            transformBoxIntoToolbox();
        } else {
            alert(`Грешка: ${data.message}`);
        }
    })
    .catch((error) => {
        console.error('Грешка:', error);
        alert('Дошло је до грешке приликом чувања коментара.');
    });
}

// Function to get the selected verse
function getSelectedVerse() {
    // Get the selected verse element
    const selectedElement = document.querySelector('.verse.selected'); // Adjust this selector if needed

    if (selectedElement) {
        // Extract the data attributes from the selected element
        const bookId = selectedElement.dataset.bookId; // Assuming bookId is also stored in data attributes
        const chapter = selectedElement.dataset.chapter;
        const verseNumber = selectedElement.dataset.verseNumber;

        // Return the verse details
        return {
            bookId: bookId,
            chapter: chapter,
            verseNumber: verseNumber,
        };
    }

    // Return null if no verse is selected
    return null;
}

// Function to get the CSRF token from cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === name + '=') {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Add event listener for verse selection
document.addEventListener('click', function (event) {
    const clickedElement = event.target;
    const verseElement = clickedElement.closest('.verse');

    if (verseElement) {
        // Remove the 'selected' class from all verses
        document.querySelectorAll('.verse').forEach((verse) => verse.classList.remove('selected'));

        // Add the 'selected' class to the clicked verse
        verseElement.classList.add('selected');
    }
});

// Function to save the bookmark
function saveBookmark() {
    // Get the selected verse
    const selectedVerse = getSelectedVerse();
    if (!selectedVerse) {
        alert('Молимо изаберите стих пре него што сачувате обележивач.');
        isBookmarkActive = false;
        return;
    }

    // Prepare data for the AJAX request
    const data = {
        book_id: selectedVerse.bookId,
        chapter: selectedVerse.chapter,
        verse_number: selectedVerse.verseNumber,
    };

    // Send the AJAX request
    fetch('/fetch/save_bookmark/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'), // Include CSRF token for Django
        },
        body: JSON.stringify(data),
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json(); // Parse the response as JSON
    })
    .then((data) => {
        if (data.status === 'success') {
            alert('Обележивач је успешно сачуван.');
        } else {
            alert(`Грешка: ${data.message}`);
        }
        isBookmarkActive = false;
    })
    .catch((error) => {
        console.error('Грешка:', error);
        alert('Дошло је до грешке приликом чувања обележивача.');
        isBookmarkActive = false;
    });
}
