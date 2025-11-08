export type Role = "USER" | "ADMIN" | "SUPER_ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
  tenantId?: string | null;
}

export function hasRole(user: AuthUser | null, allowedRoles: Role[]): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

export function isSuperAdmin(user: AuthUser | null): boolean {
  return user?.role === "SUPER_ADMIN";
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
}

export function canAccessTenant(user: AuthUser | null, tenantId: string): boolean {
  if (!user) return false;
  if (user.role === "SUPER_ADMIN") return true;
  return user.tenantId === tenantId;
}
