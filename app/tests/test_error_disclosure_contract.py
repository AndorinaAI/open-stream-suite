"""Regresión de V3-05: las respuestas 500 no filtran detalles internos.

Antes varias rutas devolvían `str(e)` en un 500 (y en los webhooks públicos el
mensaje es visible fuera de la máquina), filtrando trazas de aiohttp/Twitch y
rutas de disco. Toda respuesta 500 debe llevar un mensaje genérico y registrar el
detalle solo en el log.
"""
import ast
import unittest
from pathlib import Path

from server.config import BASE_DIR

ROUTES = BASE_DIR / "server" / "routes"
LEAK_PATTERNS = ("str(e)", 'f"Error: {e}"', "f'Error: {e}'")


class TestNoErrorDisclosure(unittest.TestCase):
    def test_no_route_leaks_the_exception_in_a_500(self):
        offenders = []
        for path in sorted(ROUTES.glob("*.py")):
            for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
                if "status=500" not in line:
                    continue
                if any(pattern in line for pattern in LEAK_PATTERNS):
                    offenders.append(f"{path.name}:{number}: {line.strip()}")
        self.assertEqual(
            offenders, [],
            "respuestas 500 que filtran el error interno:\n  " + "\n  ".join(offenders),
        )

    def test_error_helper_module_is_used(self):
        helper = ROUTES / "errors.py"
        self.assertTrue(helper.exists(), "falta server/routes/errors.py")
        source = helper.read_text(encoding="utf-8")
        for needle in ("INTERNAL_ERROR_MESSAGE", "INVALID_JSON_MESSAGE", "logger.exception"):
            self.assertIn(needle, source)
        for name in ("fusions_routes.py", "rewards_routes.py", "webhooks_routes.py", "themes_routes.py"):
            self.assertIn(
                "internal_error", (ROUTES / name).read_text(encoding="utf-8"),
                f"{name} no usa el helper de errores",
            )

    def test_request_json_is_guarded_with_a_400(self):
        """Un cuerpo inválido nunca debe acabar en 500.

        Sobre el AST (sin falsos positivos de comentarios) se aceptan los
        patrones tolerantes legítimos (fallback a query params, `except: pass`,
        valor por defecto) y el 400 explícito; el invariante prohibido es que la
        lectura del JSON esté sin proteger o que su `try` acabe en 500.
        """
        offenders = []
        for path in sorted(ROUTES.glob("*.py")):
            tree = ast.parse(path.read_text(encoding="utf-8"))
            for call, guards in _json_calls_with_guards(tree):
                if not guards:
                    offenders.append(f"{path.name}:{call.lineno} (lectura sin try)")
                    continue
                returns_400 = any(_handler_returns(handler, 400) for handler in guards)
                returns_500 = any(_handler_returns(handler, 500) for handler in guards)
                if returns_500 and not returns_400:
                    offenders.append(f"{path.name}:{call.lineno} (un cuerpo inválido acabaría en 500)")
        self.assertEqual(
            offenders, [],
            "lecturas de JSON que responderían 500 ante un cuerpo inválido:\n  " + "\n  ".join(offenders),
        )


def _is_request_json_call(node):
    return (
        isinstance(node, ast.Call)
        and isinstance(node.func, ast.Attribute)
        and node.func.attr == "json"
        and isinstance(node.func.value, ast.Name)
        and node.func.value.id == "request"
    )


def _json_calls_with_guards(tree):
    """Devuelve (llamada, [handlers del try más interno que la contiene])."""
    results = []

    def walk(node, stack):
        if isinstance(node, ast.Try):
            stack = stack + [(node, list(node.handlers))]
            for child in list(node.body) + list(node.handlers) + list(node.orelse) + list(node.finalbody):
                walk(child, stack)
            return
        if _is_request_json_call(node):
            results.append((node, stack[-1][1] if stack else []))
        for child in ast.iter_child_nodes(node):
            walk(child, stack)

    walk(tree, [])
    return results


def _handler_returns(handler, status_code):
    """True si el handler del try responde con ese código (literal o vía helper)."""
    for node in ast.walk(handler):
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name):
                if node.func.id in ("invalid_json_response", "invalid_json_text") and status_code == 400:
                    return True
                if node.func.id == "internal_error" and status_code == 500:
                    return True
                if node.func.id.startswith("internal_error_") and status_code == 500:
                    return True
        if isinstance(node, ast.keyword) and node.arg == "status":
            value = node.value
            if isinstance(value, ast.Constant) and value.value == status_code:
                return True
    return False


if __name__ == "__main__":
    unittest.main()
