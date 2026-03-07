#!/bin/bash

# Configuración
API_URL="https://api.mevoyajapon.com"
TOKEN="hYOCsJK_Ros_zlClJynUFlVQT7W_G9La"

# Función para crear colección
create_collection() {
  local DATA="$1"
  curl -s -X POST "$API_URL/collections" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$DATA" | jq '.data.collection'
  echo "--------------------------------"
}

echo "🚀 Iniciando creación de colecciones en Directus (Esquema Completo)..."

# ---------------------------------------------------------
# 1. TRIPS (Viajes)
# ---------------------------------------------------------
echo "Creating 'trips'..."
create_collection '{
  "collection": "trips",
  "schema": {},
  "fields": [
    {
      "field": "id",
      "type": "integer",
      "schema": { "is_primary_key": true, "has_auto_increment": true },
      "meta": { "hidden": true }
    },
    { "field": "status", "type": "string", "schema": { "default_value": "draft" }, "meta": { "interface": "select-dropdown", "options": { "choices": [{"text":"Borrador","value":"draft"},{"text":"Publicado","value":"published"},{"text":"Archivado","value":"archived"}] } } },
    { "field": "user_created", "type": "uuid", "meta": { "special": ["user-created"], "interface": "select-dropdown-m2o", "readonly": true, "hidden": true }, "schema": { "foreign_key_table": "directus_users" } },
    { "field": "date_created", "type": "timestamp", "meta": { "special": ["date-created"], "interface": "datetime", "readonly": true, "hidden": true } },
    {
      "field": "title",
      "type": "string",
      "meta": { "interface": "input", "required": true }
    },
    {
      "field": "start_date",
      "type": "date",
      "meta": { "interface": "datetime", "special": null }
    },
    {
      "field": "end_date",
      "type": "date",
      "meta": { "interface": "datetime", "special": null }
    },
    {
      "field": "daily_budget",
      "type": "integer",
      "meta": { "interface": "input" }
    },
    {
      "field": "cover_image",
      "type": "uuid",
      "meta": { "interface": "file-image" },
      "schema": { "foreign_key_table": "directus_files" }
    },
    {
      "field": "currency",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "iso_code",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "country",
      "type": "json",
      "meta": { "interface": "input-code" }
    },
    {
      "field": "destinations",
      "type": "json",
      "meta": { "interface": "list" }
    }
  ]
}'

# ---------------------------------------------------------
# 2. EXPENSES (Gastos)
# ---------------------------------------------------------
echo "Creating 'expenses'..."
create_collection '{
  "collection": "expenses",
  "schema": {},
  "fields": [
    {
      "field": "id",
      "type": "integer",
      "schema": { "is_primary_key": true, "has_auto_increment": true },
      "meta": { "hidden": true }
    },
    { "field": "status", "type": "string", "schema": { "default_value": "published" }, "meta": { "interface": "select-dropdown", "options": { "choices": [{"text":"Publicado","value":"published"},{"text":"Borrador","value":"draft"},{"text":"Archivado","value":"archived"}] } } },
    { "field": "user_created", "type": "uuid", "meta": { "special": ["user-created"], "interface": "select-dropdown-m2o", "readonly": true, "hidden": true }, "schema": { "foreign_key_table": "directus_users" } },
    { "field": "date_created", "type": "timestamp", "meta": { "special": ["date-created"], "interface": "datetime", "readonly": true, "hidden": true } },
    {
      "field": "trip_id",
      "type": "integer",
      "meta": { "interface": "select-dropdown-m2o" },
      "schema": { "foreign_key_table": "trips" }
    },
    {
      "field": "date",
      "type": "timestamp",
      "meta": { "interface": "datetime", "required": true }
    },
    {
      "field": "concept",
      "type": "string",
      "meta": { "interface": "input", "required": true }
    },
    {
      "field": "amount",
      "type": "integer",
      "meta": { "interface": "input", "required": true }
    },
    {
      "field": "category",
      "type": "string",
      "meta": { "interface": "select-dropdown", "options": { "choices": [
        {"text":"Comida","value":"food"},
        {"text":"Transporte","value":"transport"},
        {"text":"Alojamiento","value":"accommodation"},
        {"text":"Entretenimiento","value":"entertainment"},
        {"text":"Compras","value":"shopping"},
        {"text":"Otros","value":"other"}
      ]}}
    },
    {
      "field": "description",
      "type": "text",
      "meta": { "interface": "input-multiline" }
    },
    {
      "field": "payment_method",
      "type": "string",
      "meta": { "interface": "select-dropdown", "options": { "choices": [
        {"text":"Efectivo","value":"cash"},
        {"text":"Tarjeta","value":"card"},
        {"text":"IC Card","value":"ic"}
      ]}}
    },
    {
      "field": "is_shared",
      "type": "boolean",
      "meta": { "interface": "boolean" }
    },
    {
      "field": "external_id",
      "type": "string",
      "meta": { "interface": "input", "hidden": true }
    },
    {
      "field": "city",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "prefectura",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "notes",
      "type": "text",
      "meta": { "interface": "input-multiline" }
    },
    {
      "field": "location_lat",
      "type": "float",
      "meta": { "interface": "input" }
    },
    {
      "field": "location_lng",
      "type": "float",
      "meta": { "interface": "input" }
    },
    {
      "field": "expense_status",
      "type": "string",
      "schema": { "default_value": "real" },
      "meta": { "interface": "select-dropdown", "options": { "choices": [{"text":"Real","value":"real"},{"text":"Previsto","value":"planned"}] } }
    }
  ]
}'

# ---------------------------------------------------------
# 3. ACTIVITIES
# ---------------------------------------------------------
echo "Creating 'activities'..."
create_collection '{
  "collection": "activities",
  "schema": {},
  "fields": [
    {
      "field": "id",
      "type": "integer",
      "schema": { "is_primary_key": true, "has_auto_increment": true },
      "meta": { "hidden": true }
    },
    { "field": "status", "type": "string", "schema": { "default_value": "published" }, "meta": { "interface": "select-dropdown", "options": { "choices": [{"text":"Publicado","value":"published"},{"text":"Borrador","value":"draft"},{"text":"Archivado","value":"archived"}] } } },
    { "field": "user_created", "type": "uuid", "meta": { "special": ["user-created"], "interface": "select-dropdown-m2o", "readonly": true, "hidden": true }, "schema": { "foreign_key_table": "directus_users" } },
    { "field": "date_created", "type": "timestamp", "meta": { "special": ["date-created"], "interface": "datetime", "readonly": true, "hidden": true } },
    {
      "field": "trip_id",
      "type": "integer",
      "meta": { "interface": "select-dropdown-m2o" },
      "schema": { "foreign_key_table": "trips" }
    },
    {
      "field": "currency",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "title",
      "type": "string",
      "meta": { "interface": "input", "required": true }
    },
    {
      "field": "type",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "price",
      "type": "integer",
      "meta": { "interface": "input" }
    },
    {
      "field": "payment_status",
      "type": "string",
      "schema": { "default_value": "pending" },
      "meta": { "interface": "select-dropdown", "options": { "choices": [{"text":"Pendiente","value":"pending"},{"text":"Pagado","value":"paid"},{"text":"Reembolsado","value":"refunded"}] } }
    },
    {
      "field": "address",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "prefecture",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "city",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "google_maps_link",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "latitude",
      "type": "float",
      "meta": { "interface": "input" }
    },
    {
      "field": "longitude",
      "type": "float",
      "meta": { "interface": "input" }
    },
    {
      "field": "notes",
      "type": "text",
      "meta": { "interface": "input-multiline" }
    },
    {
      "field": "start_date",
      "type": "timestamp",
      "meta": { "interface": "datetime" }
    },
    {
      "field": "end_date",
      "type": "timestamp",
      "meta": { "interface": "datetime" }
    }
  ]
}'

# ---------------------------------------------------------
# 4. ACCOMMODATIONS
# ---------------------------------------------------------
echo "Creating 'accommodations'..."
create_collection '{
  "collection": "accommodations",
  "schema": {},
  "fields": [
    {
      "field": "id",
      "type": "integer",
      "schema": { "is_primary_key": true, "has_auto_increment": true },
      "meta": { "hidden": true }
    },
    { "field": "status", "type": "string", "schema": { "default_value": "published" }, "meta": { "interface": "select-dropdown", "options": { "choices": [{"text":"Publicado","value":"published"},{"text":"Borrador","value":"draft"},{"text":"Archivado","value":"archived"}] } } },
    { "field": "user_created", "type": "uuid", "meta": { "special": ["user-created"], "interface": "select-dropdown-m2o", "readonly": true, "hidden": true }, "schema": { "foreign_key_table": "directus_users" } },
    { "field": "date_created", "type": "timestamp", "meta": { "special": ["date-created"], "interface": "datetime", "readonly": true, "hidden": true } },
    {
      "field": "trip_id",
      "type": "integer",
      "meta": { "interface": "select-dropdown-m2o" },
      "schema": { "foreign_key_table": "trips" }
    },
    {
      "field": "currency",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "name",
      "type": "string",
      "meta": { "interface": "input", "required": true }
    },
    {
      "field": "address",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "check_in",
      "type": "timestamp",
      "meta": { "interface": "datetime" }
    },
    {
      "field": "check_out",
      "type": "timestamp",
      "meta": { "interface": "datetime" }
    },
    {
      "field": "price",
      "type": "integer",
      "meta": { "interface": "input" }
    },
    {
      "field": "payment_status",
      "type": "string",
      "schema": { "default_value": "pending" },
      "meta": { "interface": "select-dropdown", "options": { "choices": [{"text":"Pendiente","value":"pending"},{"text":"Pagado","value":"paid"},{"text":"Reembolsado","value":"refunded"}] } }
    },
    {
      "field": "prefecture",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "city",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "google_maps_link",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "latitude",
      "type": "float",
      "meta": { "interface": "input" }
    },
    {
      "field": "longitude",
      "type": "float",
      "meta": { "interface": "input" }
    },
    {
      "field": "notes",
      "type": "text",
      "meta": { "interface": "input-multiline" }
    },
    {
      "field": "phone",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "email",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "has_luggage_forwarding",
      "type": "boolean",
      "meta": { "interface": "boolean" }
    },
    {
      "field": "board_basis",
      "type": "json",
      "meta": { "interface": "select-multiple-dropdown", "options": { "choices": [{"text":"Solo Alojamiento","value":"none"},{"text":"Desayuno","value":"breakfast"},{"text":"Media Pensión","value":"half_board"},{"text":"Pensión Completa","value":"full_board"}] } }
    },
    {
      "field": "is_private",
      "type": "boolean",
      "meta": { "interface": "boolean" }
    }
  ]
}'

# ---------------------------------------------------------
# 5. TRANSPORTS
# ---------------------------------------------------------
echo "Creating 'transports'..."
create_collection '{
  "collection": "transports",
  "schema": {},
  "fields": [
    {
      "field": "id",
      "type": "integer",
      "schema": { "is_primary_key": true, "has_auto_increment": true },
      "meta": { "hidden": true }
    },
    { "field": "status", "type": "string", "schema": { "default_value": "published" }, "meta": { "interface": "select-dropdown", "options": { "choices": [{"text":"Publicado","value":"published"},{"text":"Borrador","value":"draft"},{"text":"Archivado","value":"archived"}] } } },
    { "field": "user_created", "type": "uuid", "meta": { "special": ["user-created"], "interface": "select-dropdown-m2o", "readonly": true, "hidden": true }, "schema": { "foreign_key_table": "directus_users" } },
    { "field": "date_created", "type": "timestamp", "meta": { "special": ["date-created"], "interface": "datetime", "readonly": true, "hidden": true } },
    {
      "field": "trip_id",
      "type": "integer",
      "meta": { "interface": "select-dropdown-m2o" },
      "schema": { "foreign_key_table": "trips" }
    },
    {
      "field": "currency",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "name",
      "type": "string",
      "meta": { "interface": "input", "required": true }
    },
    {
      "field": "type",
      "type": "string",
      "meta": { "interface": "select-dropdown", "options": { "choices": [
        {"text":"Tren","value":"train"},
        {"text":"Bus","value":"bus"},
        {"text":"Taxi","value":"taxi"},
        {"text":"Metro","value":"subway"},
        {"text":"Ferry","value":"ferry"},
        {"text":"Avión","value":"plane"}
      ]}}
    },
    {
      "field": "category",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "price",
      "type": "integer",
      "meta": { "interface": "input" }
    },
    {
      "field": "start_date",
      "type": "timestamp",
      "meta": { "interface": "datetime" }
    },
    {
      "field": "end_date",
      "type": "timestamp",
      "meta": { "interface": "datetime" }
    },
    {
      "field": "payment_status",
      "type": "string",
      "schema": { "default_value": "pending" },
      "meta": { "interface": "select-dropdown", "options": { "choices": [{"text":"Pendiente","value":"pending"},{"text":"Pagado","value":"paid"},{"text":"Reembolsado","value":"refunded"}] } }
    },
    {
      "field": "duration_type",
      "type": "string",
      "meta": { "interface": "select-dropdown", "options": { "choices": [{"text":"Horas","value":"hours"},{"text":"Días","value":"days"}] } }
    },
    {
      "field": "stops",
      "type": "json",
      "meta": { "interface": "list" }
    },
    {
      "field": "pass_id",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "notes",
      "type": "text",
      "meta": { "interface": "input-multiline" }
    }
  ]
}'

# ---------------------------------------------------------
# 6. FLIGHTS
# ---------------------------------------------------------
echo "Creating 'flights'..."
create_collection '{
  "collection": "flights",
  "schema": {},
  "fields": [
    {
      "field": "id",
      "type": "integer",
      "schema": { "is_primary_key": true, "has_auto_increment": true },
      "meta": { "hidden": true }
    },
    { "field": "status", "type": "string", "schema": { "default_value": "published" }, "meta": { "interface": "select-dropdown", "options": { "choices": [{"text":"Publicado","value":"published"},{"text":"Borrador","value":"draft"},{"text":"Archivado","value":"archived"}] } } },
    { "field": "user_created", "type": "uuid", "meta": { "special": ["user-created"], "interface": "select-dropdown-m2o", "readonly": true, "hidden": true }, "schema": { "foreign_key_table": "directus_users" } },
    { "field": "date_created", "type": "timestamp", "meta": { "special": ["date-created"], "interface": "datetime", "readonly": true, "hidden": true } },
    {
      "field": "trip_id",
      "type": "integer",
      "meta": { "interface": "select-dropdown-m2o" },
      "schema": { "foreign_key_table": "trips" }
    },
    {
      "field": "currency",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "departure_airport",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "arrival_airport",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "departure_time",
      "type": "timestamp",
      "meta": { "interface": "datetime" }
    },
    {
      "field": "arrival_time",
      "type": "timestamp",
      "meta": { "interface": "datetime" }
    },
    {
      "field": "airline",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "booking_reference",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "price",
      "type": "integer",
      "meta": { "interface": "input" }
    },
    {
      "field": "flight_number",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "terminal",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "layovers",
      "type": "json",
      "meta": { "interface": "list" }
    },
    {
      "field": "title",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "payment_status",
      "type": "string",
      "schema": { "default_value": "pending" },
      "meta": { "interface": "select-dropdown", "options": { "choices": [{"text":"Pendiente","value":"pending"},{"text":"Pagado","value":"paid"},{"text":"Reembolsado","value":"refunded"}] } }
    }
  ]
}'

# ---------------------------------------------------------
# 7. TASKS (Tareas)
# ---------------------------------------------------------
echo "Creating 'tasks'..."
create_collection '{
  "collection": "tasks",
  "schema": {},
  "fields": [
    {
      "field": "id",
      "type": "integer",
      "schema": { "is_primary_key": true, "has_auto_increment": true },
      "meta": { "hidden": true }
    },
    {
      "field": "title",
      "type": "string",
      "meta": { "interface": "input", "required": true }
    },
    {
      "field": "description",
      "type": "text",
      "meta": { "interface": "input-multiline" }
    },
    {
      "field": "status",
      "type": "string",
      "schema": { "default_value": "pending" },
      "meta": { "interface": "select-dropdown", "options": { "choices": [
        {"text":"Pendiente","value":"pending"},
        {"text":"En Progreso","value":"in_progress"},
        {"text":"Completada","value":"completed"},
        {"text":"Cancelada","value":"cancelled"}
      ]}}
    },
    {
      "field": "priority",
      "type": "string",
      "schema": { "default_value": "medium" },
      "meta": { "interface": "select-dropdown", "options": { "choices": [
        {"text":"Baja","value":"low"},
        {"text":"Media","value":"medium"},
        {"text":"Alta","value":"high"},
        {"text":"Urgente","value":"urgent"}
      ]}}
    },
    {
      "field": "due_date",
      "type": "timestamp",
      "meta": { "interface": "datetime" }
    },
    {
      "field": "trip_id",
      "type": "integer",
      "meta": { "interface": "select-dropdown-m2o" },
      "schema": { "foreign_key_table": "trips" }
    },
    {
      "field": "assigned_to",
      "type": "uuid",
      "meta": { "interface": "select-dropdown-m2o" },
      "schema": { "foreign_key_table": "directus_users" }
    },
    {
      "field": "entity_type",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "entity_id",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "task_group",
      "type": "string",
      "meta": { "interface": "input" }
    }
  ]
}'

# ---------------------------------------------------------
# 8. DAILY NOTES
# ---------------------------------------------------------
echo "Creating 'daily_notes'..."
create_collection '{
  "collection": "daily_notes",
  "schema": {},
  "fields": [
    {
      "field": "id",
      "type": "integer",
      "schema": { "is_primary_key": true, "has_auto_increment": true },
      "meta": { "hidden": true }
    },
    {
      "field": "date",
      "type": "date",
      "meta": { "interface": "datetime", "required": true }
    },
    {
      "field": "content",
      "type": "text",
      "meta": { "interface": "markdown", "required": true }
    },
    {
      "field": "trip_id",
      "type": "integer",
      "meta": { "interface": "select-dropdown-m2o" },
      "schema": { "foreign_key_table": "trips" }
    }
  ]
}'

# ---------------------------------------------------------
# 9. CURRENCY EXCHANGES
# ---------------------------------------------------------
echo "Creating 'currency_exchanges'..."
create_collection '{
  "collection": "currency_exchanges",
  "schema": {},
  "fields": [
    {
      "field": "id",
      "type": "integer",
      "schema": { "is_primary_key": true, "has_auto_increment": true },
      "meta": { "hidden": true }
    },
    { "field": "status", "type": "string", "schema": { "default_value": "published" }, "meta": { "interface": "select-dropdown", "options": { "choices": [{"text":"Publicado","value":"published"},{"text":"Borrador","value":"draft"},{"text":"Archivado","value":"archived"}] } } },
    { "field": "user_created", "type": "uuid", "meta": { "special": ["user-created"], "interface": "select-dropdown-m2o", "readonly": true, "hidden": true }, "schema": { "foreign_key_table": "directus_users" } },
    { "field": "date_created", "type": "timestamp", "meta": { "special": ["date-created"], "interface": "datetime", "readonly": true, "hidden": true } },
    {
      "field": "trip_id",
      "type": "integer",
      "meta": { "interface": "select-dropdown-m2o" },
      "schema": { "foreign_key_table": "trips" }
    },
    {
      "field": "date",
      "type": "timestamp",
      "meta": { "interface": "datetime", "required": true }
    },
    {
      "field": "amount_from",
      "type": "float",
      "meta": { "interface": "input", "required": true }
    },
    {
      "field": "currency_from",
      "type": "string",
      "meta": { "interface": "input", "required": true }
    },
    {
      "field": "amount_to",
      "type": "float",
      "meta": { "interface": "input", "required": true }
    },
    {
      "field": "currency_to",
      "type": "string",
      "meta": { "interface": "input", "required": true }
    },
    {
      "field": "rate",
      "type": "float",
      "meta": { "interface": "input", "required": true }
    },
    {
      "field": "place",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "fund_destination",
      "type": "string",
      "meta": { "interface": "select-dropdown", "options": { "choices": [{"text":"Efectivo","value":"cash"},{"text":"Tarjeta","value":"card"},{"text":"IC Card","value":"ic"}] } }
    }
  ]
}'

# ---------------------------------------------------------
# 10. INSURANCES
# ---------------------------------------------------------
echo "Creating 'insurances'..."
create_collection '{
  "collection": "insurances",
  "schema": {},
  "fields": [
    {
      "field": "id",
      "type": "integer",
      "schema": { "is_primary_key": true, "has_auto_increment": true },
      "meta": { "hidden": true }
    },
    { "field": "status", "type": "string", "schema": { "default_value": "published" }, "meta": { "interface": "select-dropdown", "options": { "choices": [{"text":"Publicado","value":"published"},{"text":"Borrador","value":"draft"},{"text":"Archivado","value":"archived"}] } } },
    { "field": "user_created", "type": "uuid", "meta": { "special": ["user-created"], "interface": "select-dropdown-m2o", "readonly": true, "hidden": true }, "schema": { "foreign_key_table": "directus_users" } },
    { "field": "date_created", "type": "timestamp", "meta": { "special": ["date-created"], "interface": "datetime", "readonly": true, "hidden": true } },
    {
      "field": "trip_id",
      "type": "integer",
      "meta": { "interface": "select-dropdown-m2o" },
      "schema": { "foreign_key_table": "trips" }
    },
    {
      "field": "currency",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "provider",
      "type": "string",
      "meta": { "interface": "input", "required": true }
    },
    {
      "field": "type",
      "type": "string",
      "meta": { "interface": "select-dropdown", "options": { "choices": [{"text":"Salud","value":"health"},{"text":"Anulación","value":"cancellation"},{"text":"Equipaje","value":"luggage"}] } }
    },
    {
      "field": "policy_number",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "emergency_phone",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "emergency_email",
      "type": "string",
      "meta": { "interface": "input" }
    },
    {
      "field": "start_date",
      "type": "date",
      "meta": { "interface": "datetime" }
    },
    {
      "field": "end_date",
      "type": "date",
      "meta": { "interface": "datetime" }
    },
    {
      "field": "price",
      "type": "integer",
      "meta": { "interface": "input" }
    },
    {
      "field": "payment_status",
      "type": "string",
      "schema": { "default_value": "pending" },
      "meta": { "interface": "select-dropdown", "options": { "choices": [{"text":"Pendiente","value":"pending"},{"text":"Pagado","value":"paid"},{"text":"Reembolsado","value":"refunded"}] } }
    },
    {
      "field": "notes",
      "type": "text",
      "meta": { "interface": "input-multiline" }
    }
  ]
}'

# ---------------------------------------------------------
# 11. NOTIFICATIONS
# ---------------------------------------------------------
echo "Creating 'notifications'..."
create_collection '{
  "collection": "notifications",
  "schema": {},
  "fields": [
    {
      "field": "id",
      "type": "integer",
      "schema": { "is_primary_key": true, "has_auto_increment": true },
      "meta": { "hidden": true }
    },
    { "field": "status", "type": "string", "schema": { "default_value": "published" }, "meta": { "interface": "select-dropdown", "options": { "choices": [{"text":"Publicado","value":"published"},{"text":"Borrador","value":"draft"},{"text":"Archivado","value":"archived"}] } } },
    { "field": "user_created", "type": "uuid", "meta": { "special": ["user-created"], "interface": "select-dropdown-m2o", "readonly": true, "hidden": true }, "schema": { "foreign_key_table": "directus_users" } },
    { "field": "date_created", "type": "timestamp", "meta": { "special": ["date-created"], "interface": "datetime", "readonly": true, "hidden": true } },
    { "field": "user_updated", "type": "uuid", "meta": { "special": ["user-updated"], "interface": "select-dropdown-m2o", "readonly": true, "hidden": true }, "schema": { "foreign_key_table": "directus_users" } },
    { "field": "date_updated", "type": "timestamp", "meta": { "special": ["date-updated"], "interface": "datetime", "readonly": true, "hidden": true } },
    {
      "field": "recipient_id",
      "type": "uuid",
      "meta": { "interface": "select-dropdown-m2o" },
      "schema": { "foreign_key_table": "directus_users" }
    },
    {
      "field": "title",
      "type": "string",
      "meta": { "interface": "input", "required": true }
    },
    {
      "field": "message",
      "type": "text",
      "meta": { "interface": "input-multiline", "required": true }
    },
    {
      "field": "type",
      "type": "string",
      "schema": { "default_value": "info" },
      "meta": { "interface": "select-dropdown", "options": { "choices": [{"text":"Info","value":"info"},{"text":"Warning","value":"warning"},{"text":"Error","value":"error"},{"text":"Success","value":"success"}] } }
    },
    {
      "field": "read_at",
      "type": "timestamp",
      "meta": { "interface": "datetime" }
    },
    {
      "field": "action_link",
      "type": "string",
      "meta": { "interface": "input" }
    }
  ]
}'

echo "✅ Proceso completado."
