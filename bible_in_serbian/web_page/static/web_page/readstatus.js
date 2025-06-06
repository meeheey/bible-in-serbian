import { 
    getCookie
} from './utils.js';


document.addEventListener('DOMContentLoaded', function() {
    // Add click event to all book buttons
    document.querySelectorAll('.book-btn').forEach(button => {
        button.addEventListener('click', async function() {
            const bookCard = this.closest('.book-card');
            const bookId = bookCard.dataset.bookId;
            
            try {
                const response = await fetch('/fetch/toggle-read-status/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-CSRFToken': getCookie('csrftoken'),  // CSRF token handling
                    },
                    body: `book_id=${bookId}`
                });
                
                const data = await response.json();
                
                if (data.status === 'success') {
                    // Toggle the visual state
                    if (data.is_read) {
                        this.classList.add('read');
                        this.classList.remove('unread');
                    } else {
                        this.classList.add('unread');
                        this.classList.remove('read');
                    }
                } else {
                    console.error('Error:', data.message);
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });
    });
});