#!/usr/bin/env python3
"""Genera entregable/reference.docx: estilos de Word para el documento entregable.

Parte de la plantilla por defecto de pandoc y reemplaza fuentes, encabezados, tablas, código,
leyendas de figuras y estilos de portada; agrega tamaño Carta, márgenes y pie de página con número.

    python3 entregable/make-reference.py
"""
import re
import shutil
import subprocess
import tempfile
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "reference.docx"
AZUL = "1F3864"
AZUL2 = "2E5597"

W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'


def run(size, bold=False, italic=False, color=None, font=None):
    s = ""
    if font:
        s += f'<w:rFonts w:ascii="{font}" w:hAnsi="{font}" w:cs="{font}"/>'
    if bold:
        s += "<w:b/><w:bCs/>"
    if italic:
        s += "<w:i/><w:iCs/>"
    if color:
        s += f'<w:color w:val="{color}"/>'
    s += f'<w:sz w:val="{size}"/><w:szCs w:val="{size}"/>'
    return f"<w:rPr>{s}</w:rPr>"


def para_style(sid, name, based, ppr="", rpr="", nxt=None, custom=False, q=True):
    c = ' w:customStyle="1"' if custom else ""
    n = f'<w:next w:val="{nxt}"/>' if nxt else ""
    return (
        f'<w:style w:type="paragraph"{c} w:styleId="{sid}"><w:name w:val="{name}"/>'
        f'<w:basedOn w:val="{based}"/>{n}{"<w:qFormat/>" if q else ""}'
        f"<w:pPr>{ppr}</w:pPr>{rpr}</w:style>"
    )


def heading(n, size, color, before, after, page_break=False):
    ppr = "<w:keepNext/><w:keepLines/>"
    if page_break:
        ppr += "<w:pageBreakBefore/>"
    ppr += f'<w:spacing w:before="{before}" w:after="{after}"/><w:outlineLvl w:val="{n - 1}"/>'
    return (
        f'<w:style w:type="paragraph" w:styleId="Heading{n}"><w:name w:val="heading {n}"/>'
        f'<w:basedOn w:val="Normal"/><w:next w:val="BodyText"/><w:link w:val="Heading{n}Char"/>'
        f'<w:uiPriority w:val="9"/><w:qFormat/><w:pPr>{ppr}</w:pPr>'
        f"{run(size, bold=True, color=color)}</w:style>"
    )


def replace_style(styles, sid, new):
    pat = re.compile(r'<w:style [^>]*w:styleId="%s"[^>]*>.*?</w:style>' % re.escape(sid), re.S)
    if pat.search(styles):
        return pat.sub(lambda _m: new, styles, count=1)
    return styles.replace("</w:styles>", new + "</w:styles>")


def build_styles(s):
    # valores por defecto del documento
    s = re.sub(
        r"<w:docDefaults>.*?</w:docDefaults>",
        '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" '
        'w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="21"/><w:szCs w:val="21"/>'
        '<w:lang w:val="es-ES" w:eastAsia="es-ES" w:bidi="ar-SA"/></w:rPr></w:rPrDefault>'
        '<w:pPrDefault><w:pPr><w:spacing w:after="100" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>',
        s,
        flags=re.S,
    )
    s = replace_style(s, "Heading1", heading(1, 34, AZUL, 0, 240, page_break=True))
    s = replace_style(s, "Heading2", heading(2, 28, AZUL2, 360, 140))
    s = replace_style(s, "Heading3", heading(3, 24, AZUL2, 280, 100))
    s = replace_style(s, "Heading4", heading(4, 22, "404040", 220, 80))
    s = replace_style(s, "Heading5", heading(5, 21, "404040", 160, 60))
    s = replace_style(s, "Heading6", heading(6, 21, "595959", 120, 40))
    s = replace_style(
        s, "BodyText", para_style("BodyText", "Body Text", "Normal", '<w:spacing w:before="60" w:after="100"/><w:jc w:val="both"/>')
    )
    s = replace_style(
        s,
        "Compact",
        para_style("Compact", "Compact", "BodyText", '<w:spacing w:before="20" w:after="20"/><w:jc w:val="left"/>', custom=True),
    )
    s = replace_style(
        s,
        "Caption",
        para_style("Caption", "Caption", "Normal", '<w:spacing w:before="0" w:after="160"/><w:jc w:val="center"/>', run(18, italic=True, color="595959"), q=False),
    )
    s = replace_style(s, "Figure", para_style("Figure", "Figure", "Normal", '<w:jc w:val="center"/>', custom=True, q=False))
    s = replace_style(
        s,
        "CaptionedFigure",
        para_style("CaptionedFigure", "Captioned Figure", "Figure", '<w:keepNext/><w:spacing w:before="120" w:after="40"/>', custom=True, q=False),
    )
    s = replace_style(
        s,
        "SourceCode",
        para_style(
            "SourceCode",
            "Source Code",
            "Normal",
            '<w:keepLines/><w:shd w:val="clear" w:color="auto" w:fill="F4F4F4"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="left"/>',
            run(15, font="Courier New"),
            custom=True,
            q=False,
        ),
    )
    s = replace_style(
        s,
        "VerbatimChar",
        '<w:style w:type="character" w:customStyle="1" w:styleId="VerbatimChar"><w:name w:val="Verbatim Char"/>'
        '<w:basedOn w:val="DefaultParagraphFont"/><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/>'
        '<w:color w:val="7A1F3D"/><w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr></w:style>',
    )
    s = replace_style(
        s,
        "TOCHeading",
        para_style("TOCHeading", "TOC Heading", "Normal", '<w:keepNext/><w:spacing w:before="0" w:after="240"/>', run(34, bold=True, color=AZUL), nxt="BodyText"),
    )
    borde = "".join(
        f'<w:{e} w:val="single" w:sz="4" w:space="0" w:color="A6A6A6"/>' for e in ("top", "left", "bottom", "right", "insideH", "insideV")
    )
    s = replace_style(
        s,
        "Table",
        '<w:style w:type="table" w:default="1" w:styleId="Table"><w:name w:val="Table"/><w:basedOn w:val="TableNormal"/><w:qFormat/>'
        '<w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>'
        '<w:rPr><w:sz w:val="17"/><w:szCs w:val="17"/></w:rPr>'
        f'<w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblBorders>{borde}</w:tblBorders>'
        '<w:tblCellMar><w:top w:w="40" w:type="dxa"/><w:left w:w="80" w:type="dxa"/><w:bottom w:w="40" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr>'
        '<w:tblStylePr w:type="firstRow"><w:rPr><w:b/><w:bCs/><w:color w:val="FFFFFF"/></w:rPr>'
        f'<w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="{AZUL}"/><w:vAlign w:val="center"/></w:tcPr></w:tblStylePr></w:style>',
    )
    s = replace_style(
        s,
        "Hyperlink",
        '<w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/><w:basedOn w:val="DefaultParagraphFont"/>'
        '<w:rPr><w:color w:val="1F5FBF"/><w:u w:val="single"/></w:rPr></w:style>',
    )
    # portada
    portada = [
        ("Portada-Institucion", "Portada-Institucion", '<w:spacing w:before="1200" w:after="120"/><w:jc w:val="center"/>', run(32, bold=True, color=AZUL)),
        ("Portada-Texto", "Portada-Texto", '<w:spacing w:before="60" w:after="60"/><w:jc w:val="center"/>', run(24)),
        ("Portada-Titulo", "Portada-Titulo", '<w:spacing w:before="1400" w:after="200"/><w:jc w:val="center"/>', run(88, bold=True, color=AZUL)),
        ("Portada-Subtitulo", "Portada-Subtitulo", '<w:spacing w:before="0" w:after="200"/><w:ind w:left="720" w:right="720"/><w:jc w:val="center"/>', run(28, italic=True, color="595959")),
    ]
    for sid, name, ppr, rpr in portada:
        s = replace_style(s, sid, para_style(sid, name, "Normal", ppr, rpr, custom=True))
    return s


FOOTER = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr {W}><w:p><w:pPr><w:pBdr><w:top w:val="single" w:sz="4" w:space="4" w:color="A6A6A6"/></w:pBdr>
<w:tabs><w:tab w:val="right" w:pos="9360"/></w:tabs><w:spacing w:after="0"/></w:pPr>
<w:r><w:rPr><w:color w:val="595959"/><w:sz w:val="17"/></w:rPr><w:t xml:space="preserve">Bandada U — Documento de proyecto (ICONIX) · Ingeniería de Software II, Grupo 24</w:t></w:r>
<w:r><w:rPr><w:color w:val="595959"/><w:sz w:val="17"/></w:rPr><w:tab/><w:t xml:space="preserve">Página </w:t></w:r>
<w:r><w:rPr><w:color w:val="595959"/><w:sz w:val="17"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r>
<w:r><w:rPr><w:color w:val="595959"/><w:sz w:val="17"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>
<w:r><w:rPr><w:color w:val="595959"/><w:sz w:val="17"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r>
<w:r><w:rPr><w:color w:val="595959"/><w:sz w:val="17"/></w:rPr><w:t>1</w:t></w:r>
<w:r><w:rPr><w:color w:val="595959"/><w:sz w:val="17"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>"""


def main():
    tmp = Path(tempfile.mkdtemp())
    base = tmp / "default.docx"
    with open(base, "wb") as f:
        subprocess.run(["pandoc", "-o", "/dev/stdout", "--print-default-data-file", "reference.docx"], stdout=f, check=True)
    x = tmp / "x"
    with zipfile.ZipFile(base) as z:
        z.extractall(x)

    st = x / "word/styles.xml"
    st.write_text(build_styles(st.read_text(encoding="utf8")), encoding="utf8")

    (x / "word/footer1.xml").write_text(FOOTER, encoding="utf8")
    ct = x / "[Content_Types].xml"
    ct.write_text(
        ct.read_text(encoding="utf8").replace(
            "</Types>",
            '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>',
        ),
        encoding="utf8",
    )
    rels = x / "word/_rels/document.xml.rels"
    rels.write_text(
        rels.read_text(encoding="utf8").replace(
            "</Relationships>",
            '<Relationship Id="rId90" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>',
        ),
        encoding="utf8",
    )
    doc = x / "word/document.xml"
    d = doc.read_text(encoding="utf8")
    sect = (
        '<w:sectPr><w:footerReference w:type="default" r:id="rId90"/>'
        '<w:footnotePr><w:numRestart w:val="eachSect"/></w:footnotePr>'
        '<w:pgSz w:w="12240" w:h="15840"/>'
        '<w:pgMar w:top="1440" w:right="1440" w:bottom="1300" w:left="1440" w:header="708" w:footer="600" w:gutter="0"/>'
        "<w:titlePg/></w:sectPr>"
    )
    d = re.sub(r"<w:sectPr>.*?</w:sectPr>", sect, d, flags=re.S)
    doc.write_text(d, encoding="utf8")

    if OUT.exists():
        OUT.unlink()
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
        # [Content_Types].xml primero, como pide el formato
        z.write(x / "[Content_Types].xml", "[Content_Types].xml")
        for p in sorted(x.rglob("*")):
            if p.is_file() and p.name != "[Content_Types].xml":
                z.write(p, p.relative_to(x).as_posix())
    shutil.rmtree(tmp)
    print(f"Generado {OUT}")


if __name__ == "__main__":
    main()
