import sys
import os
import re

def clean_text(text):
    """Remove special characters, footnotes, square brackets, and уп. references."""
    # Remove * and † symbols
    text = re.sub(r'[\*†]', '', text)
    # Remove square brackets with уп. references
    text = re.sub(r'\(уп\..*?\)', '', text)
    # Remove other square brackets and their content
    text = re.sub(r'\[.*?\]', '', text)
    # Clean up any resulting double spaces or trailing/leading spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def transform_to_sql(input_file_path, book_id):
    with open(input_file_path, 'r', encoding='utf-8') as file:
        lines = [line.strip() for line in file.readlines() if line.strip()]

    sql_commands = []
    current_chapter = 0
    i = 0
    total_lines = len(lines)

    while i < total_lines:
        line = lines[i]
        line = clean_text(line)

        # Check if this could be a title by looking at next line
        if i + 1 < total_lines:
            next_line = lines[i + 1]
            next_line = clean_text(next_line)
            
            # If current line starts with number and next line starts with "1.", 
            # then current line is a title
            if (re.match(r'^\d+\.', line) and 
                re.match(r'^1\.', next_line)):
                # Extract chapter number and title
                chapter_num, title = line.split('.', 1)
                chapter_num = chapter_num.strip()
                title = title.strip()
                
                if chapter_num.isdigit():
                    current_chapter = int(chapter_num)
                    sql_commands.append(f"({book_id}, {current_chapter}, 0, '{title}')")
                    i += 1
                    continue

        # Process regular verses
        if current_chapter > 0 and re.match(r'^\d+\.', line):
            verse_num, verse_text = line.split('.', 1)
            verse_num = verse_num.strip()
            verse_text = verse_text.strip()
            
            if verse_num.isdigit():
                verse_num = int(verse_num)
                sql_commands.append(f"({book_id}, {current_chapter}, {verse_num}, '{verse_text}')")
        
        i += 1

    output_file_path = os.path.splitext(input_file_path)[0] + '.sql'
    with open(output_file_path, 'w', encoding='utf-8') as file:
        file.write("INSERT INTO verses(book_id, chapter, verse_number, verse)\nVALUES\n")
        file.write(",\n".join(sql_commands) + ";")

    print(f"SQL commands have been written to {output_file_path}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python script.py <input_file_path>")
    else:
        input_file_path = sys.argv[1]
        if os.path.isfile(input_file_path):
            book_id = input("Enter the book number (book_id): ")
            if book_id.isdigit():
                transform_to_sql(input_file_path, int(book_id))
            else:
                print("Invalid book number. Please enter a valid integer.")
        else:
            print(f"File not found: {input_file_path}")
