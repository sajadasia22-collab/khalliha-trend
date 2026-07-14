#!/usr/bin/env bash
# نسخة احتياطية لقاعدة بيانات خلّيها ترند عبر pg_dump (صيغة custom مضغوطة).
#
# الاستخدام:
#   ./scripts/backup-db.sh                 # يقرأ DATABASE_URL من .env في جذر المشروع
#   DATABASE_URL="postgresql://..." ./scripts/backup-db.sh   # أو مرر الرابط مباشرة
#
# الناتج: backups/khalliha-YYYYMMDD-HHMMSS.dump
# الاستعادة: pg_restore --clean --if-exists -d "$DATABASE_URL" backups/<file>.dump
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${ROOT_DIR}/backups"
RETENTION_COUNT="${BACKUP_RETENTION_COUNT:-14}"

if [[ -z "${DATABASE_URL:-}" && -f "${ROOT_DIR}/.env" ]]; then
  DATABASE_URL="$(grep -o 'DATABASE_URL="[^"]*"' "${ROOT_DIR}/.env" | cut -d'"' -f2)"
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "خطأ: DATABASE_URL غير موجود (لا في البيئة ولا في .env)" >&2
  exit 1
fi

# pg_dump يرفض معامل schema في query string الخاص بـ Prisma.
CLEAN_URL="${DATABASE_URL%%\?*}"

mkdir -p "${BACKUP_DIR}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_FILE="${BACKUP_DIR}/khalliha-${STAMP}.dump"

pg_dump --format=custom --no-owner --no-privileges \
  --file="${OUT_FILE}" "${CLEAN_URL}"

echo "تم إنشاء النسخة: ${OUT_FILE} ($(du -h "${OUT_FILE}" | cut -f1))"

# إبقاء آخر N نسخ فقط حتى لا يتضخم المجلد.
ls -1t "${BACKUP_DIR}"/khalliha-*.dump 2>/dev/null | tail -n +"$((RETENTION_COUNT + 1))" | while read -r old; do
  rm -f "${old}"
  echo "حُذفت نسخة قديمة: ${old}"
done
