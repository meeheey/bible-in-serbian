import { getCookie } from './utils.js';

// Declare csrfToken at the top of the script
const csrfToken = getCookie('csrftoken');

document.addEventListener('DOMContentLoaded', function () {

    let verse = {};  // Define verse globally
    let bookId = JSON.parse(document.getElementById('book_id').textContent);
    let chapter = JSON.parse(document.getElementById('chapter').textContent);
    let verseNumber = JSON.parse(document.getElementById('verse_number').textContent);
    let isBookmarked = JSON.parse(document.getElementById('is_bookmarked').textContent);

    // Function to save a bookmark
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
        .then((response) => response.json())
        .then((data) => {
            if (data.status === 'success') {
                alert('Обележивач је успешно сачуван.');
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
        .then((response) => response.json())
        .then((data) => {
            if (data.status === 'success') {
                alert('Обележивач је успешно уклоњен.');
            } else {
                alert(`Грешка: ${data.message}`);
            }
        })
        .catch((error) => {
            console.error('Грешка:', error);
            alert('Дошло је до грешке приликом уклањања обележивача.');
        });
    }

    // Function to update the button based on bookmark status
    function changeButton() {
        const buttonElement = document.getElementById('save-or-remove-bookmark-btn');  // Get the button element by ID
        if (buttonElement) {
            if (isBookmarked) {
                // If the verse is bookmarked, show the filled bookmark icon
                buttonElement.innerHTML = `<i class='fas fa-bookmark'></i>`;
            } else {
                // If the verse is not bookmarked, show the empty bookmark icon
                buttonElement.innerHTML = `<i class='far fa-bookmark'></i>`;
            }
        }
    }

    // Change button initially based on the first fetched verse
    changeButton();

    // Add event listener to handle bookmark button click
    document.getElementById('save-or-remove-bookmark-btn').addEventListener('click', function (e) {
        if (isBookmarked) {
            removeBookmark();  // Remove bookmark if already bookmarked
        } else {
            saveBookmark();  // Save bookmark if not bookmarked
        }
        
        // Toggle the bookmark status
        isBookmarked = !isBookmarked;

        // After updating the bookmark, update the button's appearance
        changeButton();

        e.target.blur(); // Remove focus
    });
});
