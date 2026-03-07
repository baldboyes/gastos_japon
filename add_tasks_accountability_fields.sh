#!/bin/bash
set -euo pipefail

DIRECTUS_URL="${DIRECTUS_URL:-https://directus.jizou.io}"
TOKEN="${DIRECTUS_ADMIN_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "Falta DIRECTUS_ADMIN_TOKEN en el entorno."
  exit 1
fi

FIELDS_JSON="$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/fields/tasks?limit=-1")"

has_field () {
  echo "$FIELDS_JSON" | jq -e --arg f "$1" '.data[]? | select(.field == $f) | .field' >/dev/null 2>&1
}

create_field () {
  local payload="$1"
  curl -s -X POST "$DIRECTUS_URL/fields/tasks" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload" >/dev/null
}

if ! has_field "user_created"; then
  create_field '{
    "field": "user_created",
    "type": "uuid",
    "schema": { "is_nullable": true },
    "meta": {
      "special": ["user-created"],
      "interface": "select-dropdown-m2o",
      "readonly": true,
      "hidden": true,
      "sort": 9900,
      "width": "full"
    }
  }'
  echo "Creado field user_created en tasks."
else
  echo "Field user_created ya existe en tasks."
fi

if ! has_field "date_created"; then
  create_field '{
    "field": "date_created",
    "type": "timestamp",
    "schema": { "is_nullable": true },
    "meta": {
      "special": ["date-created"],
      "interface": "datetime",
      "readonly": true,
      "hidden": true,
      "sort": 9901,
      "width": "full"
    }
  }'
  echo "Creado field date_created en tasks."
else
  echo "Field date_created ya existe en tasks."
fi

if ! has_field "user_updated"; then
  create_field '{
    "field": "user_updated",
    "type": "uuid",
    "schema": { "is_nullable": true },
    "meta": {
      "special": ["user-updated"],
      "interface": "select-dropdown-m2o",
      "readonly": true,
      "hidden": true,
      "sort": 9902,
      "width": "full"
    }
  }'
  echo "Creado field user_updated en tasks."
else
  echo "Field user_updated ya existe en tasks."
fi

if ! has_field "date_updated"; then
  create_field '{
    "field": "date_updated",
    "type": "timestamp",
    "schema": { "is_nullable": true },
    "meta": {
      "special": ["date-updated"],
      "interface": "datetime",
      "readonly": true,
      "hidden": true,
      "sort": 9903,
      "width": "full"
    }
  }'
  echo "Creado field date_updated en tasks."
else
  echo "Field date_updated ya existe en tasks."
fi

echo "Listo."
