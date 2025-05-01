import { getCookie } from './utils.js';

// Declare csrfToken at the top of the script
const csrfToken = getCookie('csrftoken');

document.addEventListener('DOMContentLoaded', function () {

    let verse = {};  // Define verse globally

    // Function to fetch and display a random verse
    function fetchRandomVerse() {
        fetch('/fetch/random_verse/')
            .then(response => response.json())
            .then(data => {
                verse = data.random_verse;  // Store the verse data in the global variable

                console.log('Fetched Verse:', verse);  // Log the verse to check the structure

                document.getElementById('verse-text').textContent = verse.verse;

                const referenceEl = document.getElementById('verse-reference');

                // Clear existing content
                referenceEl.innerHTML = '';

                // Create anchor element
                const anchor = document.createElement('a');

                if (verse.verse_number_mask === '') {
                    anchor.textContent = `${verse.book_acronym} ${verse.chapter_mask}`;
                    anchor.href = `/books/${verse.book_id}/${verse.chapter}/${verse.verse_number}/`;
                } else {
                    anchor.textContent = `${verse.book_acronym} ${verse.chapter_mask}:${verse.verse_number_mask}`;
                    anchor.href = `/books/${verse.book_id}/${verse.chapter}/${verse.verse_number}/`;
                }

                referenceEl.appendChild(anchor);


            })
            .catch(error => {
                console.error('Error fetching verse:', error);
                document.getElementById('verse-text').textContent = 'Error loading verse. Please try again.';
            });
    }

    // Fetch a verse when page loads
    fetchRandomVerse();

    document.getElementById('new-verse-btn').addEventListener('click', function (e) {
        fetchRandomVerse();
        e.target.blur(); // Remove focus
    });

    });
