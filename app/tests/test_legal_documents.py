"""Los documentos legales deben estar completos: listos para firmar y para vender.

Regresión real: el CLA y la licencia comercial tenían huecos entre corchetes
(`[UMBRAL €/AÑO]`, `[PRECIOS]`, `[PLAZO DE SUBSANACIÓN]`, `[PAÍS/JURISDICCIÓN]`).
El CLA es justo lo que firma quien contribuye, así que un documento con corchetes
ni permite aceptar pull requests ni permite cobrar la licencia comercial.
"""
import re
import unittest
from pathlib import Path

from server.config import BASE_DIR

ROOT = Path(BASE_DIR).parent
LEGAL = (
    "LICENSE-COMMERCIAL.md", "LICENSE-COMMERCIAL.en.md",
    ".github/CLA.md", ".github/CLA.en.md",
    "TRADEMARK.md", "TRADEMARK.en.md",
    "NOTICE.md", "NOTICE.en.md",
)
# Huecos tipo [UMBRAL €/AÑO]: todo en mayúsculas/dígitos y sin minúsculas, para no
# confundirlos con enlaces markdown ([English], [Español], [GNU AGPL v3.0…]).
PLACEHOLDER = re.compile(r"\[[A-ZÁÉÍÓÚÑ0-9 €/.\-]{3,}\]")
SIGNATURE = "I have read the CLA Document and I hereby sign the CLA"


class TestLegalDocuments(unittest.TestCase):
    def test_1_no_quedan_huecos_pendientes(self):
        pendientes = []
        for name in LEGAL:
            path = ROOT / name
            self.assertTrue(path.is_file(), f"falta {name}")
            for i, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
                for match in PLACEHOLDER.findall(line):
                    if "](" in line:  # enlace markdown
                        continue
                    if match == "[...]":  # convención citada en los propios avisos
                        continue
                    pendientes.append(f"{name}:{i} {match}")
        self.assertEqual(pendientes, [], f"huecos legales pendientes: {pendientes}")

    def test_2_la_licencia_comercial_es_cobrable(self):
        es = (ROOT / "LICENSE-COMMERCIAL.md").read_text(encoding="utf-8")
        en = (ROOT / "LICENSE-COMMERCIAL.en.md").read_text(encoding="utf-8")
        self.assertIn("80.000 €", es, "falta el umbral de facturación anual (ES)")
        self.assertIn("€80,000", en, "missing annual revenue threshold (EN)")
        self.assertIn("a consultar", es, "falta la referencia de precios (ES)")
        self.assertIn("upon request", en, "missing pricing reference (EN)")
        for name, txt in (("ES", es), ("EN", en)):
            self.assertIn("admin@andorina.dev", txt, f"falta el contacto comercial ({name})")
            self.assertIn("30", txt, f"falta el plazo de subsanación ({name})")

    def test_3_jurisdiccion_definida(self):
        for name in ("LICENSE-COMMERCIAL.md", "LICENSE-COMMERCIAL.en.md", ".github/CLA.md", ".github/CLA.en.md"):
            txt = (ROOT / name).read_text(encoding="utf-8")
            self.assertIn("A Coruña", txt, f"{name}: falta la jurisdicción")

    def test_4_el_bot_acepta_la_misma_frase_que_firma_el_cla(self):
        cla = (ROOT / ".github" / "CLA.md").read_text(encoding="utf-8")
        self.assertIn(SIGNATURE, cla, "el CLA no incluye la frase exacta de firma")
        workflow = (ROOT / ".github" / "workflows" / "cla.yml").read_text(encoding="utf-8")
        self.assertIn(SIGNATURE, workflow, "el bot no acepta la misma frase que el CLA")
        self.assertIn(".github/CLA.md", workflow, "el bot no apunta al CLA del repositorio")
        self.assertIn("cla-signatures", workflow, "el bot no guarda las firmas en su rama")

    def test_5_el_cla_esta_enlazado_en_plantillas_y_guias(self):
        for name in (".github/CONTRIBUTING.md", ".github/CONTRIBUTING.en.md",
                     ".github/PULL_REQUEST_TEMPLATE.md"):
            txt = (ROOT / name).read_text(encoding="utf-8")
            self.assertIn("CLA", txt, f"{name}: no menciona el CLA")


if __name__ == "__main__":
    unittest.main(verbosity=2)
