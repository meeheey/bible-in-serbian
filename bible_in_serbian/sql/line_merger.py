def process_file(input_file, output_file):
    with open(input_file, 'r') as f:
        lines = f.readlines()

    processed_lines = []
    for line in lines:
        line = line.strip()
        if not line:
            continue  # skip empty lines
        if line[0].isdigit():
            processed_lines.append(line)
        else:
            if processed_lines:
                processed_lines[-1] += ' ' + line

    with open(output_file, 'w') as f:
        for line in processed_lines:
            f.write(line + '\n')

def main():
    input_file = input("File to clean: ")
    output_file = input("New file name: ")
    process_file(input_file, output_file)

main()

