// Declare csrfToken at the top of the script
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
                return `<div class="verse" data-book-id="${bookId}" data-chapter="${verse.chapter}" data-verse-number="${verse.verse_number}">
                            <strong>${verse.chapter}</strong> <em>${verse.verse}</em>
                        </div>`;
            } else {
                // Format for regular verses
                return `<div class="verse" data-book-id="${bookId}" data-chapter="${verse.chapter}" data-verse-number="${verse.verse_number}">
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