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
COPY --from=node:22-bookworm-slim /usr/local/ /usr/local/

WORKDIR /var/www

ENV CI=true \
    APP_ENV=production \
    APP_KEY=base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= \
    VITE_APP_NAME="Quantum Pond" \
    DB_CONNECTION=sqlite \
    DB_DATABASE=:memory: \
    TELESCOPE_ENABLED=false \
    CACHE_STORE=array \
    SESSION_DRIVER=array \
    QUEUE_CONNECTION=sync

COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-progress \
    --no-scripts \
    --prefer-dist

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_APP_NAME="Quantum Pond"
ARG VITE_ERROR_BOUNDARY_DEBUG=false

ENV VITE_APP_NAME=${VITE_APP_NAME} \
    VITE_ERROR_BOUNDARY_DEBUG=${VITE_ERROR_BOUNDARY_DEBUG}

RUN composer dump-autoload --classmap-authoritative --no-dev --no-interaction \
    && cp .env.example .env \
    && php artisan wayfinder:generate --with-form --no-interaction \
    && npm run build \
    && rm -f .env \
    && rm -rf node_modules

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

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD ["curl", "--fail", "--silent", "--show-error", "--max-time", "5", "--output", "/dev/null", "http://127.0.0.1/up"]

ENTRYPOINT ["/usr/local/bin/application-entrypoint"]
CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
