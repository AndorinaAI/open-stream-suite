"""Validación de URLs para fetches iniciados por el usuario (RSS).

Bloquea loopback, rangos privados, link-local y metadatos; resuelve el host y
valida todas las IP antes de conectar. Los redirects se siguen manualmente para
validar cada destino.
"""
from __future__ import annotations

import asyncio
import ipaddress
import socket
from urllib.parse import urljoin, urlsplit

MAX_REDIRECTS = 4
DEFAULT_PORTS = {"http": 80, "https": 443}


class UnsafeURL(ValueError):
    pass


def _is_public_ip(value: str) -> bool:
    try:
        ip = ipaddress.ip_address(value)
    except ValueError:
        return False
    if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast:
        return False
    if ip.is_reserved or ip.is_unspecified:
        return False
    if getattr(ip, "is_site_local", False):
        return False
    return True


async def assert_public_url(url: str) -> str:
    """Valida esquema, host, puerto y todas las direcciones resueltas."""
    try:
        parsed = urlsplit(str(url).strip())
    except ValueError as e:
        raise UnsafeURL("URL inválida") from e
    scheme = parsed.scheme.lower()
    if scheme not in DEFAULT_PORTS:
        raise UnsafeURL("Solo se permiten URLs http/https")
    if parsed.username or parsed.password:
        raise UnsafeURL("No se permiten credenciales en la URL")
    host = (parsed.hostname or "").strip().lower()
    if not host:
        raise UnsafeURL("URL sin host")
    if host in ("localhost",) or host.endswith(".local"):
        raise UnsafeURL("Host local no permitido")
    try:
        port = parsed.port or DEFAULT_PORTS[scheme]
    except ValueError as e:
        raise UnsafeURL("Puerto inválido") from e
    if port not in (80, 443):
        raise UnsafeURL("Solo se permiten puertos 80/443")

    # Literal IP: validar directamente.
    literal = None
    try:
        literal = ipaddress.ip_address(host.strip("[]"))
    except ValueError:
        literal = None
    if literal is not None:
        if not _is_public_ip(str(literal)):
            raise UnsafeURL("Dirección IP privada o reservada")
        return parsed.geturl()

    loop = asyncio.get_running_loop()
    try:
        infos = await loop.getaddrinfo(host, port, type=socket.SOCK_STREAM)
    except socket.gaierror as e:
        raise UnsafeURL("No se pudo resolver el host") from e
    addresses = {str(info[4][0]) for info in infos}
    if not addresses or not all(_is_public_ip(addr) for addr in addresses):
        raise UnsafeURL("El host resuelve a una dirección privada o reservada")
    return parsed.geturl()


def safe_redirect(previous: str, location: str) -> str:
    """Resuelve un Location relativo sin cambiar de origen de forma insegura."""
    if not location:
        raise UnsafeURL("Redirect sin Location")
    return urljoin(previous, location)
