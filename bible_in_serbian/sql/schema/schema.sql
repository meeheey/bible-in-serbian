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

-- For INSERT: Only sets masks if they're NULL (keeps empty strings)
CREATE TRIGGER fill_masks_on_insert
BEFORE INSERT ON verses
FOR EACH ROW
WHEN (NEW.chapter_mask IS NULL OR NEW.verse_number_mask IS NULL)
BEGIN
    UPDATE verses
    SET
        chapter_mask = CASE 
            WHEN NEW.chapter_mask IS NULL THEN CAST(NEW.chapter AS TEXT)
            ELSE NEW.chapter_mask  -- Leaves empty strings untouched
        END,
        verse_number_mask = CASE 
            WHEN NEW.verse_number_mask IS NULL THEN CAST(NEW.verse_number AS TEXT)
            ELSE NEW.verse_number_mask  -- Leaves empty strings untouched
        END
    WHERE rowid = NEW.rowid;
END;

-- For UPDATE: Only updates masks if chapter/verse_number changes AND masks are NULL
CREATE TRIGGER fill_masks_on_update
BEFORE UPDATE ON verses
FOR EACH ROW
WHEN (NEW.chapter != OLD.chapter OR NEW.verse_number != OLD.verse_number) AND
     (NEW.chapter_mask IS NULL OR NEW.verse_number_mask IS NULL)
BEGIN
    UPDATE verses
    SET
        chapter_mask = CASE 
            WHEN NEW.chapter_mask IS NULL THEN CAST(NEW.chapter AS TEXT)
            ELSE NEW.chapter_mask  -- Leaves empty strings untouched
        END,
        verse_number_mask = CASE 
            WHEN NEW.verse_number_mask IS NULL THEN CAST(NEW.verse_number AS TEXT)
            ELSE NEW.verse_number_mask  -- Leaves empty strings untouched
        END
    WHERE rowid = NEW.rowid;
END;

