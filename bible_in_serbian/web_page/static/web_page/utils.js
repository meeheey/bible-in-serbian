// utils.js
const csrfToken = getCookie('csrftoken');

// ======================
//  Core Utility Functions
// ======================

/**
 * Gets cookie by name
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value
 */
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

/**
 * Gets currently selected verse details
 * @returns {object|null} Verse details or null if none selected
 */
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

/**
 * Finds the appropriate container div ID for a verse
 * @param {string} bookId 
 * @returns {string} ID of the target div
 */
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

/**
 * Gets all text nodes within an element
 * @param {HTMLElement} element 
 * @returns {Array} Array of text nodes
 */
function getTextNodes(element) {
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
        textNodes.push(node);
    }
    
    return textNodes;
}

// ======================
//  Highlight Functions
// ======================

/**
 * Fetches highlights for a specific book
 * @param {string} bookId 
 * @param {string} targetDivId 
 * @returns {Promise}
 */
export function fetchHighlights(bookId, targetDivId) {
    return fetch(`/fetch/${bookId}/highlights/`, {
        headers: {
            'X-CSRFToken': csrfToken
        }
    })
    .then(response => response.json())
    .then(data => {
        // Remove existing highlights first
        document.querySelectorAll(`#${targetDivId} .verse .highlight`).forEach(hl => {
            const textNode = document.createTextNode(hl.textContent);
            hl.parentNode.replaceChild(textNode, hl);
        });

        // Apply new highlights
        if (data.highlights && data.highlights.length > 0) {
            data.highlights.forEach(highlight => {
                const verseElement = document.querySelector(
                    `#${targetDivId} .verse[data-chapter="${highlight.chapter}"][data-verse-number="${highlight.verse_number}"]`
                );
                
                if (verseElement) {
                    const textNodes = getTextNodes(verseElement);
                    let currentOffset = 0;
                    let startNode, endNode;
                    let startOffset, endOffset;

                    for (const node of textNodes) {
                        const nodeLength = node.textContent.length;
                        
                        if (!startNode && currentOffset + nodeLength > highlight.start_offset) {
                            startNode = node;
                            startOffset = highlight.start_offset - currentOffset;
                        }
                        
                        if (!endNode && currentOffset + nodeLength >= highlight.end_offset) {
                            endNode = node;
                            endOffset = highlight.end_offset - currentOffset;
                            break;
                        }
                        
                        currentOffset += nodeLength;
                    }

                    if (startNode && endNode && startNode === endNode) {
                        const range = document.createRange();
                        range.setStart(startNode, startOffset);
                        range.setEnd(endNode, endOffset);
                        
                        const span = document.createElement('span');
                        span.className = `highlight ${highlight.color}`;
                        range.surroundContents(span);
                    }
                }
            });
        }
    })
    .catch(error => console.error('Error fetching highlights:', error));
}

/**
 * Saves a highlight to the server
 * @param {object} highlightData 
 * @returns {Promise}
 */
export function saveHighlight(highlightData) {
    return fetch('/fetch/save_highlight/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify(highlightData),
    })
    .then(response => response.json())
    .then(data => {
        if (data.status !== 'success') {
            console.error('Error saving highlight:', data.message);
        }
        return data;
    })
    .catch(error => {
        console.error('Error:', error);
        throw error;
    });
}

/**
 * Removes a highlight from the server
 * @param {object} highlightData 
 * @returns {Promise}
 */
export function removeHighlight(highlightData) {
    return fetch('/fetch/remove_highlight/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify(highlightData),
    })
    .then(response => response.json())
    .then(data => {
        if (data.status !== 'success') {
            console.error('Error removing highlight:', data.message);
        }
        return data;
    })
    .catch(error => {
        console.error('Error:', error);
        throw error;
    });
}

// ======================
//  Comment Functions
// ======================

/**
 * Fetches comments for a specific book
 * @param {string} bookId 
 * @param {string} targetDivId 
 * @returns {Promise}
 */
export function fetchComments(bookId, targetDivId) {
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
        // Remove all existing comment icons
        document.querySelectorAll(`#${targetDivId} .verse .fa-comment`).forEach(icon => {
            icon.remove();
        });

        // Add new comment icons if comments exist
        if (data.comments && data.comments.length > 0) {
            data.comments.forEach(comment => {
                const verseElement = document.querySelector(
                    `#${targetDivId} .verse[data-chapter="${comment.chapter}"][data-verse-number="${comment.verse_number}"]`
                );
                if (verseElement) {
                    const commentIcon = document.createElement('i');
                    commentIcon.className = 'fa fa-comment';
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

// ======================
//  Bookmark Functions
// ======================

/**
 * Fetches bookmarks for a specific book
 * @param {string} bookId 
 * @param {string} targetDivId 
 * @returns {Promise}
 */
export function fetchBookmarks(bookId, targetDivId) {
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
        // Remove all existing bookmark icons
        document.querySelectorAll(`#${targetDivId} .verse .fa-bookmark`).forEach(icon => {
            icon.remove();
        });

        // Add new bookmark icons if bookmarks exist
        if (data.bookmarks && data.bookmarks.length > 0) {
            data.bookmarks.forEach(bookmark => {
                const verseElement = document.querySelector(
                    `#${targetDivId} .verse[data-chapter="${bookmark.chapter}"][data-verse-number="${bookmark.verse_number}"]`
                );
                if (verseElement) {
                    const bookmarkIcon = document.createElement('i');
                    bookmarkIcon.className = 'fa fa-bookmark';
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

// ======================
//  Annotation Refresh
// ======================

/**
 * Refetches all annotations for a verse
 * @param {string} bookId 
 * @param {string} targetDivId 
 * @returns {Promise}
 */
export function refetchAnnotations(bookId, targetDivId) {
    return Promise.all([
        fetchComments(bookId, targetDivId),
        fetchBookmarks(bookId, targetDivId),
        fetchHighlights(bookId, targetDivId)
    ]);
}

// ======================
//  Verse Fetching
// ======================

/**
 * Fetches verses for a specific book
 * @param {string} bookId 
 * @param {string} targetDivId 
 * @returns {Promise}
 */
export function fetchVerses(bookId, targetDivId) {
    return fetch(`/fetch/${bookId}/`, {
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
        const versesHtml = data.verses.map(verse => {
            if (verse.verse_number === 0) {
                const displayReference = `${verse.chapter_mask}`;
                const verseUrl = `/books/${bookId}/${verse.chapter}/${verse.verse_number}/`;
                
                return `<div class="verse" data-book-id="${bookId}" data-book-acronym="${verse.book_acronym}" data-chapter="${verse.chapter}" data-chapter-mask="${verse.chapter_mask}" data-verse-number="${verse.verse_number}" data-verse-number-mask="${verse.verse_number_mask}">
                    <strong><a href="${verseUrl}">${displayReference}</a></strong>
                    <em>${verse.verse}</em>
                </div>`;
            } else {
                const displayReference = 
                    verse.chapter_mask && verse.verse_number_mask && verse.chapter_mask !== '' && verse.verse_number_mask !== ''
                        ? `${verse.chapter_mask}:${verse.verse_number_mask}`
                        : `${verse.chapter_mask || ''}${verse.verse_number_mask || ''}`;
                
                const verseUrl = `/books/${bookId}/${verse.chapter}/${verse.verse_number}/`;
                
                return `<div class="verse" data-book-id="${bookId}" data-book-acronym="${verse.book_acronym}" data-chapter="${verse.chapter}" data-chapter-mask="${verse.chapter_mask}" data-verse-number="${verse.verse_number}" data-verse-number-mask="${verse.verse_number_mask}">
                    <strong><a href="${verseUrl}">${displayReference}</a></strong>
                    ${verse.verse}
                </div>`;
            }
        }).join('');
        
        document.getElementById(targetDivId).innerHTML = versesHtml;
        
        // Fetch all annotations after verses are loaded
        return refetchAnnotations(bookId, targetDivId);
    })
    .catch(error => {
        console.error('Error fetching verses:', error);
        document.getElementById(targetDivId).innerHTML = `<p style="color: red;">Error loading verses: ${error.message}</p>`;
    });
}

// ======================
//  Verse Filtering
// ======================

/**
 * Filters verses based on search text
 * @param {string} targetDivId 
 * @param {string} searchText 
 */
export function filterVerses(targetDivId, searchText) {
    const verses = document.querySelectorAll(`#${targetDivId} .verse`);
    const searchTerms = searchText.toLowerCase().split(/\s+/);
    const showChapter = document.getElementById('showChapter').checked;

    function matchesSearch(verseText, terms) {
        return terms.every(term => {
            if (term.startsWith('!')) {
                return !verseText.includes(term.slice(1));
            }
            if (term.includes('&')) {
                return term.split('&').every(t => verseText.includes(t));
            }
            if (term.includes('|')) {
                return term.split('|').some(t => verseText.includes(t));
            }
            return verseText.includes(term);
        });
    }

    const chapters = new Set();
    const matchingChapters = new Set();

    verses.forEach(verse => {
        const chapter = verse.getAttribute('data-chapter');
        const verseText = verse.textContent.toLowerCase();

        chapters.add(chapter);
        if (matchesSearch(verseText, searchTerms)) {
            matchingChapters.add(chapter);
        }
    });

    verses.forEach(verse => {
        const chapter = verse.getAttribute('data-chapter');
        const verseText = verse.textContent.toLowerCase();
        const matches = matchesSearch(verseText, searchTerms);

        verse.style.display = showChapter
            ? (matchingChapters.has(chapter) ? '' : 'none')
            : (matches ? '' : 'none');
    });
}