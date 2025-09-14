#!/bin/bash
# Plane Tracker Kiosk Startup Script
# Starts Node.js backend, http-server for frontend, and Chromium in kiosk mode

# Start Node.js backend (proxy/API) in the background, log output
nohup node server.js > server.log 2>&1 &

# Start http-server for frontend in the background (port 8080), log output
nohup http-server -p 8080 > static.log 2>&1 &

# Wait a moment for both servers to start
sleep 2

# Launch Chromium in kiosk mode, pointing to the frontend
chromium-browser --kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble --app=http://localhost:8080
