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
- 🎯 **Focused**: Validates only permission-related fields, allowing flexible database schemas
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
  PERMISSION_MASKS
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

Define your own zones based on your application's functional areas:

```typescript
// Define zones that make sense for your application
const myAppZones = ['content', 'users', 'admin', 'billing', 'reports'];

// Use them in your roles
const role = {
  id: 'editor',
  name: 'Content Editor', 
  access: {
    content: PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE,
    users: PERMISSION_MASKS.READ
  }
};
```

### Role Structure

```typescript
interface NormalizedRole {
  id: string;
  name: string;
  access: Record<string, number>; // zone name -> permission bitfield
}
```

## Validation

The library uses a focused validation approach:

- **Core Fields Only**: Zod schemas validate only permission-related fields (`id`, `name`, `permission`)
- **Optional Database Fields**: Fields like `description`, `createdAt`, `updatedAt` are optional in TypeScript interfaces
- **Flexible Schemas**: Your database can include any additional fields without affecting RBAC functionality

```typescript
// ✅ Minimal role - only required fields
const minimalRole = {
  id: 'editor',
  name: 'Content Editor',
  access: { content: PERMISSION_MASKS.READ }
};

// ✅ Extended role - with optional database fields
const extendedRole = {
  id: 'editor',
  name: 'Content Editor',
  description: 'Can edit content', // Optional: not validated by RBAC
  createdAt: new Date(),           // Optional: not validated by RBAC
  updatedAt: new Date(),           // Optional: not validated by RBAC
  access: { content: PERMISSION_MASKS.READ }
};
```

This approach keeps the library focused on permissions while allowing flexible database schemas.

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
