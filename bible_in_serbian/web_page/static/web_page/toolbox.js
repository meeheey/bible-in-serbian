const box = document.getElementById('floating-box');

let isDragging = false;
let offsetX, offsetY;
let isHighlightActive = false; // State variable to track highlight functionality
let isCommentActive = false; // State variable to track comment functionality

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

document.getElementById('bookmark').addEventListener('click', () => {
    alert('Bookmark action triggered');
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
            
            document.addEventListener('DOMContentLoaded', function() {
                // Get the book ID from the data attribute
                const bookData = document.getElementById('book-data');
                const bookId = bookData ? bookData.getAttribute('data-book-id') : null;
            
                if (bookId) {
                    fetchVerses(bookId, 'verses');
                } else {
                    console.error('Book ID not found.');
                }
            
                // Event listener for search bar
                const searchBar = document.getElementById('searchBar');
                if (searchBar) {
                    searchBar.addEventListener('input', function() {
                        const searchText = this.value.toLowerCase();
                        filterVerses('verses', searchText);
                    });
                } else {
                    console.error('Element with id "searchBar" not found.');
                }
            
                // Event listener for the checkbox
                const showChapterCheckbox = document.getElementById('showChapter');
                if (showChapterCheckbox) {
                    showChapterCheckbox.addEventListener('change', function() {
                        const searchText = document.getElementById('searchBar').value.toLowerCase();
                        filterVerses('verses', searchText);
                    });
                } else {
                    console.error('Element with id "showChapter" not found.');
                }
            
                // Event listeners for Page 1
                const bookIdPage1 = "{{ book.id }}";
                if (bookIdPage1) {
                    fetchVerses(bookIdPage1, 'verses');
                }
            
                // Event listeners for Page 2
                const book1Dropdown = document.getElementById('book1');
                const book2Dropdown = document.getElementById('book2');
            
                if (book1Dropdown) {
                    book1Dropdown.addEventListener('change', function() {
                        const bookId = this.value;
                        if (bookId) {
                            fetchVerses(bookId, 'verses1');
                        } else {
                            document.getElementById('verses1').innerHTML = '';
                        }
                    });
                }
            
                if (book2Dropdown) {
                    book2Dropdown.addEventListener('change', function() {
                        const bookId = this.value;
                        if (bookId) {
                            fetchVerses(bookId, 'verses2');
                        } else {
                            document.getElementById('verses2').innerHTML = '';
                        }
                    });
                }
            
                // Event listener for search bar on Page 2
                const searchBarPage2 = document.getElementById('searchBar');
                if (searchBarPage2) {
                    searchBarPage2.addEventListener('input', function() {
                        const searchText = this.value.toLowerCase();
                        filterVerses('verses1', searchText);
                        filterVerses('verses2', searchText);
                    });
                }
            
                // Event listener for the checkbox on Page 2
                const showChapterCheckboxPage2 = document.getElementById('showChapter');
                if (showChapterCheckboxPage2) {
                    showChapterCheckboxPage2.addEventListener('change', function() {
                        const searchText = document.getElementById('searchBar').value.toLowerCase();
                        filterVerses('verses1', searchText);
                        filterVerses('verses2', searchText);
                    });
                }
            });
            
            // Fetch verses from the server
            function fetchVerses(bookId, targetDivId) {
                fetch(`/fetch/${bookId}/`, {
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
                            // Format for heading verses
                            return `<div class="verse" data-chapter="${verse.chapter}" data-verse-number="${verse.verse_number}">
                                        <strong>${verse.chapter}</strong> <em>${verse.verse}</em>
                                    </div>`;
                        } else {
                            // Format for regular verses
                            return `<div class="verse" data-chapter="${verse.chapter}" data-verse-number="${verse.verse_number}">
                                        <strong>${verse.chapter}:${verse.verse_number}</strong> ${verse.verse}
                                    </div>`;
                        }
                    }).join('');
                    document.getElementById(targetDivId).innerHTML = versesHtml;
            
                    // Fetch comments for the book
                    fetchComments(bookId, targetDivId);
                })
                .catch(error => {
                    console.error('Error fetching verses:', error);
                    document.getElementById(targetDivId).innerHTML = `<p style="color: red;">Error loading verses: ${error.message}</p>`;
                });
            }
            
            function fetchComments(bookId, targetDivId) {
                fetch(`/fetch/${bookId}/comments/`, {
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
                    if (data.comments && data.comments.length > 0) {
                        data.comments.forEach(comment => {
                            const verseElement = document.querySelector(`#${targetDivId} .verse[data-chapter="${comment.chapter}"][data-verse-number="${comment.verse_number}"]`);
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
            
            // Function to get a cookie by name
            function getCookie(name) {
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
            
            // Filter verses based on search text
            function filterVerses(targetDivId, searchText) {
                const verses = document.querySelectorAll(`#${targetDivId} .verse`);
                const searchTerms = searchText.toLowerCase().split(/\s+/); // Split search text into terms
                const showChapter = document.getElementById('showChapter').checked;
            
                // Helper function to check if a verse matches the search terms
                function matchesSearch(verseText, terms) {
                    let result = true;
                    terms.forEach(term => {
                        if (term.startsWith('!')) {
                            // NOT operator: term should NOT be present
                            if (verseText.includes(term.slice(1))) {
                                result = false;
                            }
                        } else if (term.includes('&')) {
                            // AND operator: all sub-terms must be present
                            const subTerms = term.split('&');
                            if (!subTerms.every(subTerm => verseText.includes(subTerm))) {
                                result = false;
                            }
                        } else if (term.includes('|')) {
                            // OR operator: at least one sub-term must be present
                            const subTerms = term.split('|');
                            if (!subTerms.some(subTerm => verseText.includes(subTerm))) {
                                result = false;
                            }
                        } else {
                            // Default: term must be present
                            if (!verseText.includes(term)) {
                                result = false;
                            }
                        }
                    });
                    return result;
                }
            
                // Get all chapters in the current container
                const chapters = new Set();
                const matchingChapters = new Set();
            
                verses.forEach(verse => {
                    const chapter = verse.getAttribute('data-chapter');
                    const verseText = verse.textContent.toLowerCase();
            
                    if (matchesSearch(verseText, searchTerms)) {
                        matchingChapters.add(chapter); // Mark the chapter as containing a match
                    }
            
                    chapters.add(chapter); // Add all chapters to the set
                });
            
                // Filter verses
                verses.forEach(verse => {
                    const chapter = verse.getAttribute('data-chapter');
                    const verseText = verse.textContent.toLowerCase();
                    const matches = matchesSearch(verseText, searchTerms);
            
                    if (showChapter) {
                        // If showChapter is checked, show all verses in the matching chapter
                        if (matchingChapters.has(chapter)) {
                            verse.style.display = '';
                        } else {
                            verse.style.display = 'none';
                        }
                    } else {
                        // Show only the matching verse when checkbox is unchecked
                        if (matches) {
                            verse.style.display = '';
                        } else {
                            verse.style.display = 'none';
                        }
                    }
                });
            }
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

document.getElementById('bookmark').addEventListener('click', () => {
    alert('Bookmark action triggered');
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