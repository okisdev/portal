import re

def clean_prisma_schema(input_file: str, output_file: str):
    with open(input_file, "r", encoding="utf-8") as infile, open(output_file, "w", encoding="utf-8") as outfile:
        lines = infile.readlines()
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            # Check for the comment pattern indicating dirty data
            if line.startswith("/// This field was commented out") and i + 1 < len(lines):
                next_line = lines[i + 1].strip()
                if next_line.startswith("//"):
                    dirty_entry = next_line[2:].strip()  # Remove leading '//'
                    
                    # Extract the key before the first space
                    parts = dirty_entry.split(" ", 1)
                    if len(parts) > 1:
                        key, rest = parts[0], parts[1]
                        
                        # Replace invalid characters in the key
                        cleaned_key = re.sub(r"[^a-zA-Z0-9_]", "_", key)
                        
                        # Write the cleaned entry to the output file
                        outfile.write(f"{cleaned_key} {rest}\n")
                    else:
                        outfile.write(dirty_entry + "\n")
                    
                    # Skip the next line since it was processed
                    i += 1
                else:
                    outfile.write(line + "\n")
            else:
                outfile.write(line + "\n")
            
            i += 1

# Example usage
clean_prisma_schema("../prisma/schema.prisma.txt", "../prisma/schema.prisma")
