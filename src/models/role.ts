/**
 * Access role - minimal fields required for RBAC
 */
export interface AccessRole {
  id: string;
  name: string;
}

/**
 * Access roles on users junction table
 */
export interface AccessRolesOnUsers {
  userId: string;
  accessRoleId: string;
}

/**
 * Access roles on pages junction table
 */
export interface AccessRolesOnPages {
  pageId: string;
  accessRoleId: string;
}

/**
 * Access roles on tickets junction table
 */
export interface AccessRolesOnTickets {
  ticketId: string;
  accessRoleId: string;
}
