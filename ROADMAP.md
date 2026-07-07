# Roadmap: Tracking- & Visualisierungs-Verbesserungen

Stand: Juli 2026. Android = WebXR/ARCore (`public/index.html`, p31),
Apple = 8th Wall (`public/8thwall.html`, w6, absolute Skalierung/Meter).
Rahmen: gratis, ohne Account, ohne Marker-Pflicht. Kostenpflichtige/Marker-Optionen
sind unten klar markiert. Umsetzung pro Stufe, je Patch ein Commit (Badge pN/wN hochzählen).

## Stufe 1: Quick Wins (je < 1 h)

1. **Textur-Cache pro Farbe** (beide Dateien, `makeHandCanvas`):
   Nur 10 Farben, aber pro Abdruck eine eigene Canvas-Textur. Cache
   `Map<color, THREE.CanvasTexture>` → weniger RAM/GC, schnellerer Spawn bei 100 Abdrücken.

2. **Label-Fade auf Distanz** (beide): Namens-Labels ab ~4 m ausblenden/faden
   (Distanz-Check im billboard-tick). Verhindert Label-Salat.

3. **iOS: Hinweis bei Tracking-Verlust** (`8thwall.html`): Camera-Pipeline-Status
   auswerten, Banner „Tracking verloren – langsam bewegen" (Muster von p17).

4. **Spawn-Effekt** (beide): expandierende Ring-Welle beim Platzieren
   (a-torus, Scale/Opacity-Animation 600 ms, danach entfernen).

## Stufe 2: Tracking-Qualität

5. **Android: Depth-Sensing debuggen** (`index.html`): Log zeigte stets `depth=false`.
   Diagnose einbauen: `session.enabledFeatures` + Fehlertext von
   `frame.getDepthInformation` ins Debug-Log. Danach Format-Preferences anpassen
   (`gpu-optimized` zuerst) oder Feature als „Gerät kann's nicht" dokumentieren.

6. **Android: XRAnchor pro Abdruck** (`index.html`): p15 scheiterte am EINEN
   Gruppen-Anchor vs. Kalibrier-Logik. Neu: pro platziertem Abdruck ein eigener
   `XRAnchor` aus dem Hit-Result (Feature-Detection, statischer Fallback).
   Kalibrier-Anker `#fp-root` bleibt statisch. Einzelne Abdrücke kleben drift-frei.

7. **iOS: Flächenschätzung statt y=0** (`8thwall.html`): `reticle-follow` schneidet
   eine ideale Ebene y=0 → auf Treppen/Podesten falsch. 8th Walls geschätzte
   Bodenhöhe nutzen (xrweb Ground/Surface bzw. XR8-Pipeline; Recherche 8thwall.org).

8. **Gemeinsamer Raum-Ursprung (opt-in, Marker)**: Einziger Gratis-Weg zu „alle Geräte
   sehen Abdrücke am selben realen Ort, sitzungsübergreifend": **8th Wall Image Targets**
   (MIT, `apps/image-target-cli` im OSS-Repo). Gedrucktes Motiv als gemeinsamer Anker;
   Kalibrieren-Overlay bekommt Option „am Poster ausrichten", manuelle Kalibrierung
   bleibt Standard. Kostenpflichtige Alternativen (nur der Vollständigkeit halber):
   Cloud Anchors, Onirix, Zapworks.

## Stufe 3: Visualisierung

9. **Licht-Schätzung**: Android WebXR `light-estimation`, iOS 8th-Wall-`lighting`-Modul.
   Umgebungshelligkeit als Uniform in den holo-mat-Shader → Hologramme passen sich
   dunklen/hellen Räumen an.

10. **Boden-Kontakt-Schatten**: weicher radialer Blob-Schatten (Canvas-Textur, multiply)
    unter jedem Abdruck → wirkt verankert statt schwebend. Eine gemeinsame Textur.

11. **Occlusion (Android, abhängig von Nr. 5)**: Depth-Texture als Occluder →
    Abdrücke verschwinden korrekt hinter realen Objekten. Größter Wow-Hebel.

12. **Performance bei 100 Abdrücken**: pulse-ring-Ticks zu einem globalen Zeit-Uniform
    zusammenlegen, Ringe ab 8 m Distanz ausblenden (Additive-Overdraw), FPS-Zeile
    ins vorhandene Logging.

## Bewusst ausgeklammert
- A-Frame 1.4 → 1.7 (Android): Risiko bei Cursor/xrselect, Nutzen gering.
- AlvaAR: verworfen, monokulares SLAM zu schwach.
- Variant Launch: Loader liegt dormant in `index.html`, nur falls doch ein Account kommt.

## Verifikation pro Stufe
- Einzeln deployen (Badge hochzählen), iPhone + Android via
  `https://henry206-git.github.io/Hambacher` testen, `debug.log` auswerten.
- Nr. 5/6: Log muss `depth=true` bzw. per-Print-Anchor zeigen; Drift-Test: platzieren,
  10 m weg, zurück, Abweichung schätzen.
- DB vor Vergleichstests: `./reset.sh`.
