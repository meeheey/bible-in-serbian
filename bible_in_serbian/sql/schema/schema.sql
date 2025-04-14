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
    verse TEXT, chapter_mask VARCHAR(50),
    verse_number_mask VARCHAR(50),
    FOREIGN KEY (book_id) REFERENCES books(id)
);

CREATE VIEW verses_view AS
SELECT * FROM verses;

CREATE TRIGGER verses_view_insert
INSTEAD OF INSERT ON verses_view
FOR EACH ROW
BEGIN
    INSERT INTO verses (book_id, chapter, verse_number, verse,
                        chapter_mask, verse_number_mask)
    VALUES (
        NEW.book_id,
        NEW.chapter,
        NEW.verse_number,
        NEW.verse,
        COALESCE(NEW.chapter_mask, CAST(NEW.chapter AS TEXT)),
        COALESCE(NEW.verse_number_mask, CAST(NEW.verse_number AS TEXT))
    );
END;

CREATE TRIGGER verses_view_update
INSTEAD OF UPDATE ON verses_view
FOR EACH ROW
BEGIN
    UPDATE verses
    SET
        book_id = NEW.book_id,
        chapter = NEW.chapter,
        verse_number = NEW.verse_number,
        verse = NEW.verse,
        chapter_mask = COALESCE(
            NEW.chapter_mask,
            CASE WHEN NEW.chapter != OLD.chapter THEN CAST(NEW.chapter AS TEXT) ELSE OLD.chapter_mask END
        ),
        verse_number_mask = COALESCE(
            NEW.verse_number_mask,
            CASE WHEN NEW.verse_number != OLD.verse_number THEN CAST(NEW.verse_number AS TEXT) ELSE OLD.verse_number_mask END
        )
    WHERE id = OLD.id;
END;

