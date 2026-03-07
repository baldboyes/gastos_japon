#!/bin/bash
set -euo pipefail

API_URL="${DIRECTUS_URL:-https://directus.jizou.io}"
TOKEN="${DIRECTUS_ADMIN_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "Falta DIRECTUS_ADMIN_TOKEN en el entorno."
  exit 1
fi

READ_UPDATE_RULE='{
  "_or": [
    { "trip_id": { "collaborators": { "directus_users_id": { "_eq": "$CURRENT_USER" } } } },
    { "trip_id": { "user_created": { "_eq": "$CURRENT_USER" } } }
  ]
}'

DELETE_RULE='{ "trip_id": { "user_created": { "_eq": "$CURRENT_USER" } } }'

PERMS_JSON="$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/permissions?filter[collection][_eq]=tasks&limit=-1")"
COUNT="$(echo "$PERMS_JSON" | jq '.data | length')"

if [ "$COUNT" -eq 0 ]; then
  echo "No se encontraron permisos para la colección tasks."
  exit 0
fi

echo "$PERMS_JSON" | jq -r '.data[] | "\(.id) \(.action)"' | while read -r ID ACTION; do
  case "$ACTION" in
    read|update)
      BODY="$(jq -cn --argjson p "$READ_UPDATE_RULE" '{permissions: $p}')" ;;
    delete)
      BODY="$(jq -cn --argjson p "$DELETE_RULE" '{permissions: $p}')" ;;
    create)
      BODY='{"permissions":{}}' ;;
    *)
      continue ;;
  esac

  curl -s -X PATCH "$API_URL/permissions/$ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$BODY" >/dev/null
done

echo "Permisos de tasks actualizados (todas las policies/roles)."
