import { 
    getCookie, 
    fetchComments, 
    fetchBookmarks, 
    getSelectedVerse, 
    getTargetDivIdForVerse, 
    refetchVerseAnnotations 
} from './utils.js';

// Rest of your scripts.js code remains the same, just remove the moved functions

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

    // Add event listener for verse selection
    document.addEventListener('click', function(event) {
        const clickedElement = event.target;
        const verseElement = clickedElement.closest('.verse');

        if (verseElement) {
            // Remove the 'selected' class from all verses
            document.querySelectorAll('.verse').forEach((verse) => verse.classList.remove('selected'));

            // Add the 'selected' class to the clicked verse
            verseElement.classList.add('selected');
        }
    });
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
                            <strong>${verse.chapter_mask}</strong> <em>${verse.verse}</em>
                        </div>`;
            } else {
                return `<div class="verse" data-book-id="${bookId}" data-chapter="${verse.chapter}" data-verse-number="${verse.verse_number}">
            <strong>
                ${verse.chapter_mask && verse.verse_number_mask && verse.chapter_mask !== '' && verse.verse_number_mask !== '' 
                    ? `${verse.chapter_mask}:${verse.verse_number_mask}` 
                    : `${verse.chapter_mask || ''}${verse.verse_number_mask || ''}`}
            </strong>
            ${verse.verse}
        </div>`;

            }
        }).join('');
        document.getElementById(targetDivId).innerHTML = versesHtml;

        // Fetch comments and bookmarks for the book
        fetchComments(bookId, targetDivId);
        fetchBookmarks(bookId, targetDivId);
    })
    .catch(error => {
        console.error('Error fetching verses:', error);
        document.getElementById(targetDivId).innerHTML = `<p style="color: red;">Error loading verses: ${error.message}</p>`;
    });
}

// Filter verses based on search text
function filterVerses(targetDivId, searchText) {
    const verses = document.querySelectorAll(`#${targetDivId} .verse`);
    const searchTerms = searchText.toLowerCase().split(/\s+/);
    const showChapter = document.getElementById('showChapter').checked;

    function matchesSearch(verseText, terms) {
        let result = true;
        terms.forEach(term => {
            if (term.startsWith('!')) {
                if (verseText.includes(term.slice(1))) {
                    result = false;
                }
            } else if (term.includes('&')) {
                const subTerms = term.split('&');
                if (!subTerms.every(subTerm => verseText.includes(subTerm))) {
                    result = false;
                }
            } else if (term.includes('|')) {
                const subTerms = term.split('|');
                if (!subTerms.some(subTerm => verseText.includes(subTerm))) {
                    result = false;
                }
            } else {
                if (!verseText.includes(term)) {
                    result = false;
                }
            }
        });
        return result;
    }

    const chapters = new Set();
    const matchingChapters = new Set();

    verses.forEach(verse => {
        const chapter = verse.getAttribute('data-chapter');
        const verseText = verse.textContent.toLowerCase();

        if (matchesSearch(verseText, searchTerms)) {
            matchingChapters.add(chapter);
        }
        chapters.add(chapter);
    });

    verses.forEach(verse => {
        const chapter = verse.getAttribute('data-chapter');
        const verseText = verse.textContent.toLowerCase();
        const matches = matchesSearch(verseText, searchTerms);

        if (showChapter) {
            verse.style.display = matchingChapters.has(chapter) ? '' : 'none';
        } else {
            verse.style.display = matches ? '' : 'none';
        }
    });
}
