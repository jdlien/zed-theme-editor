#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PUBLIC_DIR="$ROOT_DIR/public"
SOURCE_SVG="$PUBLIC_DIR/favicon.svg"
OUTPUT_PNG="$PUBLIC_DIR/favicon-32x32.png"
OUTPUT_ICO="$PUBLIC_DIR/favicon.ico"

if command -v magick >/dev/null 2>&1; then
  IM_CMD="magick"
elif command -v convert >/dev/null 2>&1; then
  IM_CMD="convert"
else
  echo "ImageMagick not found. Install it (e.g. 'brew install imagemagick') and try again." >&2
  exit 1
fi

if [[ ! -f "$SOURCE_SVG" ]]; then
  echo "Missing source SVG: $SOURCE_SVG" >&2
  exit 1
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
TMP_PNG16="$TMP_DIR/favicon-16x16.png"

"$IM_CMD" -background none -density 512 "$SOURCE_SVG" -resize 32x32 "$OUTPUT_PNG"
"$IM_CMD" -background none -density 512 "$SOURCE_SVG" -resize 16x16 "$TMP_PNG16"
"$IM_CMD" "$TMP_PNG16" "$OUTPUT_PNG" "$OUTPUT_ICO"

echo "Generated:"
echo "- $(realpath "$OUTPUT_PNG")"
echo "- $(realpath "$OUTPUT_ICO")"
