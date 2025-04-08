import logging
import os
from contextlib import redirect_stdout
from io import StringIO

from server import server

import webview

logger = logging.getLogger(__name__)

if __name__ == '__main__':
    stream = StringIO()
    with redirect_stdout(stream):
        window = webview.create_window(
            '不为人知的小世界', 
            server, 
            min_size=(1200, 700), 
            frameless=True,
        )
        webview.start(debug=True)
