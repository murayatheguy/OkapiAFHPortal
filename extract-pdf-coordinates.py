#!/usr/bin/env python3
"""
Extract all text positions from DSHS NCP PDF to create coordinate mapping.
Outputs a complete map of where every label is, so we know where to place data.
"""

import json
import sys

try:
    import pdfplumber
except ImportError:
    print("Installing pdfplumber...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber", "-q"])
    import pdfplumber

def extract_coordinates(pdf_path):
    """Extract all text elements with their coordinates from each page."""

    all_pages = []

    with pdfplumber.open(pdf_path) as pdf:
        print(f"PDF has {len(pdf.pages)} pages")
        print(f"Page size: {pdf.pages[0].width} x {pdf.pages[0].height} points")
        print("-" * 80)

        for page_num, page in enumerate(pdf.pages):
            page_data = {
                "page": page_num,
                "width": float(page.width),
                "height": float(page.height),
                "elements": []
            }

            # Extract all text with positions
            chars = page.chars
            words = page.extract_words(
                keep_blank_chars=True,
                x_tolerance=3,
                y_tolerance=3
            )

            for word in words:
                element = {
                    "text": word["text"],
                    "x0": round(word["x0"], 1),  # Left edge
                    "x1": round(word["x1"], 1),  # Right edge
                    "top": round(word["top"], 1),  # Top edge (from top of page)
                    "bottom": round(word["bottom"], 1),  # Bottom edge
                    # Convert to pdf-lib coordinates (origin at bottom-left)
                    "pdf_lib_x": round(word["x0"], 1),
                    "pdf_lib_y": round(page.height - word["bottom"], 1)
                }
                page_data["elements"].append(element)

            # Also extract lines/rectangles (table borders)
            lines = page.lines
            rects = page.rects

            page_data["lines_count"] = len(lines)
            page_data["rects_count"] = len(rects)

            # Find table cells by looking at rectangles
            tables = page.find_tables()
            page_data["tables_count"] = len(tables)

            all_pages.append(page_data)

            # Print summary for this page
            print(f"\nPAGE {page_num + 1}:")
            print(f"  Text elements: {len(words)}")
            print(f"  Tables found: {len(tables)}")

    return all_pages

def find_field_positions(pages_data):
    """
    Analyze the extracted data to find form field positions.
    Returns a mapping of field labels to their data entry coordinates.
    """

    field_mapping = {}

    # Key labels we're looking for and their expected data positions
    labels_to_find = [
        # Page 1 - Resident Info
        ("Provider's Name:", "providerName"),
        ("Date NCP Started:", "ncpStartDate"),
        ("Moved In Date:", "movedInDate"),
        ("Date Completed:", "dateCompleted"),
        ("Date Discharged:", "dateDischarged"),
        ("Resident's Name:", "residentName"),
        ("Pronouns:", "pronouns"),
        ("Date of Birth/Age:", "dateOfBirth"),
        ("Primary Language:", "primaryLanguage"),
        ("Speaks English?", "speaksEnglish"),
        ("Interpreter needed?", "interpreterNeeded"),
        ("ALLERGIES:", "allergies"),
        ("Legal Documents:", "legalDocuments"),
        ("Specialty Needs:", "specialtyNeeds"),
        # Emergency Evacuation
        ("EVACUATION ASSISTANCE REQUIRED:", "evacuationSection"),
        ("RESIDENT'S EVACUATION and SAFETY INSTRUCTIONS:", "evacuationInstructions"),
        # And many more...
    ]

    for page_data in pages_data:
        page_num = page_data["page"]

        for element in page_data["elements"]:
            text = element["text"]

            for label, field_name in labels_to_find:
                if label.lower() in text.lower():
                    # Found a label! The data field is typically:
                    # - To the right of the label (same row)
                    # - Or below the label (next row)

                    field_mapping[field_name] = {
                        "page": page_num,
                        "label_text": text,
                        "label_x": element["pdf_lib_x"],
                        "label_y": element["pdf_lib_y"],
                        # Data position estimate (to the right of label)
                        "data_x": element["x1"] + 5,  # 5 points after label ends
                        "data_y": element["pdf_lib_y"],
                        "page_height": page_data["height"]
                    }

    return field_mapping

def generate_typescript_mapping(pages_data, field_mapping):
    """Generate TypeScript code for ncp-pdf.ts with correct coordinates."""

    ts_code = []
    ts_code.append("// Auto-generated NCP PDF coordinate mapping")
    ts_code.append("// Generated from DSHS NCP template analysis")
    ts_code.append("")
    ts_code.append("// Page dimensions (Letter size)")

    if pages_data:
        ts_code.append(f"const PAGE_WIDTH = {pages_data[0]['width']};")
        ts_code.append(f"const PAGE_HEIGHT = {pages_data[0]['height']};")

    ts_code.append("")
    ts_code.append("// Field coordinates (x, y from bottom-left origin)")
    ts_code.append("const NCP_FIELD_COORDS = {")

    for field_name, coords in field_mapping.items():
        ts_code.append(f"  {field_name}: {{ page: {coords['page']}, x: {coords['data_x']}, y: {coords['data_y']} }},")

    ts_code.append("};")

    return "\n".join(ts_code)

def print_page_analysis(pages_data):
    """Print detailed analysis of each page for manual coordinate verification."""

    for page_data in pages_data:
        page_num = page_data["page"]
        height = page_data["height"]

        print(f"\n{'='*80}")
        print(f"PAGE {page_num + 1} DETAILED ANALYSIS")
        print(f"Page size: {page_data['width']} x {height} points")
        print(f"{'='*80}")

        # Group elements by approximate Y position (rows)
        rows = {}
        for elem in page_data["elements"]:
            # Round Y to nearest 10 to group into rows
            row_y = round(elem["pdf_lib_y"] / 10) * 10
            if row_y not in rows:
                rows[row_y] = []
            rows[row_y].append(elem)

        # Print rows from top to bottom (highest Y first)
        for row_y in sorted(rows.keys(), reverse=True):
            elements = sorted(rows[row_y], key=lambda e: e["x0"])
            row_text = " | ".join([f"{e['text'][:30]}" for e in elements[:5]])
            print(f"Y={row_y:>4}: {row_text}")


if __name__ == "__main__":
    # Path to the DSHS NCP PDF template
    pdf_path = "public/forms/templates/AFH HCS NCP-Template 10.11.23 (1).pdf"

    print("Extracting coordinates from DSHS NCP PDF...")
    print("=" * 80)

    # Extract all coordinates
    pages_data = extract_coordinates(pdf_path)

    # Save raw data to JSON for reference
    with open("ncp-pdf-coordinates.json", "w") as f:
        json.dump(pages_data, f, indent=2)
    print(f"\nRaw coordinate data saved to: ncp-pdf-coordinates.json")

    # Find field positions
    field_mapping = find_field_positions(pages_data)

    # Save field mapping
    with open("ncp-field-mapping.json", "w") as f:
        json.dump(field_mapping, f, indent=2)
    print(f"Field mapping saved to: ncp-field-mapping.json")

    # Generate TypeScript code
    ts_code = generate_typescript_mapping(pages_data, field_mapping)
    with open("ncp-coordinates.ts", "w") as f:
        f.write(ts_code)
    print(f"TypeScript mapping saved to: ncp-coordinates.ts")

    # Print detailed page analysis
    print_page_analysis(pages_data)

    print("\n" + "=" * 80)
    print("COORDINATE EXTRACTION COMPLETE")
    print("=" * 80)
    print("\nNext steps:")
    print("1. Review ncp-pdf-coordinates.json for all text positions")
    print("2. Review ncp-field-mapping.json for field locations")
    print("3. Use coordinates to update client/src/lib/forms/ncp-pdf.ts")
