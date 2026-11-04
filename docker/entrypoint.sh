#!/bin/sh
set -eu

cd /var/www

if [ -z "${APP_KEY:-}" ]; then
    echo "ERROR: APP_KEY must be set in Coolify environment variables." >&2
    exit 1
fi

mkdir -p \
    bootstrap/cache \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/testing \
    storage/framework/views \
    storage/logs \
    storage/app/public

chown -R www-data:www-data storage bootstrap/cache
chmod -R u=rwX,g=rwX,o=rX storage bootstrap/cache

# Public disk link (ignore if already exists)
su -s /bin/sh www-data -c 'php artisan storage:link --no-interaction' >/dev/null 2>&1 || true

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    echo "Running migrations..."
    su -s /bin/sh www-data -c 'php artisan migrate --force --no-interaction'
fi

echo "Caching Laravel config/routes/views..."
su -s /bin/sh www-data -c 'php artisan config:cache --no-interaction'
su -s /bin/sh www-data -c 'php artisan route:cache --no-interaction'
su -s /bin/sh www-data -c 'php artisan view:cache --no-interaction'

echo "Starting application..."
exec "$@"
