import { 
    getCookie,
    fetchVerses,
    filterVerses,
    fetchComments, 
    fetchBookmarks, 
    getSelectedVerse, 
    getTargetDivIdForVerse, 
    refetchVerseAnnotations 
} from './utils.js';

// Declare csrfToken at the top of the script
const csrfToken = getCookie('csrftoken');

document.addEventListener('DOMContentLoaded', function() {

    // Event listeners
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

    // Event listener for search bar
    const searchBar = document.getElementById('searchBar');
    if (searchBar) {
        searchBar.addEventListener('input', function() {
            const searchText = this.value.toLowerCase();
            filterVerses('verses1', searchText);
            filterVerses('verses2', searchText);
        });
    }

    // Event listener for the checkbox
    const showChapterCheckbox = document.getElementById('showChapter');
    if (showChapterCheckbox) {
        showChapterCheckbox.addEventListener('change', function() {
            const searchText = document.getElementById('searchBar').value.toLowerCase();
            filterVerses('verses1', searchText);
            filterVerses('verses2', searchText);
        });
    }

    });

