import { 
    getCookie, 
    fetchComments, 
    fetchBookmarks, 
    fetchHighlights,
    saveHighlight,
    removeHighlight,
    getSelectedVerse, 
    getTargetDivIdForVerse
} from './utils.js';

const box = document.getElementById('floating-box');

// Initialize toolbox position
function positionToolbox() {
    box.style.position = 'fixed';
    
    if (window.innerWidth <= 768) { // Mobile
        box.style.bottom = '10px';
        box.style.left = '10px';
        box.style.top = 'auto';
        box.style.right = 'auto';
    } else { // Desktop
        box.style.top = '10px';
        box.style.left = '10px';
        box.style.bottom = 'auto';
        box.style.right = 'auto';
    }
}

// Set initial position
positionToolbox();

// Debounce the resize event
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(positionToolbox, 100);
});

// Toolbox state variables
let isDragging = false;
let offsetX, offsetY;
let isHighlightActive = false;
let isCommentActive = false;
let isQuoteActive = false;

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

// ======================
//  Highlight Functions
// ======================

/**
 * Highlights selected text with the specified color
 * @param {string} color 
 */
function highlightSelectedText(color) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const selectedVerse = getSelectedVerse();
        
        if (!selectedVerse) {
            alert('Молимо изаберите стих пре него што подвучете текст.');
            return;
        }

        // Check if selection is within a verse
        const verseElement = range.startContainer.parentElement.closest('.verse');
        if (!verseElement) {
            alert('Подвлачење је могуће само унутар стихова.');
            return;
        }

        // Save the original text and offsets
        const selectedText = range.toString();
        const startOffset = getTextOffset(verseElement, range.startContainer, range.startOffset);
        const endOffset = startOffset + selectedText.length;

        // Create highlight span
        const span = document.createElement('span');
        span.className = `highlight ${color}`;
        range.surroundContents(span);

        // Save to server
        saveHighlight({
            book_id: selectedVerse.bookId,
            chapter: selectedVerse.chapter,
            verse_number: selectedVerse.verseNumber,
            color: color,
            text: selectedText,
            start_offset: startOffset,
            end_offset: endOffset
        }).catch(error => {
            // If save fails, remove the highlight
            span.replaceWith(span.childNodes[0]);
            console.error('Failed to save highlight:', error);
        });

        selection.removeAllRanges();
    }
}

/**
 * Removes highlight from selected text
 */
function removeHighlightFromSelection() {
    const selection = window.getSelection();
    if (selection.rangeCount === 0 || selection.isCollapsed) {
        alert('Молимо означите подвучени текст који желите да уклоните.');
        return;
    }

    const selectedVerse = getSelectedVerse();
    if (!selectedVerse) {
        alert('Молимо изаберите стих пре него што уклоните подвлачење.');
        return;
    }

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const verseElement = container.nodeType === Node.ELEMENT_NODE
        ? container.closest('.verse')
        : container.parentElement.closest('.verse');

    if (!verseElement) {
        alert('Подвлачење се може уклонити само унутар стихова.');
        return;
    }

    // Find all highlights within the selection
    const highlightsToRemove = [];
    const walker = document.createTreeWalker(
        verseElement,
        NodeFilter.SHOW_ELEMENT,
        {
            acceptNode: node => {
                if (
                    node.classList &&
                    node.classList.contains('highlight') &&
                    range.intersectsNode(node)
                ) {
                    return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_SKIP;
            }
        },
        false
    );

    let node;
    while ((node = walker.nextNode())) {
        highlightsToRemove.push(node);
    }

    if (highlightsToRemove.length === 0) {
        alert('Није пронађено подвучено у изабраном делу.');
        return;
    }

    highlightsToRemove.forEach(highlight => {
        const highlightText = highlight.textContent;

        const startOffset = getTextOffset(verseElement, highlight.firstChild, 0);
        const endOffset = startOffset + highlightText.length;

        // Unwrap the highlight span
        highlight.replaceWith(...highlight.childNodes);

        // Notify server to remove it
        removeHighlight({
            book_id: selectedVerse.bookId,
            chapter: selectedVerse.chapter,
            verse_number: selectedVerse.verseNumber,
            start_offset: startOffset,
            end_offset: endOffset
        }).catch(error => {
            console.error('Failed to remove highlight:', error);
        });
    });

    selection.removeAllRanges();
}


/**
 * Calculates text offset within a verse element
 * @param {HTMLElement} verseElement 
 * @param {Node} node 
 * @param {number} nodeOffset 
 * @returns {number}
 */
function getTextOffset(verseElement, node, nodeOffset) {
    const walker = document.createTreeWalker(
        verseElement,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    let offset = 0;
    let currentNode;
    
    while (currentNode = walker.nextNode()) {
        if (currentNode === node) {
            return offset + nodeOffset;
        }
        offset += currentNode.textContent.length;
    }
    
    return offset;
}

/**
 * Toggles highlight mode
 */
function toggleHighlightMode() {
    isHighlightActive = !isHighlightActive;
    if (isHighlightActive) {
        transformBoxIntoHighlightForm();
    } else {
        transformBoxIntoToolbox();
    }
}


// ======================
//  Comment Functions
// ======================

/**
 * Transforms the toolbox into a comment form
 */
function transformBoxIntoCommentForm() {
    const selectedVerse = getSelectedVerse();
    if (!selectedVerse) return;

    // Check for existing comment
    const verseElement = document.querySelector(
        `.verse[data-book-id="${selectedVerse.bookId}"][data-chapter="${selectedVerse.chapter}"][data-verse-number="${selectedVerse.verseNumber}"] .fa-comment`
    );
    const existingComment = verseElement ? verseElement.title.split('\n')[0] : '';

    box.innerHTML = `
        <div id="header">${verseElement ? 'Измени коментар' : 'Додај коментар'}</div>
        <textarea id="comment-text" placeholder="Унесите коментар..." rows="4">${existingComment}</textarea>
        <button id="save-comment">Сачувај измене</button>
        ${verseElement ? '<button id="delete-comment">Обриши коментар</button>' : ''}
        <button id="exit-comment">Изађи</button>
    `;

    document.getElementById('save-comment').addEventListener('click', saveComment);
    document.getElementById('exit-comment').addEventListener('click', () => {
        isCommentActive = false;
        transformBoxIntoToolbox();
    });
    
    if (verseElement) {
        document.getElementById('delete-comment').addEventListener('click', deleteComment);
    }
}

function transformBoxIntoHighlightForm() {

    box.innerHTML = `
        <div id="header">Одаберите боју</div>
        <div class="highlight-options-form">
            <button class="highlight-color yellow" data-color="yellow" title="Жута" style="background-color: yellow;"></button>
            <button class="highlight-color blue" data-color="blue" title="Плава" style="background-color: #add8e6;"></button>
            <button class="highlight-color green" data-color="green" title="Зелена" style="background-color: #90ee90;"></button>
            <button class="highlight-color pink" data-color="pink" title="Розе" style="background-color: #ffc0cb;"></button>
        </div>
        <button id="remove-highlight">Уклони подвлачење</button>
        <button id="exit-highlight">Изађи</button>
    `;

    document.querySelectorAll('.highlight-color').forEach(btn => {
        btn.addEventListener('click', function() {
            highlightSelectedText(this.dataset.color);
        });
    });

    document.getElementById('remove-highlight').addEventListener('click', removeHighlightFromSelection);
    document.getElementById('exit-highlight').addEventListener('click', () => {
        isHighlightActive = false;
        transformBoxIntoToolbox();
    });
}

/**
 * Saves a comment
 */
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
    .then(response => {
        if (!response.ok) {
            return response.json().then(errData => {
                throw new Error(errData.message || `HTTP error! Status: ${response.status}`);
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            alert('Коментар је успешно сачуван.');
            const targetDivId = getTargetDivIdForVerse(selectedVerse.bookId);
            return fetchComments(selectedVerse.bookId, targetDivId)
                .then(() => {
                    isCommentActive = false;
                    transformBoxIntoToolbox();
                });
        } else {
            throw new Error(data.message || 'Unknown error occurred while saving comment');
        }
    })
    .catch(error => {
        console.error('Error saving comment:', error);
        alert(`Дошло је до грешке приликом чувања коментара: ${error.message}`);
    });
}

/**
 * Deletes a comment
 */
function deleteComment() {
    const selectedVerse = getSelectedVerse();
    if (!selectedVerse) {
        alert('Молимо изаберите стих пре брисања коментара.');
        return;
    }

    if (!confirm('Да ли сте сигурни да желите да обришете овај коментар?')) {
        return;
    }

    const data = {
        book_id: selectedVerse.bookId,
        chapter: selectedVerse.chapter,
        verse_number: selectedVerse.verseNumber,
    };

    fetch('/fetch/delete_comment/', {
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
            alert('Коментар је успешно обрисан.');
            const targetDivId = getTargetDivIdForVerse(selectedVerse.bookId);
            fetchComments(selectedVerse.bookId, targetDivId)
                .then(() => {
                    isCommentActive = false;
                    transformBoxIntoToolbox();
                });
        } else {
            alert(`Грешка: ${data.message}`);
        }
    })
    .catch((error) => {
        console.error('Грешка:', error);
        alert('Дошло је до грешке приликом брисања коментара.');
    });
}

// ======================
//  Bookmark Functions
// ======================

/**
 * Toggles a bookmark
 */
function toggleBookmark() {
    const selectedVerse = getSelectedVerse();
    if (!selectedVerse) {
        alert('Молимо изаберите стих пре него што сачувате обележивач.');
        return;
    }

    const verseElement = document.querySelector(
        `.verse[data-book-id="${selectedVerse.bookId}"][data-chapter="${selectedVerse.chapter}"][data-verse-number="${selectedVerse.verseNumber}"] .fa-bookmark`
    );

    if (verseElement) {
        removeBookmark(selectedVerse);
    } else {
        saveBookmark(selectedVerse);
    }
}

/**
 * Saves a bookmark
 * @param {object} selectedVerse 
 */
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
            fetchBookmarks(selectedVerse.bookId, targetDivId)
                .then(() => updateBookmarkButton());
        } else {
            alert(`Грешка: ${data.message}`);
        }
    })
    .catch((error) => {
        console.error('Грешка:', error);
        alert('Дошло је до грешке приликом чувања обележивача.');
    });
}

/**
 * Removes a bookmark
 * @param {object} selectedVerse 
 */
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
            fetchBookmarks(selectedVerse.bookId, targetDivId)
                .then(() => updateBookmarkButton());
        } else {
            alert(`Грешка: ${data.message}`);
        }
    })
    .catch((error) => {
        console.error('Грешка:', error);
        alert('Дошло је до грешке приликом уклањања обележивача.');
    });
}

// ======================
//  Quote Function
// ======================

/**
 * Copies verse to clipboard
 */
function copyVerseToClipboard() {
    const selectedVerses = document.querySelectorAll('.verse.selected');
    
    if (selectedVerses.length === 0) {
        alert('Молимо изаберите стих пре него што га копирате.');
        return;
    }

    const verseElement = selectedVerses[0];
    const bookAcronym = verseElement.getAttribute('data-book-acronym') || 
                       verseElement.getAttribute('data-book-id');
    const chapter = verseElement.getAttribute('data-chapter-mask');
    const verseNumber = verseElement.getAttribute('data-verse-number-mask');

    // Clone the verse to safely manipulate it
    const verseClone = verseElement.cloneNode(true);
    
    // Remove verse number element (the <strong> tag)
    const verseNumberElement = verseClone.querySelector('strong');
    if (verseNumberElement) {
        verseNumberElement.remove();
    }
    
    // Remove any annotation icons
    verseClone.querySelectorAll('.fa, .annotation-icon, button').forEach(el => el.remove());
    
    // Get clean text
    let verseText = verseClone.textContent
    .replace(/\s+/g, ' ')
    .trim();

    // Remove all trailing punctuation before closing quote
    verseText = verseText.replace(/[.,;:]+([”"]?)$/, '$1');

    // Enhanced formatting
    let verseReference = chapter;
    if (verseNumber && verseNumber !== "0") {
    verseReference += `:${verseNumber}`;
    }
    const formattedText = `„${verseText}“ (${bookAcronym} ${verseReference})`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(formattedText)
        .then(() => {
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

// ======================
//  Toolbox UI Functions
// ======================

/**
 * Transforms the toolbox into the main tools view
 */
function transformBoxIntoToolbox() {
    box.innerHTML = `
        <div id="header">Алати</div>
        <div class="highlight-options" style="display: ${isHighlightActive ? 'flex' : 'none'}">
            <button class="highlight-color yellow" data-color="yellow" title="Жута"></button>
            <button class="highlight-color blue" data-color="blue" title="Плава"></button>
            <button class="highlight-color green" data-color="green" title="Зелена"></button>
            <button class="highlight-color pink" data-color="pink" title="Розе"></button>
        </div>
        <button id="highlight">${isHighlightActive ? 'Искључи подвлачење' : 'Подвуци'}</button>
        <button id="remove-highlight" style="display: ${isHighlightActive ? 'block' : 'none'}">Уклони подвлачење</button>
        <button id="comment">Коментариши</button>
        <button id="quote">Цитирај</button>
        <button id="bookmark">Обележи</button>
    `;

    // Update button states
    updateBookmarkButton();
    updateCommentButton();

    // Add event listeners
    document.getElementById('highlight').addEventListener('click', toggleHighlightMode);
    
    if (isHighlightActive) {
        document.querySelectorAll('.highlight-color').forEach(btn => {
            btn.addEventListener('click', function() {
                highlightSelectedText(this.dataset.color);
            });
        });
        
        document.getElementById('remove-highlight').addEventListener('click', removeHighlightFromSelection);
    }
    
    document.getElementById('comment').addEventListener('click', () => {
        isCommentActive = !isCommentActive;
        if (isCommentActive) {
            transformBoxIntoCommentForm();
        } else {
            transformBoxIntoToolbox();
        }
    });
    
    document.getElementById('quote').addEventListener('click', copyVerseToClipboard);
    document.getElementById('bookmark').addEventListener('click', toggleBookmark);
}

/**
 * Updates the comment button text based on existing comments
 */
function updateCommentButton() {
    const commentBtn = document.getElementById('comment');
    if (!commentBtn) return;

    const selectedVerse = getSelectedVerse();
    if (!selectedVerse) {
        commentBtn.textContent = 'Коментариши';
        return;
    }

    const verseElement = document.querySelector(
        `.verse[data-book-id="${selectedVerse.bookId}"][data-chapter="${selectedVerse.chapter}"][data-verse-number="${selectedVerse.verseNumber}"] .fa-comment`
    );

    commentBtn.textContent = verseElement ? 'Измени коментар' : 'Коментариши';
}

/**
 * Updates the bookmark button text based on existing bookmarks
 */
function updateBookmarkButton() {
    const bookmarkBtn = document.getElementById('bookmark');
    if (!bookmarkBtn) return;

    const selectedVerse = getSelectedVerse();
    if (!selectedVerse) {
        bookmarkBtn.textContent = 'Обележи';
        return;
    }

    const verseElement = document.querySelector(
        `.verse[data-book-id="${selectedVerse.bookId}"][data-chapter="${selectedVerse.chapter}"][data-verse-number="${selectedVerse.verseNumber}"] .fa-bookmark`
    );

    bookmarkBtn.textContent = verseElement ? 'Уклони обележивач' : 'Обележи';
}

// ======================
//  Verse Selection Handling
// ======================

document.addEventListener('click', function(event) {
    const clickedElement = event.target;
    const verseElement = clickedElement.closest('.verse');

    if (verseElement) {
        document.querySelectorAll('.verse').forEach((verse) => verse.classList.remove('selected'));
        verseElement.classList.add('selected');
        updateBookmarkButton();
        updateCommentButton();
        
        // If quote mode is active, copy the verse immediately
        if (isQuoteActive) {
            copyVerseToClipboard();
            isQuoteActive = false;
        }
    }
});