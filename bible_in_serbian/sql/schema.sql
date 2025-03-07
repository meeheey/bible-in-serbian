CREATE TABLE books(
    id INTEGER NOT NULL PRIMARY KEY,
    acronym TEXT NOT NULL,
    title TEXT NOT NULL
);

CREATE TABLE verses(
    id INTEGER NOT NULL PRIMARY KEY,
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    verse_number INTEGER NOT NULL,
    verse TEXT,
    FOREIGN KEY (book_id) REFERENCES books(id)
);