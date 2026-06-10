#!/usr/bin/env bash
# Upload Downers Grove landing-page assets to Cloudinary under hamstra/downers-grove/*
# cloud_name and api_key are baked in; the API secret is required at runtime.
#
# Usage:
#   CLOUDINARY_API_SECRET="<your-secret>" ./upload-to-cloudinary.sh
#
# Delivery (auto format + quality):
#   image: https://res.cloudinary.com/dsbllwpbh/image/upload/f_auto,q_auto/hamstra/downers-grove/<id>
#   video: https://res.cloudinary.com/dsbllwpbh/video/upload/q_auto/hamstra/downers-grove/hero-video.mp4
set -euo pipefail

CLOUD_NAME="dsbllwpbh"
API_KEY="533151878225121"
API_SECRET="${CLOUDINARY_API_SECRET:-}"

if [[ -z "$API_SECRET" ]]; then
  echo "ERROR: CLOUDINARY_API_SECRET env var is required." >&2
  echo "Run: CLOUDINARY_API_SECRET=\"...\" $0" >&2
  exit 1
fi

cd "$(dirname "$0")"

# public_id | local file | resource_type
declare -a PAIRS=(
  "hamstra/downers-grove/hero|img/hero.webp|image"
  "hamstra/downers-grove/aerial|img/aerial.webp|image"
  "hamstra/downers-grove/g1-maple|img/g1-maple.webp|image"
  "hamstra/downers-grove/g2-downtown|img/g2-downtown.webp|image"
  "hamstra/downers-grove/g3-highland|img/g3-highland.webp|image"
  "hamstra/downers-grove/g4-belmont|img/g4-belmont.webp|image"
  "hamstra/downers-grove/g5-pond|img/g5-pond.webp|image"
  "hamstra/downers-grove/g6-hobson|img/g6-hobson.webp|image"
  "hamstra/downers-grove/hero-video|video/hero.mp4|video"
)

for pair in "${PAIRS[@]}"; do
  IFS='|' read -r PUBLIC_ID FILE_PATH RTYPE <<< "$pair"

  if [[ ! -f "$FILE_PATH" ]]; then
    echo "  ! SKIP — missing: $FILE_PATH" >&2
    continue
  fi

  TIMESTAMP=$(date +%s)
  TO_SIGN="overwrite=true&public_id=${PUBLIC_ID}&timestamp=${TIMESTAMP}"
  SIGNATURE=$(printf '%s%s' "$TO_SIGN" "$API_SECRET" | openssl dgst -sha1 | awk '{print $NF}')

  echo "→ uploading ($RTYPE) $FILE_PATH  →  $PUBLIC_ID"
  RESPONSE=$(curl -s -X POST "https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${RTYPE}/upload" \
    -F "file=@${FILE_PATH}" \
    -F "api_key=${API_KEY}" \
    -F "timestamp=${TIMESTAMP}" \
    -F "public_id=${PUBLIC_ID}" \
    -F "overwrite=true" \
    -F "signature=${SIGNATURE}")

  URL=$(echo "$RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('secure_url') or ('ERROR: ' + json.dumps(d.get('error') or d)))")
  echo "   $URL"
done
