#!/bin/sh
set -u

cd /var/www

if [ -z "${APP_KEY:-}" ]; then
    echo "ERROR: APP_KEY must be set in Coolify (Runtime only)." >&2
    exit 1
fi

mkdir -p \
    bootstrap/cache \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/testing \
    storage/framework/views \
    storage/logs \
    storage/app/public \
    /run/nginx \
    /run/php

chown -R www-data:www-data storage bootstrap/cache
chmod -R u=rwX,g=rwX,o=rX storage bootstrap/cache

# Non-fatal setup (DB may be briefly unavailable on first boot)
su -s /bin/sh www-data -c 'php artisan storage:link --no-interaction' >/dev/null 2>&1 || true

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    echo "Running migrations..."
    su -s /bin/sh www-data -c 'php artisan migrate --force --no-interaction' \
        || echo "WARNING: migrate failed — check DB_* env vars. Continuing startup."
fi

echo "Caching Laravel config/routes/views..."
su -s /bin/sh www-data -c 'php artisan config:cache --no-interaction' \
    || echo "WARNING: config:cache failed. Continuing startup."
su -s /bin/sh www-data -c 'php artisan route:cache --no-interaction' \
    || echo "WARNING: route:cache failed. Continuing startup."
su -s /bin/sh www-data -c 'php artisan view:cache --no-interaction' \
    || echo "WARNING: view:cache failed. Continuing startup."

echo "Starting php-fpm + nginx + queue/scheduler..."
exec "$@"
