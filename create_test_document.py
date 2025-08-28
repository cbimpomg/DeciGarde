from PIL import Image, ImageDraw, ImageFont
import io
import os

def create_test_document():
    """Create a realistic test document image with clear text"""
    # Create a document-sized image (A4-like proportions)
    width, height = 800, 1100
    img = Image.new('RGB', (width, height), color='white')
    draw = ImageDraw.Draw(img)
    
    # Try to use a larger font for better OCR
    try:
        # Try to use a larger font
        font_large = ImageFont.truetype("arial.ttf", 24)
        font_medium = ImageFont.truetype("arial.ttf", 18)
        font_small = ImageFont.truetype("arial.ttf", 14)
    except:
        try:
            # Fallback to default font
            font_large = ImageFont.load_default()
            font_medium = ImageFont.load_default()
            font_small = ImageFont.load_default()
        except:
            # Last resort - no font
            font_large = None
            font_medium = None
            font_small = None
    
    # Draw document header
    draw.rectangle([(50, 50), (width-50, 120)], outline='black', width=2)
    draw.text((100, 70), "TEST DOCUMENT FOR OCR", fill='black', font=font_large)
    draw.text((100, 100), "DeciGarde OCR Testing", fill='black', font=font_medium)
    
    # Draw main content area
    draw.rectangle([(50, 150), (width-50, height-100)], outline='black', width=1)
    
    # Add sample text content
    y_position = 180
    line_height = 30
    
    content_lines = [
        "This is a test document created specifically for",
        "testing the OCR capabilities of the DeciGarde system.",
        "",
        "The document contains multiple lines of text with",
        "varying content to ensure proper text extraction.",
        "",
        "Sample question: What is the capital of France?",
        "Sample answer: The capital of France is Paris.",
        "",
        "This text should be easily readable by OCR engines",
        "including Tesseract, PaddleOCR, and EasyOCR.",
        "",
        "Additional content for testing:",
        "- Mathematics: 2 + 2 = 4",
        "- Geography: London is in England",
        "- Science: Water is H2O",
        "",
        "End of test document content."
    ]
    
    for line in content_lines:
        if line.startswith("-"):
            # Indent bullet points
            draw.text((80, y_position), line, fill='black', font=font_small)
        elif line == "":
            # Skip empty lines
            pass
        else:
            draw.text((70, y_position), line, fill='black', font=font_small)
        y_position += line_height
    
    # Add footer
    draw.text((70, height-80), "Generated for OCR testing purposes", fill='black', font=font_small)
    draw.text((70, height-60), "Date: August 26, 2025", fill='black', font=font_small)
    
    # Save the image
    output_path = "test_document.png"
    img.save(output_path, format='PNG', quality=95)
    
    print(f"✅ Test document created: {output_path}")
    print(f"📏 Dimensions: {width}x{height} pixels")
    print(f"📁 File size: {os.path.getsize(output_path)} bytes")
    
    return output_path

if __name__ == "__main__":
    create_test_document()
