import { getCookie } from './utils.js';

// Declare csrfToken at the top of the script
const csrfToken = getCookie('csrftoken');

document.addEventListener('DOMContentLoaded', function () {

    let verse = {};  // Define verse globally
    let isBookmarked = false;  // Initialize as a boolean

    // Function to fetch and display a random verse
    function fetchRandomVerse() {
        fetch('/fetch/random_verse/')  // Update this URL to match your URL pattern
            .then(response => response.json())
            .then(data => {
                verse = data.random_verse;  // Store the verse data in the global variable
                isBookmarked = verse.is_bookmarked;  // Update the bookmark status
                changeButton();  // Call the function to update the button

                console.log('Fetched Verse:', verse);  // Log the verse to check the structure

                document.getElementById('verse-text').textContent = verse.verse;

                if (verse.verse_number_mask === '') {
                    document.getElementById('verse-reference').textContent = `${verse.book_acronym} ${verse.chapter}`;
                } else {
                    document.getElementById('verse-reference').textContent = `${verse.book_acronym} ${verse.chapter}:${verse.verse_number}`;
                }

                // Enable the Save Bookmark button once the verse is fetched
                document.getElementById('save-or-remove-bookmark-btn').disabled = false;
            })
            .catch(error => {
                console.error('Error fetching verse:', error);
                document.getElementById('verse-text').textContent = 'Error loading verse. Please try again.';
            });
    }

    // Function to save a bookmark
    function saveBookmark() {
        const data = {
            book_id: verse.book_id,  // Use the correct book_id
            chapter: verse.chapter,
            verse_number: verse.verse_number,
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
            book_id: verse.book_id,
            chapter: verse.chapter,
            verse_number: verse.verse_number,
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
                buttonElement.innerHTML = `<i class='fa fa-bookmark'></i>`;
            } else {
                // If the verse is not bookmarked, show the empty bookmark icon
                buttonElement.innerHTML = `<i class='far fa-bookmark'></i>`;
            }
        }
    }

    // Fetch a verse when page loads
    fetchRandomVerse();

    // Change button initially based on the first fetched verse
    changeButton();

    document.getElementById('new-verse-btn').addEventListener('click', function (e) {
        fetchRandomVerse();
        e.target.blur(); // Remove focus
    });

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
