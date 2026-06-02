#!/bin/bash
cd "$(dirname "$0")"

# Alte Prozesse beenden
pkill -f "node server.js" 2>/dev/null
pkill -f cloudflared 2>/dev/null
sleep 1

# Server starten
node server.js &
SERVER_PID=$!
echo "Server gestartet (PID $SERVER_PID)"

# Warten bis Server bereit
for i in {1..10}; do
  curl -s http://localhost:3000/ > /dev/null && break
  sleep 1
done

# Cloudflare binary laden falls nicht vorhanden (nach Neustart)
if [ ! -f /tmp/cloudflared ]; then
  echo "⏳ Lade cloudflared..."
  curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 \
    -o /tmp/cloudflared && chmod +x /tmp/cloudflared
fi

# Cloudflare Tunnel starten
/tmp/cloudflared tunnel --url http://localhost:3000 --no-autoupdate > /tmp/cf.log 2>&1 &
echo "⏳ Tunnel wird gestartet..."
sleep 10

# URL ausgeben
URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' /tmp/cf.log | head -1)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Hambacher Schloss – AR Fußspuren"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  App:     $URL"
echo "  QR-Code: $URL/qr.html"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Strg+C zum Beenden"
echo ""

# Warten (Prozesse laufen im Hintergrund)
wait $SERVER_PID
