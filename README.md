Cesium Web Service
==================

Provides a HTTP Web Service that allows a client to set the Cesium camera position and orientation and returns the resulting canvas image as PNG.

## Install dependencies and launch the web service
'''shell
npm install
npm start
'''

## Known bugs
[executeJavaScript does not resolve Promise or execute callback on Mac.](https://github.com/electron/electron/issues/9073).
