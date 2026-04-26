#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  optimize-videos.sh
#  Compress all .mp4 / .mov / .webm product videos for web
#  Usage: bash scripts/optimize-videos.sh [input-dir] [output-dir]
#
#  Recommended settings for 360-model chroma-key footage:
#   - CRF 28 (visually lossless for web)
#   - faststart (allows stream before full download)
#   - scale to 720p (enough for modal fullscreen, halves file size vs 1080p)
#   - AAC audio stripped (silent green-screen footage)
# ─────────────────────────────────────────────────────────────

INPUT_DIR="${1:-./public/videos}"
OUTPUT_DIR="${2:-./public/videos/optimized}"

mkdir -p "$OUTPUT_DIR"

echo "🎬  Scanning: $INPUT_DIR"
echo "📦  Output:   $OUTPUT_DIR"
echo ""

shopt -s nullglob
videos=("$INPUT_DIR"/*.{mp4,mov,webm,MP4,MOV})

if [ ${#videos[@]} -eq 0 ]; then
  echo "⚠️  No videos found in $INPUT_DIR"
  echo "    Place your .mp4 / .mov files there and re-run."
  exit 1
fi

for INPUT in "${videos[@]}"; do
  FILENAME=$(basename "$INPUT")
  NAME="${FILENAME%.*}"
  OUTPUT="$OUTPUT_DIR/${NAME}_web.mp4"

  echo "─────────────────────────────────────"
  echo "  Input:  $INPUT"
  echo "  Output: $OUTPUT"

  # Get original size
  ORIG_SIZE=$(du -sh "$INPUT" 2>/dev/null | cut -f1)
  echo "  Original size: $ORIG_SIZE"

  ffmpeg -y -i "$INPUT" \
    -vf "scale=-2:720" \
    -c:v libx264 \
    -crf 28 \
    -preset fast \
    -profile:v baseline \
    -level 3.0 \
    -movflags +faststart \
    -an \
    "$OUTPUT" 2>&1 | grep -E "(frame=|fps=|bitrate=|speed=|Error|error)" | tail -5

  if [ -f "$OUTPUT" ]; then
    NEW_SIZE=$(du -sh "$OUTPUT" 2>/dev/null | cut -f1)
    echo "  Optimized size: $NEW_SIZE ✅"
  else
    echo "  ❌ Failed — check ffmpeg output above"
  fi

  echo ""
done

echo "════════════════════════════════════"
echo "✅  Done! Upload files from: $OUTPUT_DIR"
echo ""
echo "💡 TIP: To use WebM (even smaller), run with:"
echo "        ffmpeg -i INPUT.mp4 -c:v libvpx-vp9 -crf 33 -b:v 0 -an OUTPUT.webm"
echo ""
