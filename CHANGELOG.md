# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Breaking Changes
- **Removed Zod dependency** - Replaced with pure TypeScript types
- **Zod schemas are no longer exported** - Use the TypeScript types directly:
  - `PermissionSchema` → `Permission`
  - `AccessZonePermissionSchema` → `AccessZonePermission`
  - `ZonePermissionsSchema` → `ZonePermissions`
  - `ItemAccessSettingsSchema` → `ItemAccessSettings`
  - `AccessControlledItemSchema` → `AccessControlledItem`
  - `AccessRoleSchema` → `AccessRole`
  - `AccessRolesOnUsersSchema` → removed (implementation-specific)
  - `AccessRolesOnPagesSchema` → removed (implementation-specific)
  - `AccessRolesOnTicketsSchema` → removed (implementation-specific)
  - `AccessZoneSchema` → `AccessZone`
  - `AccessRolePermissionOnAccessZoneSchema` → `AccessRolePermissionOnAccessZone`

### Migration
```typescript
// Before
import { PermissionSchema } from 'access-zones';
import { z } from 'zod';
type MyPermission = z.infer<typeof PermissionSchema>;

// After
import type { Permission } from 'access-zones';
```

### Removed
- `zod` dependency
- `AccessRolesOnUsers`, `AccessRolesOnPages`, `AccessRolesOnTickets` types (implementation-specific)
- `siteId` field from `AccessControlledItem` type (implementation-specific)

## [1.0.0] - 2025-08-10

### Added
- Initial release of access-zones
- Core RBAC functionality with zone-based permissions
- Bitfield operations for high-performance permission checking
- Role aggregation with OR logic
- Item-level access control with global and user-specific permissions
- Full TypeScript support with comprehensive type definitions
- Comprehensive test suite with 100% coverage
- Database-agnostic core design
- Support for custom zones and permission structures
- Error handling with custom exception types
- Complete API documentation and examples

### Features
- `checkPermission()` - Check if roles satisfy required permissions
- `assertAccess()` - Assert permissions with exception throwing
- `assertDataAccess()` - Check access to specific data items
- `collapseRoles()` - Combine multiple roles with OR logic
- `getGlobalPermissions()` - Get user permissions across all zones
- `toBitField()` / `fromBitField()` - Convert between permission formats
- `getUserPermissions()` - Get permissions for specific items
- Role checking utilities (`userHasRole`, `userHasAnyRole`, etc.)
- Zone management utilities (`getUserZones`, `getUserZonesWithPermission`)

### Performance
- O(1) permission checking using bitwise operations
- Minimal memory footprint with bitfield storage
- Zero runtime dependencies
- Tree-shakeable exports

### Documentation
- Comprehensive README with examples
- Full API reference
- TypeScript type definitions
- Usage examples for common scenarios
- Integration guides for popular databases
