import { PERMISSION_MASKS } from '../constants/masks';
import { Permission } from '../types/permissions';
import { validateBitField } from './validation';

/**
 * Convert UPPER_SNAKE_CASE to camelCase at the type level.
 * e.g. "INVITE_MEMBERS" → "inviteMembers"
 */
type SnakeToCamel<S extends string> =
  S extends `${infer Head}_${infer Tail}`
    ? `${Lowercase<Head>}${SnakeToCamel<Capitalize<Lowercase<Tail>>>}`
    : Lowercase<S>;

type ExtendedPermissionConfig = Record<string, { label: string }>;

type ExtendedPermissionObject<T extends ExtendedPermissionConfig> = Permission & {
  [K in keyof T as SnakeToCamel<K & string>]: boolean;
};

type ExtendedLabels<T extends ExtendedPermissionConfig> = Record<
  keyof Permission | SnakeToCamel<keyof T & string>,
  string
>;

type ExtendedMasks<T extends ExtendedPermissionConfig> = {
  [K in keyof T]: number;
};

const MAX_EXTENDED_PERMISSIONS = 27; // bits 5–31
const FIRST_EXTENDED_BIT = 5;

const BASE_ACRUD_KEYS: Array<keyof Permission> = ['admin', 'create', 'read', 'update', 'delete'];
const BASE_ACRUD_LABELS: Record<keyof Permission, string> = {
  admin: 'Admin',
  create: 'Create',
  read: 'Read',
  update: 'Update',
  delete: 'Delete',
};

function snakeToCamel(s: string): string {
  return s
    .toLowerCase()
    .replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

export function defineExtendedPermissions<T extends ExtendedPermissionConfig>(config: T) {
  const keys = Object.keys(config) as Array<keyof T & string>;

  if (keys.length > MAX_EXTENDED_PERMISSIONS) {
    throw new Error(
      `Too many extended permissions: ${keys.length}. Maximum is ${MAX_EXTENDED_PERMISSIONS} (bits 5–31).`,
    );
  }

  // Build masks: first key → bit 5 (32), second → bit 6 (64), etc.
  const masks = {} as ExtendedMasks<T>;
  const camelToMask: Array<{ camel: string; mask: number }> = [];
  let extendedBitsMask = 0;

  for (let i = 0; i < keys.length; i++) {
    const mask = 1 << (FIRST_EXTENDED_BIT + i);
    (masks as Record<string, number>)[keys[i]] = mask;
    camelToMask.push({ camel: snakeToCamel(keys[i]), mask });
    extendedBitsMask |= mask;
  }

  // CRUD bits mask (bits 0–3, excluding admin at bit 4)
  const crudBitsMask =
    PERMISSION_MASKS.CREATE | PERMISSION_MASKS.READ | PERMISSION_MASKS.UPDATE | PERMISSION_MASKS.DELETE;

  // Labels: base ACRUD + extended
  const labels = { ...BASE_ACRUD_LABELS } as ExtendedLabels<T>;
  for (const key of keys) {
    (labels as Record<string, string>)[snakeToCamel(key)] = config[key].label;
  }

  function toBitField(obj: ExtendedPermissionObject<T>): number {
    let bits = 0;

    // Base ACRUD bits
    if (obj.admin) bits |= PERMISSION_MASKS.ADMIN;
    if (obj.create) bits |= PERMISSION_MASKS.CREATE;
    if (obj.read) bits |= PERMISSION_MASKS.READ;
    if (obj.update) bits |= PERMISSION_MASKS.UPDATE;
    if (obj.delete) bits |= PERMISSION_MASKS.DELETE;

    // Extended bits
    for (const { camel, mask } of camelToMask) {
      if ((obj as Record<string, boolean>)[camel]) {
        bits |= mask;
      }
    }

    return bits;
  }

  function fromBitField(bitField: number): ExtendedPermissionObject<T> {
    validateBitField(bitField, 'extended permission bitfield');

    const result: Record<string, boolean> = {
      admin: (bitField & PERMISSION_MASKS.ADMIN) !== 0,
      create: (bitField & PERMISSION_MASKS.CREATE) !== 0,
      read: (bitField & PERMISSION_MASKS.READ) !== 0,
      update: (bitField & PERMISSION_MASKS.UPDATE) !== 0,
      delete: (bitField & PERMISSION_MASKS.DELETE) !== 0,
    };

    for (const { camel, mask } of camelToMask) {
      result[camel] = (bitField & mask) !== 0;
    }

    return result as ExtendedPermissionObject<T>;
  }

  return {
    masks,
    toBitField,
    fromBitField,
    labels,
    extendedBitsMask,
    crudBitsMask,
  };
}
