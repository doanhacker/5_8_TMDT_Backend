from __future__ import annotations

from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Dict
import argparse
import json

from engine import LaptopShopDeepAI


ENGINE = LaptopShopDeepAI()


def build_health_payload() -> Dict[str, Any]:
    return {
        "status": "ok",
        "service": "laptopshop-deep-ai",
        "algorithm": "hybrid_keyword_structured_ranker_v4",
    }


class AIRequestHandler(BaseHTTPRequestHandler):
    server_version = "LaptopShopAIDeep/0.1"

    def do_GET(self) -> None:
        if self.path == "/health":
            self._send_json(HTTPStatus.OK, build_health_payload())
            return

        self._send_json(HTTPStatus.NOT_FOUND, {"error": "Not found"})

    def do_POST(self) -> None:
        if self.path != "/chat":
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "Not found"})
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            content_length = 0

        try:
            raw_body = self.rfile.read(content_length) if content_length > 0 else b"{}"
            payload = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Invalid JSON body"})
            return

        message = str(payload.get("message", "")).strip()
        if not message:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "message is required"})
            return

        products = payload.get("products", [])
        history = payload.get("history", [])
        if not isinstance(products, list) or not isinstance(history, list):
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "products and history must be arrays"})
            return

        response = ENGINE.chat(message, products, history)
        self._send_json(HTTPStatus.OK, response)

    def log_message(self, format: str, *args: object) -> None:
        return

    def _send_json(self, status: HTTPStatus, payload: Dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status.value)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def run(host: str = "127.0.0.1", port: int = 8001) -> None:
    server = ThreadingHTTPServer((host, port), AIRequestHandler)
    print(f"LaptopShop AI service listening on http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the LaptopShop AI service.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8001)
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    run(args.host, args.port)
