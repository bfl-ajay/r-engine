/**
 * Authorization Service
 * Role-Based Access Control (RBAC) and permissions management
 */

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  createdAt: number;
}

export interface Permission {
  id: string;
  resource: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXECUTE' | 'SHARE';
  description: string;
}

export interface RoleAssignment {
  userId: string;
  roleId: string;
  assignedAt: number;
}

/**
 * AuthorizationService - Manage roles and permissions
 */
class AuthorizationService {
  private roles: Map<string, Role> = new Map();
  private permissions: Map<string, Permission> = new Map();
  private userRoles: Map<string, string[]> = new Map();

  constructor() {
    this.initializeDefaultRoles();
  }

  /**
   * Initialize default roles
   */
  private initializeDefaultRoles(): void {
    this.createRole('admin', 'Administrator', 'Full system access', [
      'report:create',
      'report:read',
      'report:update',
      'report:delete',
      'report:share',
      'report:execute',
      'user:create',
      'user:read',
      'user:update',
      'user:delete',
      'role:create',
      'role:read',
      'role:update',
      'role:delete',
      'template:create',
      'template:read',
      'template:update',
      'template:delete',
      'schedule:create',
      'schedule:read',
      'schedule:update',
      'schedule:delete',
      'datasource:create',
      'datasource:read',
      'datasource:update',
      'datasource:delete',
    ]);

    this.createRole('report_creator', 'Report Creator', 'Create and manage reports', [
      'report:create',
      'report:read',
      'report:update',
      'report:delete',
      'report:share',
      'report:execute',
      'template:read',
      'datasource:read',
      'schedule:create',
      'schedule:read',
      'schedule:update',
      'schedule:delete',
    ]);

    this.createRole('report_viewer', 'Report Viewer', 'View reports only', [
      'report:read',
      'report:execute',
      'template:read',
    ]);

    this.createRole('analyst', 'Analyst', 'Create reports and analyze data', [
      'report:create',
      'report:read',
      'report:update',
      'report:execute',
      'template:read',
      'datasource:read',
    ]);
  }

  /**
   * Create role
   */
  createRole(name: string, description: string, permissions: string[]): Role {
    const id = `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const role: Role = {
      id,
      name,
      description,
      permissions,
      createdAt: Date.now(),
    };

    this.roles.set(id, role);
    return role;
  }

  /**
   * Assign role to user
   */
  assignRole(userId: string, roleId: string): {success: boolean; error?: string} {
    if (!this.roles.has(roleId)) {
      return {success: false, error: 'Role not found'};
    }

    const userRoles = this.userRoles.get(userId) || [];
    if (!userRoles.includes(roleId)) {
      userRoles.push(roleId);
      this.userRoles.set(userId, userRoles);
    }

    return {success: true};
  }

  /**
   * Remove role from user
   */
  removeRole(userId: string, roleId: string): boolean {
    const userRoles = this.userRoles.get(userId);
    if (!userRoles) return false;

    const index = userRoles.indexOf(roleId);
    if (index > -1) {
      userRoles.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * Check if user has permission
   */
  hasPermission(userId: string, permission: string): boolean {
    const userRoles = this.userRoles.get(userId) || [];

    return userRoles.some((roleId) => {
      const role = this.roles.get(roleId);
      return role && role.permissions.includes(permission);
    });
  }

  /**
   * Check if user has any of multiple permissions
   */
  hasAnyPermission(userId: string, permissions: string[]): boolean {
    return permissions.some((p) => this.hasPermission(userId, p));
  }

  /**
   * Check if user has all permissions
   */
  hasAllPermissions(userId: string, permissions: string[]): boolean {
    return permissions.every((p) => this.hasPermission(userId, p));
  }

  /**
   * Get user roles
   */
  getUserRoles(userId: string): Role[] {
    const roleIds = this.userRoles.get(userId) || [];
    return roleIds.map((id) => this.roles.get(id)!).filter(Boolean);
  }

  /**
   * Get user permissions
   */
  getUserPermissions(userId: string): string[] {
    const roles = this.getUserRoles(userId);
    const permissions = new Set<string>();

    roles.forEach((role) => {
      role.permissions.forEach((p) => permissions.add(p));
    });

    return Array.from(permissions);
  }

  /**
   * Get role
   */
  getRole(roleId: string): Role | undefined {
    return this.roles.get(roleId);
  }

  /**
   * Update role
   */
  updateRole(
    roleId: string,
    updates: Partial<Role>
  ): {success: boolean; role?: Role; error?: string} {
    const role = this.roles.get(roleId);
    if (!role) {
      return {success: false, error: 'Role not found'};
    }

    const updated = {...role, ...updates};
    this.roles.set(roleId, updated);
    return {success: true, role: updated};
  }

  /**
   * Delete role
   */
  deleteRole(roleId: string): boolean {
    // Don't delete if users are assigned
    let isAssigned = false;
    this.userRoles.forEach((roles) => {
      if (roles.includes(roleId)) {
        isAssigned = true;
      }
    });

    if (isAssigned) {
      return false;
    }

    return this.roles.delete(roleId);
  }

  /**
   * List all roles
   */
  listRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  /**
   * Add permission to role
   */
  addPermissionToRole(roleId: string, permission: string): boolean {
    const role = this.roles.get(roleId);
    if (!role) return false;

    if (!role.permissions.includes(permission)) {
      role.permissions.push(permission);
    }

    return true;
  }

  /**
   * Remove permission from role
   */
  removePermissionFromRole(roleId: string, permission: string): boolean {
    const role = this.roles.get(roleId);
    if (!role) return false;

    const index = role.permissions.indexOf(permission);
    if (index > -1) {
      role.permissions.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * Check resource access
   */
  canAccess(userId: string, resource: string, action: string): boolean {
    const permission = `${resource}:${action.toLowerCase()}`;
    return this.hasPermission(userId, permission);
  }

  /**
   * Get all users with role
   */
  getUsersWithRole(roleId: string): string[] {
    const users: string[] = [];

    this.userRoles.forEach((roles, userId) => {
      if (roles.includes(roleId)) {
        users.push(userId);
      }
    });

    return users;
  }

  /**
   * Clone role
   */
  cloneRole(sourceRoleId: string, newRoleName: string): Role | null {
    const sourceRole = this.roles.get(sourceRoleId);
    if (!sourceRole) return null;

    return this.createRole(
      newRoleName,
      `Clone of ${sourceRole.name}`,
      [...sourceRole.permissions]
    );
  }
}

export default new AuthorizationService();
