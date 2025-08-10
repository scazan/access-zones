# PostgreSQL Database Structure for RBAC Zones

This document describes a PostgreSQL database schema designed to work with the `rbac-zones` library for managing role-based access control with zone-based permissions.

## Overview

The database structure supports a flexible RBAC system where:
- **Users** can have multiple **Roles**
- **Roles** define **Permissions** within specific **Zones**
- **Permissions** are stored as bitfield integers for efficient querying
- **Zones** represent different areas/contexts of the application
- **Resources** can be associated with zones and have ownership

## Core Tables

### `users`
Stores user account information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `email` | VARCHAR(255) | Unique email address |
| `name` | VARCHAR(255) | User's display name |
| `site_id` | UUID | Foreign key to sites table (multi-tenancy) |
| `created_at` | TIMESTAMP | Account creation time |
| `updated_at` | TIMESTAMP | Last update time |
| `is_active` | BOOLEAN | Account status |

**Indexes:**
- Primary key on `id`
- Unique index on `email`
- Index on `site_id`

---

### `sites`
Supports multi-tenancy by isolating data per organization/site.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(255) | Organization/site name |
| `domain` | VARCHAR(255) | Optional custom domain |
| `created_at` | TIMESTAMP | Site creation time |
| `is_active` | BOOLEAN | Site status |

**Indexes:**
- Primary key on `id`
- Unique index on `domain`

---

### `zones`
Defines different areas or contexts within the application.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(100) | Zone identifier (e.g., 'content', 'admin', 'billing') |
| `display_name` | VARCHAR(255) | Human-readable zone name |
| `description` | TEXT | Zone description |
| `site_id` | UUID | Foreign key to sites (zones can be site-specific) |
| `is_active` | BOOLEAN | Zone status |
| `created_at` | TIMESTAMP | Creation time |

**Indexes:**
- Primary key on `id`
- Unique index on `(name, site_id)`
- Index on `site_id`

**Example zones:**
- `content` - Content management permissions
- `admin` - Administrative functions
- `billing` - Financial operations
- `analytics` - Data and reporting access
- `user_management` - User administration

---

### `access_roles`
Defines roles that can be assigned to users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(100) | Role identifier (e.g., 'editor', 'admin') |
| `display_name` | VARCHAR(255) | Human-readable role name |
| `description` | TEXT | Role description |
| `site_id` | UUID | Foreign key to sites |
| `is_system_role` | BOOLEAN | Whether this is a built-in system role |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last update time |

**Indexes:**
- Primary key on `id`
- Unique index on `(name, site_id)`
- Index on `site_id`

**Example roles:**
- `super_admin` - Full system access
- `content_editor` - Content creation and editing
- `content_viewer` - Read-only content access
- `billing_admin` - Financial operations
- `user_manager` - User administration

---

### `access_role_permissions_on_zones`
**This is the key table** - stores permission bitfields for each role-zone combination.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `role_id` | UUID | Foreign key to access_roles |
| `zone_id` | UUID | Foreign key to zones |
| `permission` | INTEGER | **Bitfield storing CRUD permissions** |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last update time |

**Indexes:**
- Primary key on `id`
- Unique index on `(role_id, zone_id)`
- Index on `role_id`
- Index on `zone_id`

**Permission Bitfield Values:**
```
CREATE = 8  (0b1000)
READ   = 4  (0b0100)
UPDATE = 2  (0b0010)
DELETE = 1  (0b0001)
ADMIN  = 15 (0b1111) - All permissions
```

**Example data:**
- Content Editor in Content Zone: `permission = 14` (CREATE + READ + UPDATE)
- Content Viewer in Content Zone: `permission = 4` (READ only)
- Admin in Admin Zone: `permission = 15` (All permissions)

---

### `access_roles_on_users`
Junction table linking users to their assigned roles.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to users |
| `role_id` | UUID | Foreign key to access_roles |
| `assigned_by` | UUID | Foreign key to users (who assigned this role) |
| `assigned_at` | TIMESTAMP | When role was assigned |
| `expires_at` | TIMESTAMP | Optional role expiration |
| `is_active` | BOOLEAN | Role assignment status |

**Indexes:**
- Primary key on `id`
- Unique index on `(user_id, role_id)`
- Index on `user_id`
- Index on `role_id`
- Index on `expires_at` (for cleanup queries)

---

## Resource-Specific Permission Tables

### `pages`
Example content resource that can have zone-based permissions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `title` | VARCHAR(255) | Page title |
| `content` | TEXT | Page content |
| `user_id` | UUID | Foreign key to users (owner) |
| `site_id` | UUID | Foreign key to sites |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last update time |
| `is_published` | BOOLEAN | Publication status |

---

### `access_roles_on_pages`
Specific role assignments for individual pages (overrides zone permissions).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `page_id` | UUID | Foreign key to pages |
| `role_id` | UUID | Foreign key to access_roles |
| `permission` | INTEGER | **Bitfield for page-specific permissions** |
| `created_at` | TIMESTAMP | Creation time |

**Indexes:**
- Primary key on `id`
- Unique index on `(page_id, role_id)`
- Index on `page_id`
- Index on `role_id`

---

### `tickets`
Example of another resource type (support tickets).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `title` | VARCHAR(255) | Ticket title |
| `description` | TEXT | Ticket description |
| `status` | VARCHAR(50) | Ticket status |
| `user_id` | UUID | Foreign key to users (creator) |
| `assigned_to` | UUID | Foreign key to users (assignee) |
| `site_id` | UUID | Foreign key to sites |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last update time |

---

### `access_roles_on_tickets`
Role-based permissions for tickets.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `ticket_id` | UUID | Foreign key to tickets |
| `role_id` | UUID | Foreign key to access_roles |
| `permission` | INTEGER | **Bitfield for ticket-specific permissions** |
| `created_at` | TIMESTAMP | Creation time |

---

## Permission Resolution Hierarchy

The system resolves permissions in this order (most specific wins):

1. **Resource-specific permissions** (`access_roles_on_pages`, `access_roles_on_tickets`)
2. **Zone-based permissions** (`access_role_permissions_on_zones`)
3. **Ownership permissions** (if user owns the resource)
4. **Default deny** (no access)

## Integration with RBAC Zones Library

### Data Retrieval Query Example

```sql
-- Get user's roles with zone permissions (for library input)
SELECT 
    ar.id,
    ar.name,
    json_agg(
        json_build_object(
            'zone', json_build_object('name', z.name),
            'permission', arpoz.permission
        )
    ) as access
FROM access_roles ar
JOIN access_roles_on_users arou ON ar.id = arou.role_id
JOIN access_role_permissions_on_zones arpoz ON ar.id = arpoz.role_id
JOIN zones z ON arpoz.zone_id = z.id
WHERE arou.user_id = $1 
  AND arou.is_active = true
  AND (arou.expires_at IS NULL OR arou.expires_at > NOW())
  AND ar.site_id = $2
GROUP BY ar.id, ar.name;
```

This query returns data in the exact format expected by the `rbac-zones` library's `RoleWithAccess` type.

### Permission Checking Flow

1. **Fetch user roles** from database using above query
2. **Normalize roles** using `normalizeRoles()` from library
3. **Check permissions** using `checkPermission()` or `assertAccess()`
4. **Handle ownership** using `assertDataAccess()` for resource-specific checks

### Bitfield Storage Benefits

- **Efficient storage**: Single integer per role-zone combination
- **Fast queries**: Bitwise operations in SQL (`permission & 4 = 4` for READ check)
- **Extensible**: Can add new permission types without schema changes
- **Library compatible**: Direct integration with `rbac-zones` functions

### Example Permission Values

| Permission Combination | Bitfield Value | Binary | Description |
|----------------------|----------------|---------|-------------|
| None | 0 | 0b0000 | No permissions |
| Read only | 4 | 0b0100 | View content |
| Read + Update | 6 | 0b0110 | View and edit |
| Create + Read | 12 | 0b1100 | Create and view |
| Full CRUD | 15 | 0b1111 | All permissions |
| Future: Approve | 16 | 0b10000 | Custom permission |

This database structure provides a robust, scalable foundation for implementing role-based access control with the `rbac-zones` library while supporting multi-tenancy, resource ownership, and future extensibility.