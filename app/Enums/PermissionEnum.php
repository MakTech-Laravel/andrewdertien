<?php

namespace App\Enums;

enum PermissionEnum: string
{
    // DASHBOARD
    case DASHBOARD_VIEW = 'dashboard.view';
    case REPOSITORY_VIEW = 'repository.view';
    case DOCUMENTATION_VIEW = 'documentation.view';

    // FILE UPLOAD
    case FILE_UPLOAD_INDEX = 'file-upload.index';
    case FILE_UPLOAD_STORE = 'file-upload.store';

    // POSTS
    case POSTS_INDEX = 'posts.index';
    case POSTS_VIEW = 'posts.view';
    case POSTS_CREATE = 'posts.create';
    case POSTS_EDIT = 'posts.edit';
    case POSTS_DELETE = 'posts.delete';
    case POSTS_PUBLISH = 'posts.publish';

    // USERS
    case USERS_INDEX = 'users.index';
    case USERS_VIEW = 'users.view';
    case USERS_CREATE = 'users.create';
    case USERS_EDIT = 'users.edit';
    case USERS_DELETE = 'users.delete';

    // ROLES
    case ROLES_INDEX = 'roles.index';
    case ROLES_VIEW = 'roles.view';

    // ADMIN: PONDS, PURCHASES & PAYMENTS
    case ADMIN_DASHBOARD_VIEW = 'admin-dashboard.view';
    case PONDS_INDEX = 'ponds.index';
    case PONDS_CREATE = 'ponds.create';
    case PONDS_EDIT = 'ponds.edit';
    case PONDS_DELETE = 'ponds.delete';
    case PAYMENTS_INDEX = 'payments.index';
    case PAYMENTS_REFUND = 'payments.refund';

    // MEMBER: CHOOSING AND BUYING PONDS
    case MEMBER_PONDS_VIEW = 'member-ponds.view';
    case MEMBER_PONDS_PURCHASE = 'member-ponds.purchase';
    case MEMBER_PAYMENTS_VIEW = 'member-payments.view';

    // PERMISSIONS (developer-defined, read-only — listing & export only)
    case PERMISSIONS_INDEX = 'permissions.index';
    case PERMISSIONS_EXPORT = 'permissions.export';

    // SETTINGS
    case SETTINGS_INDEX = 'settings.index';
    case SETTINGS_VIEW = 'settings.view';
    case SETTINGS_CREATE = 'settings.create';
    case SETTINGS_EDIT = 'settings.edit';
    case SETTINGS_DELETE = 'settings.delete';
    case SETTINGS_IMPORT = 'settings.import';
    case SETTINGS_EXPORT = 'settings.export';
    case SETTINGS_PRINT = 'settings.print';

    // -------------------------------------------------------------------------
    // group() — returns the display group for the `group` DB column.
    // Used by PermissionSeeder and the role management UI (grouped checkboxes).
    // -------------------------------------------------------------------------
    public function group(): string
    {
        return match ($this) {
            self::DASHBOARD_VIEW,
            self::REPOSITORY_VIEW,
            self::DOCUMENTATION_VIEW => 'Dashboard',

            self::FILE_UPLOAD_INDEX,
            self::FILE_UPLOAD_STORE => 'File Upload',

            self::POSTS_INDEX,
            self::POSTS_VIEW,
            self::POSTS_CREATE,
            self::POSTS_EDIT,
            self::POSTS_DELETE,
            self::POSTS_PUBLISH => 'Posts',

            self::USERS_INDEX,
            self::USERS_VIEW,
            self::USERS_CREATE,
            self::USERS_EDIT,
            self::USERS_DELETE => 'Users',

            self::ROLES_INDEX,
            self::ROLES_VIEW => 'Roles',

            self::ADMIN_DASHBOARD_VIEW,
            self::PONDS_INDEX,
            self::PONDS_CREATE,
            self::PONDS_EDIT,
            self::PONDS_DELETE => 'Ponds',

            self::PAYMENTS_INDEX,
            self::PAYMENTS_REFUND => 'Payments',

            self::MEMBER_PONDS_VIEW,
            self::MEMBER_PONDS_PURCHASE,
            self::MEMBER_PAYMENTS_VIEW => 'Member',

            self::PERMISSIONS_INDEX,
            self::PERMISSIONS_EXPORT => 'Permissions',

            self::SETTINGS_INDEX,
            self::SETTINGS_VIEW,
            self::SETTINGS_CREATE,
            self::SETTINGS_EDIT,
            self::SETTINGS_DELETE,
            self::SETTINGS_IMPORT,
            self::SETTINGS_EXPORT,
            self::SETTINGS_PRINT => 'Settings',
        };
    }

    /**
     * Permissions that only make sense for a member buying ponds.
     *
     * @return array<int, self>
     */
    public static function memberOnly(): array
    {
        return [self::MEMBER_PONDS_VIEW, self::MEMBER_PONDS_PURCHASE, self::MEMBER_PAYMENTS_VIEW];
    }

    // -------------------------------------------------------------------------
    // guard() — returns the guard name for this permission.
    // Change to 'api' for Passport API-only apps.
    // -------------------------------------------------------------------------
    public function guard(): string
    {
        return GuardEnum::WEB->value; // change to 'api' for Passport
    }
}
