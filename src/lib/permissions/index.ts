type Role = "ADMIN" | "ANALYST" | "VIEWER"

const permissions: Record<Role, string[]> = {
  ADMIN: [
    "feedback:create",
    "feedback:read",
    "feedback:update",
    "feedback:delete",
    "feedback:import",
    "analytics:read",
    "themes:read",
    "themes:manage",
    "ai:classify",
    "ai:ask",
    "reports:create",
    "reports:read",
    "reports:update",
    "reports:delete",
    "settings:manage",
    "team:manage",
    "workspace:manage",
  ],
  ANALYST: [
    "feedback:create",
    "feedback:read",
    "feedback:update",
    "feedback:import",
    "analytics:read",
    "themes:read",
    "ai:classify",
    "ai:ask",
    "reports:create",
    "reports:read",
  ],
  VIEWER: [
    "feedback:read",
    "analytics:read",
    "themes:read",
    "ai:ask",
    "reports:read",
  ],
}

export function hasPermission(role: Role, permission: string): boolean {
  return permissions[role]?.includes(permission) ?? false
}

export function canCreateFeedback(role: Role): boolean {
  return hasPermission(role, "feedback:create")
}

export function canDeleteFeedback(role: Role): boolean {
  return hasPermission(role, "feedback:delete")
}

export function canImportFeedback(role: Role): boolean {
  return hasPermission(role, "feedback:import")
}

export function canManageTeam(role: Role): boolean {
  return hasPermission(role, "team:manage")
}

export function canRunAI(role: Role): boolean {
  return hasPermission(role, "ai:classify")
}

export function canCreateReport(role: Role): boolean {
  return hasPermission(role, "reports:create")
}

export function canDeleteReport(role: Role): boolean {
  return hasPermission(role, "reports:delete")
}
