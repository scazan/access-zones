# access-zones

A flexible, high-performance role-based access control (RBAC) library with zone-based permissions using efficient bitfield operations.

[![npm version](https://badge.fury.io/js/access-zones.svg)](https://badge.fury.io/js/access-zones)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Role Aggregation**: Combine multiple roles with OR logic for flexible inheritance
- **High Performance**: Bitfield operations for O(1) permission checking
- **Zone-Based**: Organize permissions by functional areas (content, users, admin, etc.)
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Zero Dependencies**: No runtime dependencies
- **Database-Agnostic**: Works with any database or ORM

## Installation

```bash
npm install access-zones
# or
yarn add access-zones
# or
pnpm add access-zones
```

## Quick Start

```typescript
import {
  checkPermission,
  assertAccess,
  PERMISSION_MASKS
} from 'access-zones';

// Define user roles with zone-based permissions
const userRoles = [
  {
    id: 'editor',
    name: 'Content Editor',
    access: {
      content: PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE,
      users: PERMISSION_MASKS.READ
    }
  }
];

// Check if user can update content
const canEdit = checkPermission(
  { content: PERMISSION_MASKS.UPDATE },
  userRoles
); // true

// Assert permissions (throws AccessControlException if insufficient)
assertAccess({ content: PERMISSION_MASKS.READ }, userRoles);
```

## Core Concepts

### Permission Masks

Permissions use bitfield operations for maximum efficiency:

```typescript
import { PERMISSION_MASKS } from 'access-zones';

PERMISSION_MASKS.ADMIN   // 0b10000 (16) - Admin permission
PERMISSION_MASKS.CREATE  // 0b01000 (8)  - Can create new items
PERMISSION_MASKS.READ    // 0b00100 (4)  - Can read/view items
PERMISSION_MASKS.UPDATE  // 0b00010 (2)  - Can modify items
PERMISSION_MASKS.DELETE  // 0b00001 (1)  - Can delete items
```

Combine permissions with bitwise OR:

```typescript
// Read + Update permissions
const editorPermissions = PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE; // 6

// All CRUD permissions
const allCrud = PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ |
                PERMISSION_MASKS.UPDATE | PERMISSION_MASKS.DELETE; // 15

// Full permissions including admin
const fullPermissions = allCrud | PERMISSION_MASKS.ADMIN; // 31
```

### Access Zones

Zones represent functional areas of your application:

```typescript
const role = {
  id: 'moderator',
  name: 'Moderator',
  access: {
    content: PERMISSION_MASKS.ADMIN,      // Full access to content
    users: PERMISSION_MASKS.READ,          // Can view users
    billing: 0                             // No access to billing
  }
};
```

### Role Aggregation

When a user has multiple roles, permissions are combined using OR logic:

```typescript
import { collapseRoles } from 'access-zones';

const roles = [
  { id: '1', name: 'Viewer', access: { content: PERMISSION_MASKS.READ } },
  { id: '2', name: 'Editor', access: { content: PERMISSION_MASKS.UPDATE } }
];

const combined = collapseRoles(roles);
// { content: 6 } - READ (4) | UPDATE (2)
```

## API Reference

### Permission Checking

#### `checkPermission(needed, roles)`

Check if roles satisfy the required permissions. The `needed` parameter accepts a single permission object or an array of permission objects. When an array is passed, access is granted if **any** item in the array passes (OR logic).

```typescript
import { checkPermission, PERMISSION_MASKS } from 'access-zones';

const roles = [{ id: '1', name: 'Editor', access: { content: 6 } }];

// Single permission object
checkPermission({ content: PERMISSION_MASKS.READ }, roles);   // true
checkPermission({ content: PERMISSION_MASKS.DELETE }, roles); // false

// Array of permissions (OR logic) — passes if ANY item matches
checkPermission([
  { content: PERMISSION_MASKS.DELETE },  // fails
  { content: PERMISSION_MASKS.READ },    // passes
], roles); // true

// Each array item still requires ALL its zones to pass (AND within OR)
checkPermission([
  { content: PERMISSION_MASKS.READ, admin: PERMISSION_MASKS.ADMIN }, // fails — user lacks admin:ADMIN
  { content: PERMISSION_MASKS.READ },                                // passes
], roles); // true
```

#### `assertAccess(needed, roles)`

Assert permissions, throwing `AccessControlException` if insufficient. Also accepts an array of permissions with OR logic.

```typescript
import { assertAccess, PERMISSION_MASKS } from 'access-zones';

try {
  assertAccess({ content: PERMISSION_MASKS.DELETE }, roles);
} catch (error) {
  // AccessControlException: Not authenticated
}

// With array — does not throw if any item passes
assertAccess([
  { content: PERMISSION_MASKS.DELETE },
  { content: PERMISSION_MASKS.READ },
], roles); // OK — second item passes
```

#### `assertDataAccess(data, needed, user)`

Check access to a specific data item, considering ownership. Also accepts an array of permissions with OR logic.

```typescript
import { assertDataAccess, PERMISSION_MASKS } from 'access-zones';

const data = { userId: 'user-123' };
const user = { id: 'user-123', roles: [], access: {} };

// Returns true - user owns the data
assertDataAccess(data, { content: PERMISSION_MASKS.UPDATE }, user);
```

### Role Management

#### `collapseRoles(roles)`

Combine multiple roles into a single permission set using OR logic.

```typescript
import { collapseRoles } from 'access-zones';

const permissions = collapseRoles(userRoles);
// { content: 14, users: 4 }
```

#### `normalizeRole(role)` / `normalizeRoles(roles)`

Transform roles from database format to normalized format.

```typescript
import { normalizeRole } from 'access-zones';

const dbRole = {
  id: '1',
  name: 'Editor',
  access: [
    { zone: { id: 'z1', name: 'content' }, permission: 6 }
  ]
};

const normalized = normalizeRole(dbRole);
// { id: '1', name: 'Editor', access: { content: 6 } }
```

#### `userHasRole(user, roleName)`

Check if a user has a specific role.

```typescript
import { userHasRole } from 'access-zones';

userHasRole(user, 'Admin');      // true/false
userHasAnyRole(user, ['Admin', 'Editor']);  // true if any match
userHasAllRoles(user, ['Admin', 'Editor']); // true if all match
```

### Bitfield Utilities

#### `toBitField(permission)` / `fromBitField(bitField)`

Convert between permission objects and bitfields.

```typescript
import { toBitField, fromBitField } from 'access-zones';

const bitField = toBitField({ create: true, read: true, update: false, delete: false });
// 12 (CREATE | READ)

const permission = fromBitField(12);
// { create: true, read: true, update: false, delete: false }
```

#### `hasPermission(bitField, mask)`

Check if a bitfield includes a specific permission.

```typescript
import { hasPermission, PERMISSION_MASKS } from 'access-zones';

hasPermission(6, PERMISSION_MASKS.READ);   // true (6 = READ | UPDATE)
hasPermission(6, PERMISSION_MASKS.DELETE); // false
```

#### `combinePermissions(...bitFields)`

Combine multiple permission bitfields.

```typescript
import { combinePermissions, PERMISSION_MASKS } from 'access-zones';

const combined = combinePermissions(
  PERMISSION_MASKS.READ,
  PERMISSION_MASKS.UPDATE
); // 6
```

### Zone Utilities

#### `getUserZones(user)`

Get all zones a user has any permissions for.

```typescript
import { getUserZones } from 'access-zones';

getUserZones(user); // ['content', 'users', 'admin']
```

#### `getUserZonesWithPermission(user, permissionType)`

Get zones where user has a specific permission.

```typescript
import { getUserZonesWithPermission } from 'access-zones';

getUserZonesWithPermission(user, 'create'); // ['content']
getUserZonesWithPermission(user, 'read');   // ['content', 'users']
```

### Item-Level Access

#### `getUserPermissions(user, item, zoneKey)`

Get user's permissions for a specific item, considering item-level access settings.

```typescript
import { getUserPermissions } from 'access-zones';

const item = {
  uid: 'owner-123',
  settings: {
    access: {
      global: PERMISSION_MASKS.READ,  // Everyone can read
      users: [
        { uid: 'special-user', access: PERMISSION_MASKS.ADMIN }
      ]
    }
  }
};

getUserPermissions(user, item, 'content');
// Returns Permission object based on ownership, user-specific, or global settings
```

## Types

The library exports the following TypeScript types:

```typescript
import type {
  // Permission types
  Permission,              // { create, read, update, delete, admin: boolean }
  AccessZonePermission,         // Partial<Record<string, number>>
  AccessZonePermissionInput,    // AccessZonePermission | AccessZonePermission[]
  ZonePermissions,         // Record<string, Permission>
  ItemAccessSettings,      // Item-level access configuration
  AccessControlledItem,    // Item with access settings

  // Role types
  AccessRole,              // { id: string, name: string }
  AccessZone,              // { id: string, name: string }
  AccessRolePermissionOnAccessZone,  // Role-zone-permission junction

  // User types
  NormalizedRole,          // Role with access as Record<string, number>
  UserWithRoles,           // User with normalized roles
  UserWithZonePermissions, // User with computed zone permissions
} from 'access-zones';
```

## Database Integration

The library is database-agnostic. Here's an example with a typical schema:

```typescript
// Your database models can have any additional fields
const dbRole = {
  id: 'role-1',
  name: 'Editor',
  description: 'Can edit content',  // Extra field - ignored by RBAC
  createdAt: new Date(),            // Extra field - ignored by RBAC
  access: [
    { zone: { id: 'z1', name: 'content' }, permission: 6 }
  ]
};

// Normalize for RBAC operations
const role = normalizeRole(dbRole);
// { id: 'role-1', name: 'Editor', access: { content: 6 } }
```

## Security

The library includes multiple layers of security protection:

### Bitfield Validation
All permission bitfields are validated to prevent:
- Negative numbers (e.g., `-1` which has all bits set)
- Values exceeding 32-bit limit
- Non-integer values (floats, NaN, Infinity)
- Type coercion attacks (strings, booleans, objects)

### Zone Name Validation
Zone names are validated to prevent prototype pollution and method override attacks:

```typescript
// These zone names are REJECTED:
'__proto__'      // Prototype pollution
'constructor'    // Constructor override
'toString'       // Method override
'_internal'      // Underscore prefix
'settings_'      // Underscore suffix
''               // Empty string
```

### Null-Prototype Objects
Permission objects use `Object.create(null)` internally to prevent prototype chain attacks.

### Validation Functions

```typescript
import {
  isValidZoneName,
  validateZoneName,
  isValidBitField,
  validateBitField,
  createSafeObject
} from 'access-zones';

// Check if a zone name is valid
isValidZoneName('content');     // true
isValidZoneName('__proto__');   // false

// Validate with exception
validateZoneName('content');    // OK
validateZoneName('__proto__');  // throws AccessControlException

// Create safe objects for your own use
const safeObj = createSafeObject<Record<string, number>>();
```

## Error Handling

The library throws `AccessControlException` for permission failures:

```typescript
import { assertAccess, AccessControlException } from 'access-zones';

try {
  assertAccess({ admin: PERMISSION_MASKS.ADMIN }, userRoles);
} catch (error) {
  if (error instanceof AccessControlException) {
    console.log(error.status);  // 'unauthorized'
    console.log(error.message); // 'Not authenticated'
  }
}
```

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our GitHub repository.

## License

MIT © [Scott Cazan](https://github.com/scazan)
