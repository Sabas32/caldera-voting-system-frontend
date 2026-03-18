from __future__ import annotations

import html
import re
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape as xml_escape

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph, Preformatted, SimpleDocTemplate, Spacer


ROOT = Path(__file__).resolve().parent
SOURCES = [
    ROOT / "caldera-company-manual.md",
    ROOT / "caldera-client-guide.md",
]


def parse_markdown_lines(text: str):
    lines = text.splitlines()
    in_code = False
    code_buffer: list[str] = []

    for raw in lines:
        line = raw.rstrip("\n")

        if line.strip().startswith("```"):
            if in_code:
                yield ("code", "\n".join(code_buffer))
                code_buffer = []
                in_code = False
            else:
                in_code = True
            continue

        if in_code:
            code_buffer.append(line)
            continue

        if not line.strip():
            yield ("blank", "")
            continue

        heading_match = re.match(r"^(#{1,6})\s+(.*)$", line)
        if heading_match:
            level = len(heading_match.group(1))
            text_value = heading_match.group(2).strip()
            yield (f"h{level}", text_value)
            continue

        if re.match(r"^[-*]\s+", line):
            yield ("bullet", re.sub(r"^[-*]\s+", "", line).strip())
            continue

        if re.match(r"^\d+\.\s+", line):
            yield ("number", line.strip())
            continue

        yield ("p", line)

    if in_code and code_buffer:
        yield ("code", "\n".join(code_buffer))


def build_docx(md_path: Path, docx_path: Path):
    content = md_path.read_text(encoding="utf-8")

    paragraphs: list[str] = []

    for kind, value in parse_markdown_lines(content):
        if kind == "blank":
            paragraphs.append("<w:p/>")
            continue

        text_value = value
        bold = False

        if kind.startswith("h"):
            bold = True
        elif kind == "bullet":
            text_value = f"- {text_value}"
        elif kind == "number":
            text_value = text_value
        elif kind == "code":
            for code_line in text_value.splitlines() or [""]:
                escaped = xml_escape(code_line)
                paragraphs.append(
                    "<w:p><w:r><w:rPr><w:rFonts w:ascii=\"Courier New\" w:hAnsi=\"Courier New\"/></w:rPr>"
                    f"<w:t xml:space=\"preserve\">{escaped}</w:t></w:r></w:p>"
                )
            paragraphs.append("<w:p/>")
            continue

        escaped_text = xml_escape(text_value)
        rpr = "<w:rPr><w:b/></w:rPr>" if bold else ""
        paragraphs.append(
            f"<w:p><w:r>{rpr}<w:t xml:space=\"preserve\">{escaped_text}</w:t></w:r></w:p>"
        )

    document_xml = (
        "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>"
        "<w:document xmlns:wpc=\"http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas\" "
        "xmlns:mc=\"http://schemas.openxmlformats.org/markup-compatibility/2006\" "
        "xmlns:o=\"urn:schemas-microsoft-com:office:office\" "
        "xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\" "
        "xmlns:m=\"http://schemas.openxmlformats.org/officeDocument/2006/math\" "
        "xmlns:v=\"urn:schemas-microsoft-com:vml\" "
        "xmlns:wp14=\"http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing\" "
        "xmlns:wp=\"http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing\" "
        "xmlns:w10=\"urn:schemas-microsoft-com:office:word\" "
        "xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\" "
        "xmlns:w14=\"http://schemas.microsoft.com/office/word/2010/wordml\" "
        "xmlns:wpg=\"http://schemas.microsoft.com/office/word/2010/wordprocessingGroup\" "
        "xmlns:wpi=\"http://schemas.microsoft.com/office/word/2010/wordprocessingInk\" "
        "xmlns:wne=\"http://schemas.microsoft.com/office/2006/wordml\" "
        "xmlns:wps=\"http://schemas.microsoft.com/office/word/2010/wordprocessingShape\" "
        "mc:Ignorable=\"w14 wp14\">"
        "<w:body>"
        + "".join(paragraphs)
        + "<w:sectPr><w:pgSz w:w=\"12240\" w:h=\"15840\"/>"
        "<w:pgMar w:top=\"1440\" w:right=\"1440\" w:bottom=\"1440\" w:left=\"1440\" w:header=\"708\" w:footer=\"708\" w:gutter=\"0\"/>"
        "<w:cols w:space=\"708\"/><w:docGrid w:linePitch=\"360\"/></w:sectPr>"
        "</w:body></w:document>"
    )

    content_types = (
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
        "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">"
        "<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>"
        "<Default Extension=\"xml\" ContentType=\"application/xml\"/>"
        "<Override PartName=\"/word/document.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml\"/>"
        "</Types>"
    )

    rels = (
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
        "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">"
        "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"word/document.xml\"/>"
        "</Relationships>"
    )

    with zipfile.ZipFile(docx_path, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", content_types)
        zf.writestr("_rels/.rels", rels)
        zf.writestr("word/document.xml", document_xml)


def build_pdf(md_path: Path, pdf_path: Path):
    text = md_path.read_text(encoding="utf-8")

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=LETTER,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
        title=md_path.stem,
    )

    styles = getSampleStyleSheet()
    body = ParagraphStyle("ManualBody", parent=styles["BodyText"], fontName="Helvetica", fontSize=10, leading=14, spaceAfter=6)
    bullet = ParagraphStyle("ManualBullet", parent=body, leftIndent=14)
    h1 = ParagraphStyle("ManualH1", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=18, leading=22, spaceBefore=8, spaceAfter=8)
    h2 = ParagraphStyle("ManualH2", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=14, leading=18, spaceBefore=8, spaceAfter=6)
    h3 = ParagraphStyle("ManualH3", parent=styles["Heading3"], fontName="Helvetica-Bold", fontSize=12, leading=16, spaceBefore=6, spaceAfter=4)
    h4 = ParagraphStyle("ManualH4", parent=styles["Heading4"], fontName="Helvetica-Bold", fontSize=11, leading=14, spaceBefore=6, spaceAfter=4)
    code_style = ParagraphStyle("ManualCode", parent=body, fontName="Courier", fontSize=9, leading=12, leftIndent=12)

    story = []

    for kind, value in parse_markdown_lines(text):
        if kind == "blank":
            story.append(Spacer(1, 4))
            continue
        if kind == "code":
            story.append(Preformatted(value, code_style))
            story.append(Spacer(1, 4))
            continue

        escaped = html.escape(value)
        if kind == "h1":
            story.append(Paragraph(escaped, h1))
        elif kind == "h2":
            story.append(Paragraph(escaped, h2))
        elif kind == "h3":
            story.append(Paragraph(escaped, h3))
        elif kind.startswith("h"):
            story.append(Paragraph(escaped, h4))
        elif kind == "bullet":
            story.append(Paragraph(f"&bull; {escaped}", bullet))
        elif kind == "number":
            story.append(Paragraph(escaped, body))
        else:
            story.append(Paragraph(escaped, body))

    doc.build(story)


def main():
    for src in SOURCES:
        if not src.exists():
            raise FileNotFoundError(f"Missing source markdown: {src}")

        docx_path = src.with_suffix(".docx")
        pdf_path = src.with_suffix(".pdf")

        build_docx(src, docx_path)
        build_pdf(src, pdf_path)

        print(f"Generated: {docx_path.name}")
        print(f"Generated: {pdf_path.name}")


if __name__ == "__main__":
    main()
