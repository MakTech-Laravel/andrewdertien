FROM php:8.4-fpm-bookworm AS build

# Redis pecl + libpq-dev intentionally omitted (no Redis/Postgres currently).
# To restore Redis: pecl install redis && docker-php-ext-enable redis
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        $PHPIZE_DEPS \
        git \
        libfreetype6-dev \
        libicu-dev \
        libjpeg62-turbo-dev \
        libonig-dev \
        libpng-dev \
        libwebp-dev \
        libzip-dev \
        unzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j"$(nproc)" bcmath exif gd intl mbstring pcntl pdo_mysql zip \
    && docker-php-ext-enable opcache \
    && rm -rf /var/lib/apt/lists/* /tmp/pear

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
COPY --from=node:24-bookworm-slim /usr/local/ /usr/local/

WORKDIR /var/www

ENV CI=true

COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-progress \
    --no-scripts \
    --prefer-dist

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
# Avoid `corepack enable` here: Node is copied into the PHP image and corepack
# fails looking for missing yarn shims under /usr/local/bin.
RUN npm install -g pnpm@12.11.2 \
    && pnpm install --frozen-lockfile

COPY . .

ARG VITE_APP_NAME=Laravel
ARG VITE_ERROR_BOUNDARY_DEBUG=false
# --- Optional: Reverb (not used currently) ---
# ARG VITE_REVERB_APP_KEY
# ARG VITE_REVERB_HOST
# ARG VITE_REVERB_PORT=443
# ARG VITE_REVERB_SCHEME=https
# --- Removed: Firebase / PWA ---
# ARG VITE_FIREBASE_API_KEY
# ARG VITE_FIREBASE_AUTH_DOMAIN
# ARG VITE_FIREBASE_PROJECT_ID
# ARG VITE_FIREBASE_STORAGE_BUCKET
# ARG VITE_FIREBASE_MESSAGING_SENDER_ID
# ARG VITE_FIREBASE_APP_ID
# ARG VITE_FIREBASE_MEASUREMENT_ID
# ARG VITE_FIREBASE_VAPID_KEY

ENV VITE_APP_NAME=${VITE_APP_NAME} \
    VITE_ERROR_BOUNDARY_DEBUG=${VITE_ERROR_BOUNDARY_DEBUG}
# VITE_REVERB_APP_KEY=${VITE_REVERB_APP_KEY} \
# VITE_REVERB_HOST=${VITE_REVERB_HOST} \
# VITE_REVERB_PORT=${VITE_REVERB_PORT} \
# VITE_REVERB_SCHEME=${VITE_REVERB_SCHEME} \
# VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY} \
# VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN} \
# VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID} \
# VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET} \
# VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID} \
# VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID} \
# VITE_FIREBASE_MEASUREMENT_ID=${VITE_FIREBASE_MEASUREMENT_ID} \
# VITE_FIREBASE_VAPID_KEY=${VITE_FIREBASE_VAPID_KEY}

RUN composer dump-autoload --classmap-authoritative --no-dev --no-interaction \
    && pnpm run build

FROM php:8.4-fpm-bookworm AS production

# PostgreSQL apt repo + client intentionally omitted (MySQL/SQLite only).
# To restore: install gnupg, add PGDG key/list, then install libpq5 + postgresql-client.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        libfreetype6 \
        libicu72 \
        libjpeg62-turbo \
        libonig5 \
        libpng16-16 \
        libwebp7 \
        libzip4 \
        nano \
        nginx \
        procps \
        supervisor \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f /etc/nginx/sites-enabled/default

COPY --from=build /usr/local/lib/php/extensions/ /usr/local/lib/php/extensions/
COPY --from=build /usr/local/etc/php/conf.d/ /usr/local/etc/php/conf.d/
COPY --from=build --chown=www-data:www-data /var/www /var/www

COPY docker/php.ini /usr/local/etc/php/conf.d/99-production.ini
COPY docker/php-fpm.conf /usr/local/etc/php-fpm.d/zz-production.conf
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/application-entrypoint

RUN chmod 0755 /usr/local/bin/application-entrypoint \
    && mkdir -p /run/nginx /var/log/supervisor \
    && chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

WORKDIR /var/www

# Queue uses database (Redis not installed). Horizon/Pulse not in this project.
ENV QUEUE_CONNECTION=database \
    QUEUE_NAMES=default \
    QUEUE_SLEEP=3 \
    QUEUE_TRIES=3 \
    QUEUE_TIMEOUT=600 \
    QUEUE_MAX_TIME=3600 \
    QUEUE_MEMORY=128 \
    QUEUE_PROCESSES=1
# --- Removed: Firebase / PWA ---
# FCM_SW_SHOW_NOTIFICATION=false \
# PWA_SW_ENABLED=true

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD ["curl", "--fail", "--silent", "--show-error", "--max-time", "5", "--output", "/dev/null", "http://127.0.0.1/up"]

ENTRYPOINT ["/usr/local/bin/application-entrypoint"]
CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
