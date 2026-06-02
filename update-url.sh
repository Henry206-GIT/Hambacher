#!/bin/bash
# Aktualisiert die GitHub Pages Weiterleitung mit der neuen Tunnel-URL
cd "$(dirname "$0")"

URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' /tmp/cf.log | head -1)

if [ -z "$URL" ]; then
  echo "Kein Tunnel aktiv. Starte erst start.sh"
  exit 1
fi

cat > docs/index.html << EOF
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=$URL">
  <title>Hambacher Schloss – AR</title>
</head>
<body>
  <p>Weiterleitung... <a href="$URL">hier klicken</a></p>
</body>
</html>
EOF

git add docs/index.html
git commit -m "update live url: $URL"
git push origin main

echo ""
echo "Fertig! Kurze URL:"
echo "  https://henry206-git.github.io/Hambacher"
echo ""
