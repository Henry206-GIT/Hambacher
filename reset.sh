#!/bin/bash
# Setzt die Abdruck-Datenbank zurück (löscht alle Abdrücke einer Ausstellung).
#
# Nutzung:
#   ./reset.sh                # löscht Ausstellung 1 (Standard)
#   ./reset.sh 2              # löscht Ausstellung 2
#   HOST=https://... ./reset.sh   # gegen anderen Host (Standard: localhost:3000)
#   ADMIN_TOKEN=geheim ./reset.sh # mit Admin-Token (falls am Server gesetzt)
cd "$(dirname "$0")"

EXHIBITION="${1:-1}"
HOST="${HOST:-http://localhost:3000}"

HEADER=()
[ -n "$ADMIN_TOKEN" ] && HEADER=(-H "x-admin-token: $ADMIN_TOKEN")

# Server erreichbar?
if ! curl -sf -o /dev/null "$HOST/"; then
  echo "❌ Server nicht erreichbar unter $HOST."
  echo "   Erst ./start.sh starten (oder HOST=... setzen)."
  exit 1
fi

# Anzahl vorher
BEFORE=$(curl -s "$HOST/api/footprints/$EXHIBITION" | grep -o '"id"' | wc -l | tr -d ' ')

RESP=$(curl -s -X DELETE "${HEADER[@]}" "$HOST/api/footprints/$EXHIBITION")

if echo "$RESP" | grep -q '"ok":true'; then
  echo "✓ Ausstellung $EXHIBITION zurückgesetzt – $BEFORE Abdrücke gelöscht."
else
  echo "❌ Fehler beim Zurücksetzen: $RESP"
  exit 1
fi
