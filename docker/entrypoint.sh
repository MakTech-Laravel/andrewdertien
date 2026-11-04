#!/bin/sh
set -eu

cd /var/www

if [ -z "${APP_KEY:-}" ]; then
    echo "ERROR: APP_KEY must be configured before the container starts." >&2
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

# Link public storage if missing (safe if already linked)
su -s /bin/sh www-data -c 'php artisan storage:link --no-interaction' || true

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    su -s /bin/sh www-data -c 'php artisan migrate --force --no-interaction'
fi

su -s /bin/sh www-data -c 'php artisan config:cache --no-interaction'
su -s /bin/sh www-data -c 'php artisan route:cache --no-interaction'
su -s /bin/sh www-data -c 'php artisan view:cache --no-interaction'

exec "$@"
