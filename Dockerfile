# syntax=docker/dockerfile:1.7
# Quantum Pond — Coolify production image (npm only)

############################
# Stage 1: Composer vendor #
############################
FROM composer:2 AS vendor

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-progress \
    --no-scripts \
    --prefer-dist \
    --ignore-platform-reqs

############################
# Stage 2: Frontend assets #
############################
FROM php:8.4-cli-bookworm AS frontend

COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/
RUN install-php-extensions bcmath exif gd intl mbstring pcntl pdo_mysql zip @composer

# Node 22 binaries only (avoid copying entire Node /usr/local over PHP)
COPY --from=node:22-bookworm-slim /usr/local/bin/node /usr/local/bin/node
COPY --from=node:22-bookworm-slim /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -sf ../lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -sf ../lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx \
    && node -v && npm -v

WORKDIR /app

ENV CI=true \
    APP_ENV=production \
    APP_KEY=base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= \
    VITE_APP_NAME="Quantum Pond"

COPY composer.json composer.lock ./
COPY --from=vendor /app/vendor ./vendor

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN cp .env.example .env \
    && composer dump-autoload --classmap-authoritative --no-dev --no-interaction \
    && php artisan wayfinder:generate --with-form --no-interaction \
    && npm run build \
    && rm -f .env \
    && rm -rf node_modules

############################
# Stage 3: Production runtime
############################
FROM php:8.4-fpm-bookworm AS production

COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/
RUN install-php-extensions \
    bcmath \
    exif \
    gd \
    intl \
    mbstring \
    pcntl \
    pdo_mysql \
    zip \
    opcache \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    nginx \
    procps \
    supervisor \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f /etc/nginx/sites-enabled/default

WORKDIR /var/www

COPY --from=frontend --chown=www-data:www-data /app /var/www

COPY docker/php.ini /usr/local/etc/php/conf.d/99-production.ini
COPY docker/php-fpm.conf /usr/local/etc/php-fpm.d/zz-production.conf
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/application-entrypoint

RUN chmod 0755 /usr/local/bin/application-entrypoint \
    && mkdir -p /run/nginx /var/log/supervisor \
    /var/www/storage/framework/cache/data \
    /var/www/storage/framework/sessions \
    /var/www/storage/framework/testing \
    /var/www/storage/framework/views \
    /var/www/storage/logs \
    /var/www/storage/app/public \
    /var/www/bootstrap/cache \
    && chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

ENV QUEUE_CONNECTION=database \
    QUEUE_NAMES=default \
    QUEUE_SLEEP=3 \
    QUEUE_TRIES=3 \
    QUEUE_TIMEOUT=600 \
    QUEUE_MAX_TIME=3600 \
    QUEUE_MEMORY=128 \
    QUEUE_PROCESSES=1

EXPOSE 80

# Longer grace: Coolify waits for nginx after entrypoint artisan commands
HEALTHCHECK --interval=15s --timeout=5s --start-period=120s --retries=10 \
    CMD curl -fsS --max-time 5 http://127.0.0.1/up >/dev/null || exit 1

ENTRYPOINT ["/usr/local/bin/application-entrypoint"]
CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
