import pdfplumber
from docx import Document


def extract_text_from_pdf(file_path: str) -> str:
    text = ""

    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"PDF extraction error: {e}")

    return text


def extract_text_from_docx(file_path: str) -> str:
    text = ""

    try:
        document = Document(file_path)
        for paragraph in document.paragraphs:
            text += paragraph.text + "\n"
    except Exception as e:
        print(f"DOCX extraction error: {e}")

    return text


def extract_text_from_txt(file_path: str) -> str:
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            return file.read()
    except Exception:
        with open(file_path, "r", encoding="latin-1") as file:
            return file.read()


def extract_resume_text(file_path: str) -> str:
    file_path_lower = file_path.lower()

    if file_path_lower.endswith(".pdf"):
        return extract_text_from_pdf(file_path)

    elif file_path_lower.endswith(".docx"):
        return extract_text_from_docx(file_path)

    elif file_path_lower.endswith(".txt"):
        return extract_text_from_txt(file_path)

    else:
        return ""