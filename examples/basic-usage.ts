import {
  checkPermission,
  assertAccess,
  PERMISSION_MASKS,
  collapseRoles,
  getGlobalPermissions,
  NormalizedRole,
  UserWithRoles
} from 'access-zones';

// Example: Content Management System

// Define roles - only id, name, and access are required for RBAC functionality
const editorRole: NormalizedRole = {
  id: 'editor',
  name: 'Content Editor',
  access: {
    content: PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE,
    files: PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE,
    users: PERMISSION_MASKS.READ
  }
};

const moderatorRole: NormalizedRole = {
  id: 'moderator', 
  name: 'Content Moderator',
  access: {
    content: PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE | PERMISSION_MASKS.DELETE,
    reports: PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE
  }
};

// Create user with multiple roles
const user: UserWithRoles = {
  id: 'user123',
  roles: [editorRole, moderatorRole]
};

// Example 1: Check specific permissions
console.log('=== Permission Checking ===');

const canCreateContent = checkPermission(
  { content: PERMISSION_MASKS.CREATE },
  user.roles
);
console.log('Can create content:', canCreateContent); // true

const canDeleteUsers = checkPermission(
  { users: PERMISSION_MASKS.DELETE },
  user.roles
);
console.log('Can delete users:', canDeleteUsers); // false

// Example 2: Check multiple permissions at once
const canManageContent = checkPermission(
  { 
    content: PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE,
    files: PERMISSION_MASKS.READ 
  },
  user.roles
);
console.log('Can manage content and read files:', canManageContent); // true

// Example 3: Assert permissions (throws if insufficient)
console.log('\n=== Permission Assertions ===');

try {
  assertAccess({ content: PERMISSION_MASKS.UPDATE }, user.roles);
  console.log('✓ User can update content');
} catch (error) {
  console.log('✗ User cannot update content');
}

try {
  assertAccess({ admin: PERMISSION_MASKS.READ }, user.roles);
  console.log('✓ User can access admin');
} catch (error) {
  console.log('✗ User cannot access admin'); // This will be caught
}

// Example 4: Get all user permissions
console.log('\n=== User Permissions Overview ===');

const allPermissions = getGlobalPermissions(user);
console.log('All user permissions:', JSON.stringify(allPermissions, null, 2));

// Example 5: Role combination
console.log('\n=== Role Combination ===');

const combinedAccess = collapseRoles(user.roles);
console.log('Combined access levels:', combinedAccess);

// Example 6: Working with custom zones
console.log('\n=== Custom Zones ===');

const customRole: NormalizedRole = {
  id: 'inventory-manager',
  name: 'Inventory Manager', 
  access: {
    products: PERMISSION_MASKS.ADMIN,
    orders: PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE,
    inventory: PERMISSION_MASKS.ADMIN,
    analytics: PERMISSION_MASKS.READ
  }
};

const inventoryUser: UserWithRoles = {
  id: 'inv-user',
  roles: [customRole]
};

const canManageInventory = checkPermission(
  { 
    products: PERMISSION_MASKS.CREATE,
    inventory: PERMISSION_MASKS.UPDATE 
  },
  inventoryUser.roles
);
console.log('Can manage inventory:', canManageInventory); // true
