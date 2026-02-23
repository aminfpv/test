export const Role = {
  ADMIN: 'ADMIN',
  WAREHOUSE: 'WAREHOUSE',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  PURCHASING: 'PURCHASING'
} as const;

export type RoleType = (typeof Role)[keyof typeof Role];

export const permissionMap: Record<RoleType, string[]> = {
  ADMIN: ['*'],
  WAREHOUSE: ['inventory:read', 'inventory:write', 'picklist:write'],
  PROJECT_MANAGER: ['jobs:read', 'jobs:write', 'picklist:read'],
  PURCHASING: ['inventory:read', 'reorder:read', 'po:write']
};

export function can(role: RoleType, permission: string): boolean {
  return permissionMap[role].includes('*') || permissionMap[role].includes(permission);
}
