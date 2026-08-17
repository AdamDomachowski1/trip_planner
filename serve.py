#!/usr/bin/env python3
"""Local dev server that forbids caching, so edited JS/CSS always reloads."""

import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8741
    print(f'http://localhost:{port}')
    HTTPServer(('', port), NoCacheHandler).serve_forever()
