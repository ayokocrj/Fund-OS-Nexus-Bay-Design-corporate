from pathlib import Path
import fitz

out = Path(".agents/outputs")
out.mkdir(parents=True, exist_ok=True)
for name in ("prd", "deck"):
    doc = fitz.open(f".agents/reference/{name}.pdf")
    print(f"{name}: {len(doc)} pages")
    text = "\n".join(page.get_text() for page in doc)
    (out / f"{name}.txt").write_text(text)
    doc[0].get_pixmap(matrix=fitz.Matrix(1.4, 1.4)).save(str(out / f"{name}-cover.png"))
    print(text[:3500])
