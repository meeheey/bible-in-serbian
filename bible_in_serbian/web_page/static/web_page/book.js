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

    // Get bookId
    const bookId = JSON.parse(document.getElementById('book_id').textContent);

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
});

