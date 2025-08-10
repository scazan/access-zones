/**
 * Access control error types
 */
export interface AccessControlError {
  message: string;
  status: 'unauthorized' | 'forbidden' | 'invalid_permission';
  code?: string;
}

/**
 * Custom error class for access control violations
 */
export class AccessControlException extends Error {
  public readonly status: AccessControlError['status'];
  public readonly code?: string;

  constructor(error: AccessControlError) {
    super(error.message);
    this.name = 'AccessControlException';
    this.status = error.status;
    this.code = error.code;
  }
}