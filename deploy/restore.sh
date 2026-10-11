#!/bin/sh
# Runs once, when the Postgres data volume is empty.
# The entrypoint sources this file when it is not executable, so keep the
# shell options of the parent process unchanged and check errors explicitly.
# A missing or failed restore clears PGDATA so the next start retries init
# instead of serving an empty database that the app would seed from CSV.

DUMP=/dump/tbilisi.dump

clear_data_dir() {
  if [ -z "${PGDATA:-}" ] || [ ! -d "$PGDATA" ]; then
    return
  fi
  pg_ctl -D "$PGDATA" -m immediate -w stop || true
  rm -rf "$PGDATA"/*
}

fail() {
  echo "$1" >&2
  clear_data_dir
  exit 1
}

if [ ! -f "$DUMP" ]; then
  fail "Missing ${DUMP}. Copy the pg_dump from the current environment before the first start."
fi

echo "Restoring database from ${DUMP}"
raw=$(mktemp) || fail "mktemp failed"
list=$(mktemp) || fail "mktemp failed"
pg_restore -l "$DUMP" > "$raw" || fail "pg_restore -l failed"
# The Docker entrypoint already created schema public. Drop that TOC entry so
# --exit-on-error does not abort on "schema public already exists".
grep -v 'SCHEMA - public' "$raw" > "$list" || true
rm -f "$raw"

if ! pg_restore --no-owner --no-acl --exit-on-error --single-transaction \
  -U "$POSTGRES_USER" -d "$POSTGRES_DB" --use-list="$list" "$DUMP"; then
  rm -f "$list"
  fail "pg_restore failed. The data directory was cleared so the next start can retry."
fi

rm -f "$list"
unset -f clear_data_dir
unset -f fail
echo "Restore finished"
