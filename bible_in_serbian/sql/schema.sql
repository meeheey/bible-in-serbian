CREATE TABLE books(
    id INTEGER NOT NULL,
    acronym TEXT NOT NULL,
    title TEXT NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE verses(
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    verse_number INTEGER NOT NULL,
    verse TEXT,
    FOREIGN KEY (book_id) REFERENCES books(id)
);
