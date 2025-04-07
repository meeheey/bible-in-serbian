import sys
import os

def transform_to_sql(input_file_path, book_id):
    # Read the input file
    with open(input_file_path, 'r') as file:
        lines = file.readlines()

    # Prepare the SQL commands
    sql_commands = []
    current_chapter = None

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Check if the line starts with a chapter number
        if line[0].isdigit() and ' ' in line:
            chapter_part, rest = line.split(' ', 1)
            if chapter_part.isdigit():
                current_chapter = int(chapter_part)
                sql_commands.append(f"({book_id}, {current_chapter}, 0, '{rest}')")
                continue

        # If it's a verse line
        if current_chapter is not None and line[0].isdigit() and '.' in line:
            verse_part, verse_text = line.split('.', 1)
            if verse_part.isdigit():
                verse_number = int(verse_part)
                sql_commands.append(f"({book_id}, {current_chapter}, {current_chapter}, {verse_number},  {verse_number}, '{verse_text.strip()}')")

    # Write the SQL commands to the output file
    output_file_path = os.path.splitext(input_file_path)[0] + '.sql'
    with open(output_file_path, 'w') as file:
        file.write("INSERT INTO verses(book_id, chapter, chapter_mask, verse_number, verse_number_mask, verse)\nVALUES\n")
        file.write(",\n".join(sql_commands) + ";")

    print(f"SQL commands have been written to {output_file_path}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python script.py <input_file_path>")
    else:
        input_file_path = sys.argv[1]
        if os.path.isfile(input_file_path):
            # Ask for the book_id via input
            book_id = input("Enter the book number (book_id): ")
            if book_id.isdigit():
                transform_to_sql(input_file_path, int(book_id))
            else:
                print("Invalid book number. Please enter a valid integer.")
        else:
            print(f"File not found: {input_file_path}")
