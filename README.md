# [svetopismo.me](https://www.svetopismo.me/)

**[svetopismo.me](https://www.svetopismo.me/)** is a nonprofit web application designed to provide an enhanced, searchable digital edition of the Holy Scripture in Serbian Orthodox translations. It offers advanced reading tools such as highlighting, commenting, parallel reading, daily liturgical readings, and a random verse generator.

---

## Table of Contents

- [Features](#features)  
- [Technology Stack](#technology-stack)  
- [Project Structure](#project-structure)  
- [Deployment](#deployment)  
- [Contributing](#contributing)  
- [License](#license)  
- [Contact](#contact)  

---

## Features

- Searchable Holy Scripture books including Deuterocanonical texts  
- User authentication and profiles  
- Highlighting, commenting, bookmarking, and quoting tools  
- Parallel reading of two books with search capabilities  
- Daily readings following Serbian Orthodox liturgical calendar  
- Random verse generator for inspiration  
- RESTful API endpoints serving JSON data for front-end consumption  

---

## Technology Stack

- **Backend:** Python, Django  
- **Database:** SQLite  
- **Frontend:** JavaScript (vanilla JS for interactive features)  
- **Deployment:** Docker, Gunicorn, Nginx  
- **Hosting:** Digital Ocean VPS  
- **Email Services:** Brevo SMTP, Zoho Mail  

---

## Project Structure

The project is split into two main Django apps:

- **web_page:** Handles rendering pages, user authentication, and user interactions.  
- **verse_fetcher:** Provides JSON API endpoints for fetching scripture data, comments, bookmarks, highlights, and other dynamic features.

### URL routing overview:

#### `web_page/urls.py`
- Homepage, login/logout/register  
- Book views, quick search, comparative reading  
- User profile, comments, bookmarks, random verse  
- Password reset flows, email sending, project info  
- Daily liturgical readings

#### `verse_fetcher/urls.py`
- API endpoints for fetching books, comments, bookmarks, highlights  
- Endpoints for saving and deleting user-generated data  
- Random verse fetching and read status toggling  

---

## Deployment

The app is deployed on a Digital Ocean VPS using Docker Compose with the following stack:

- **Gunicorn:** Python WSGI HTTP server serving the Django app  
- **Nginx:** Reverse proxy and static file server  
- **Docker:** Containerization for consistent environment  
- **SMTP:** Brevo SMTP and Zoho Mail for email delivery
  
---

## API Endpoints Summary (verse_fetcher app)

| Endpoint                       | Method | Description                          |
| ------------------------------|--------|------------------------------------|
| `/verse_fetcher/<book_id>/`    | GET    | Fetch book JSON data                |
| `/verse_fetcher/save_comment/` | POST   | Save a user comment                 |
| `/verse_fetcher/<book_id>/comments/` | GET | Fetch comments for a book          |
| `/verse_fetcher/delete_comment/`| POST  | Delete a comment                   |
| `/verse_fetcher/save_bookmark/` | POST  | Save a bookmark                    |
| `/verse_fetcher/delete_bookmark/` | POST | Delete a bookmark                 |
| `/verse_fetcher/<book_id>/bookmarks/` | GET | Fetch bookmarks for a book       |
| `/verse_fetcher/toggle-read-status/` | POST | Toggle read/unread status          |
| `/verse_fetcher/random_verse/` | GET    | Fetch a random verse                |
| `/verse_fetcher/<book_id>/highlights/` | GET | Fetch highlights                   |
| `/verse_fetcher/save_highlight/` | POST | Save a highlight                   |
| `/verse_fetcher/remove_highlight/` | POST | Remove a highlight                 |

---

## Contributing

Contributions are welcome! Please submit bug reports and pull requests on GitHub.  
Make sure to follow the existing code style and write tests for new features.

---

## License

This project is **nonprofit** and intended for educational and scientific use under the terms of MIT license.

---

## Contact

For questions or suggestions, contact:  
[Miloš Mihailović]  
Email: [milosmihailovic@svetopismo.me]  
Website: [www.svetopismo.me](https://www.svetopismo.me)

---

*Thank you for using svetopismo.me!*
