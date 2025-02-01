function createWindow(): void {
  // ... existing window creation code ...

  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' data: blob:;",
          "script-src 'self' 'unsafe-inline';",
          "style-src 'self' 'unsafe-inline';",
          "img-src 'self' data: blob:;",
          "connect-src 'self';"
        ].join(' ')
      }
    })
  });

  // ... rest of the file ...
} 