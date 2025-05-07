#!/usr/bin/env python3
"""
Simple HTTP Server for Email MultiApp Widget Prototype
Run this script to serve the prototype locally.
"""

import http.server
import socketserver
import os

# Set the port
PORT = 8000

# Change to the directory containing the HTML/JS/CSS files
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Create a simple HTTP server
Handler = http.server.SimpleHTTPRequestHandler
Handler.extensions_map.update({
    '.js': 'application/javascript',
    '.html': 'text/html',
    '.css': 'text/css',
})

# Set up and start the server
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    print(f"Press Ctrl+C to stop the server.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped by user.") 