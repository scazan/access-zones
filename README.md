# access-zones

A flexible, high-performance role-based access control (RBAC) library with zone-based permissions using efficient bitfield operations.

[![npm version](https://badge.fury.io/js/access-zones.svg)](https://badge.fury.io/js/access-zones)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🚀 **High Performance**: Bitfield operations for O(1) permission checking
- 🎯 **Zone-Based**: Organize permissions by functional areas (content, users, admin, etc.)
- 🔄 **Role Aggregation**: Combine multiple roles with OR logic for flexible inheritance
- 🛡️ **Type-Safe**: Full TypeScript support with comprehensive type definitions
- 📦 **Zero Dependencies**: Only requires Zod for runtime validation
- 🧪 **Well Tested**: 100% test coverage with comprehensive edge cases
- 🔧 **Flexible**: Database-agnostic core with customizable zones
- 📚 **Well Documented**: Complete API documentation with examples

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
  PERMISSION_MASKS,
  DEFAULT_ACCESS_ZONES 
} from 'access-zones';

// Define user roles
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

// Check permissions
const canEditContent = checkPermission(
  { content: PERMISSION_MASKS.UPDATE },
  userRoles
);

// Assert permissions (throws if insufficient)
assertAccess({ content: PERMISSION_MASKS.READ }, userRoles);
```

## Core Concepts

### Permission Masks

Permissions use bitfield operations for maximum efficiency:

```typescript
import { PERMISSION_MASKS } from 'access-zones';

PERMISSION_MASKS.CREATE  // 0b1000 (8)  - Can create new items
PERMISSION_MASKS.READ    // 0b0100 (4)  - Can read/view items  
PERMISSION_MASKS.UPDATE  // 0b0010 (2)  - Can modify items
PERMISSION_MASKS.DELETE  // 0b0001 (1)  - Can delete items
PERMISSION_MASKS.ADMIN   // 0b1111 (15) - All permissions
```

### Access Zones

Organize permissions by functional areas:

```typescript
import { DEFAULT_ACCESS_ZONES } from 'access-zones';

// Built-in zones: content, users, admin, settings, reports, 
// billing, support, api, files, notifications
```

### Role Structure

```typescript
interface NormalizedRole {
  id: string;
  name: string;
  access: Record<string, number>; // zone name -> permission bitfield
}
```

## API Reference

### Permission Checking

#### `checkPermission(needed, roles)`

Check if user roles satisfy required permissions across zones.

```typescript
import { checkPermission, PERMISSION_MASKS } from 'access-zones';

const needed = {
  content: PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE,
  admin: PERMISSION_MASKS.READ
};

const hasAccess = checkPermission(needed, userRoles);
// Returns: boolean
```

#### `assertAccess(needed, roles)`

Assert permissions, throwing `AccessControlException` if insufficient.

```typescript
import { assertAccess, AccessControlException } from 'access-zones';

try {
  assertAccess({ content: PERMISSION_MASKS.DELETE }, userRoles);
  // Continues if user has permission
} catch (error) {
  if (error instanceof AccessControlException) {
    console.log(error.status); // 'unauthorized'
    console.log(error.message); // 'Not authenticated'
  }
}
```

#### `assertDataAccess(data, needed, user)`

Check access to specific data items, considering ownership.

```typescript
const data = { userId: 'user123' };
const needed = { content: PERMISSION_MASKS.UPDATE };

// Allows access if user owns the data OR has the required permissions
assertDataAccess(data, needed, user);
```

### Bitfield Operations

#### `toBitField(permission)` / `fromBitField(bitField)`

Convert between permission objects and efficient bitfield numbers.

```typescript
import { toBitField, fromBitField } from 'access-zones';

const permission = { 
  create: true, 
  read: true, 
  update: false, 
  delete: false 
};

const bitField = toBitField(permission); // 12 (8 + 4)
const restored = fromBitField(bitField); // { create: true, read: true, ... }
```

#### `hasPermission(bitField, permission)`

Check if a bitfield contains a specific permission.

```typescript
import { hasPermission, PERMISSION_MASKS } from 'access-zones';

const userPermissions = 12; // CREATE + READ
const canRead = hasPermission(userPermissions, PERMISSION_MASKS.READ); // true
const canDelete = hasPermission(userPermissions, PERMISSION_MASKS.DELETE); // false
```

### Role Management

#### `collapseRoles(roles)`

Combine multiple roles using OR logic - if any role grants access, access is granted.

```typescript
import { collapseRoles } from 'access-zones';

const combinedPermissions = collapseRoles(userRoles);
// Returns: { content: 14, admin: 4, users: 6 }
```

#### `getGlobalPermissions(user)`

Get user's permissions across all zones as boolean objects.

```typescript
import { getGlobalPermissions } from 'access-zones';

const permissions = getGlobalPermissions(user);
// Returns: { 
//   content: { create: true, read: true, update: true, delete: false },
//   admin: { create: false, read: true, update: false, delete: false }
// }
```

#### Role Checking Utilities

```typescript
import { 
  userHasRole, 
  userHasAnyRole, 
  userHasAllRoles,
  getUserZones,
  getUserZonesWithPermission 
} from 'access-zones';

// Check specific role
userHasRole(user, 'Editor'); // boolean

// Check any of multiple roles  
userHasAnyRole(user, ['Editor', 'Admin']); // boolean

// Check all roles required
userHasAllRoles(user, ['Editor', 'Viewer']); // boolean

// Get all zones user has access to
getUserZones(user); // ['content', 'admin', 'users']

// Get zones where user has specific permission
getUserZonesWithPermission(user, 'create'); // ['content']
```

## Advanced Usage

### Custom Zones

Define your own zones for your application:

```typescript
const CUSTOM_ZONES = [
  'products',
  'orders', 
  'inventory',
  'analytics',
  'integrations'
] as const;

type CustomZone = typeof CUSTOM_ZONES[number];

// Use with your custom zones
const permissions: Partial<Record<CustomZone, number>> = {
  products: PERMISSION_MASKS.ADMIN,
  orders: PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE
};
```

### Item-Level Permissions

Control access to individual items with global and user-specific overrides:

```typescript
import { getUserPermissions } from 'access-zones';

const item = {
  uid: 'owner123',
  settings: {
    access: {
      global: PERMISSION_MASKS.READ, // Everyone can read
      users: [
        { uid: 'user456', access: PERMISSION_MASKS.ADMIN } // Specific user gets admin
      ]
    }
  }
};

const userPermissions = getUserPermissions(user, item, 'content');
// Returns permission object based on ownership, user-specific, or global settings
```

### Database Integration

The library is database-agnostic. Here's an example with Prisma:

```typescript
// Your database models
interface DatabaseRole {
  id: string;
  name: string;
  permissions: Array<{
    zone: { name: string };
    permission: number;
  }>;
}

// Transform to library format
function transformRole(dbRole: DatabaseRole): NormalizedRole {
  return {
    id: dbRole.id,
    name: dbRole.name,
    access: dbRole.permissions.reduce((acc, perm) => {
      acc[perm.zone.name] = perm.permission;
      return acc;
    }, {} as Record<string, number>)
  };
}
```

## Multi-Tenancy

The `access-zones` library focuses purely on role-based permissions and does **not** handle multi-tenancy directly. This is by design - tenant isolation should be handled at the database query level for better security and performance.

### Recommended Approach

1. **Database-Level Isolation**: Always filter by `tenantId` in your database queries
2. **Service-Level Enforcement**: Include tenant context in your service methods
3. **RBAC for Permissions**: Use this library for role-based permissions within each tenant

```typescript
// ✅ Good: Tenant isolation at database level
class UserService {
  async getUserPermissions(userId: string, tenantId: string) {
    // Database query automatically filters by tenantId
    const user = await db.user.findUnique({
      where: { id: userId, tenantId },
      include: { roles: { include: { permissions: true } } }
    });
    
    // Transform to RBAC format (no tenant info needed)
    return transformDatabaseUser(user);
  }
  
  async checkPermission(userId: string, tenantId: string, permissions: AccessZonePermission) {
    const user = await this.getUserPermissions(userId, tenantId);
    return checkPermission(permissions, user.roles);
  }
}

// ❌ Avoid: Mixing tenant logic with RBAC
// Don't put tenantId in the RBAC types - handle it in your data layer
```

### Benefits of This Approach

- **Security**: Complete tenant isolation at the database level
- **Performance**: Database indexes can optimize tenant-filtered queries  
- **Simplicity**: RBAC library focuses on permissions, not tenant management
- **Flexibility**: Use any tenant isolation strategy (row-level security, separate schemas, etc.)

See the [database integration example](./examples/database-integration.ts) for a complete implementation.

## Performance

The library is optimized for high-performance applications:

- **O(1) permission checking** using bitwise operations
- **Minimal memory footprint** with bitfield storage
- **Zero runtime dependencies** (except Zod for validation)
- **Tree-shakeable** - only import what you need

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type { 
  Permission,
  AccessZonePermission,
  NormalizedRole,
  UserWithRoles,
  AccessControlException 
} from 'access-zones';
```

## Error Handling

```typescript
import { AccessControlException } from 'access-zones';

try {
  assertAccess(requiredPermissions, userRoles);
} catch (error) {
  if (error instanceof AccessControlException) {
    switch (error.status) {
      case 'unauthorized':
        // User not authenticated
        break;
      case 'forbidden':
        // User authenticated but lacks permission
        break;
      case 'invalid_permission':
        // Invalid permission configuration
        break;
    }
  }
}
```

## Testing

The library includes comprehensive tests:

```bash
npm test              # Run tests
npm run test:watch    # Run tests in watch mode  
npm run test:coverage # Run tests with coverage
```

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our GitHub repository.

## License

MIT © [Scott Cazan](https://github.com/scazan)

## Changelog

### 1.0.0
- Initial release
- Core RBAC functionality with zone-based permissions
- Bitfield operations for high performance
- Full TypeScript support
- Comprehensive test suite
