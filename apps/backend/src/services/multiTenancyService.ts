/**
 * Multi-Tenancy Service
 * Manage isolated tenant deployments and data segregation
 */

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
  createdAt: number;
  dataIsolation: 'DATABASE' | 'SCHEMA' | 'ROW_LEVEL';
  features: Record<string, boolean>;
  limits: {
    reports: number;
    users: number;
    datasources: number;
    storage: number; // MB
    requestsPerDay: number;
  };
  usage: {
    reports: number;
    users: number;
    datasources: number;
    storage: number;
    requestsToday: number;
  };
  administrators: string[];
}

export interface TenantContext {
  tenantId: string;
  userId?: string;
  timestamp: number;
  resourcePath?: string;
}

/**
 * MultiTenancyService - Manage multi-tenant deployments
 */
class MultiTenancyService {
  private tenants: Map<string, Tenant> = new Map();
  private tenantsBySlug: Map<string, string> = new Map();
  private currentContext: TenantContext | null = null;

  /**
   * Create tenant
   */
  createTenant(
    name: string,
    slug: string,
    plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE',
    adminUserId: string
  ): {success: boolean; tenant?: Tenant; error?: string} {
    // Validate slug
    if (this.tenantsBySlug.has(slug)) {
      return {success: false, error: 'Tenant slug already exists'};
    }

    const id = `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const limits = this.getLimitsForPlan(plan);
    const features = this.getFeaturesForPlan(plan);

    const tenant: Tenant = {
      id,
      name,
      slug,
      plan,
      status: 'ACTIVE',
      createdAt: Date.now(),
      dataIsolation: 'SCHEMA',
      features,
      limits,
      usage: {
        reports: 0,
        users: 1,
        datasources: 0,
        storage: 0,
        requestsToday: 0,
      },
      administrators: [adminUserId],
    };

    this.tenants.set(id, tenant);
    this.tenantsBySlug.set(slug, id);

    return {success: true, tenant};
  }

  /**
   * Get tenant by ID
   */
  getTenant(tenantId: string): Tenant | undefined {
    return this.tenants.get(tenantId);
  }

  /**
   * Get tenant by slug
   */
  getTenantBySlug(slug: string): Tenant | undefined {
    const tenantId = this.tenantsBySlug.get(slug);
    return tenantId ? this.tenants.get(tenantId) : undefined;
  }

  /**
   * Update tenant
   */
  updateTenant(
    tenantId: string,
    updates: Partial<Tenant>
  ): {success: boolean; tenant?: Tenant; error?: string} {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return {success: false, error: 'Tenant not found'};
    }

    const updated = {...tenant, ...updates};

    // If slug changed, update slug index
    if (updates.slug && updates.slug !== tenant.slug) {
      this.tenantsBySlug.delete(tenant.slug);
      this.tenantsBySlug.set(updates.slug, tenantId);
    }

    this.tenants.set(tenantId, updated);
    return {success: true, tenant: updated};
  }

  /**
   * Delete tenant
   */
  deleteTenant(tenantId: string): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return false;

    this.tenantsBySlug.delete(tenant.slug);
    return this.tenants.delete(tenantId);
  }

  /**
   * Check if tenant is within limits
   */
  isWithinLimits(
    tenantId: string,
    resource: 'reports' | 'users' | 'datasources',
    increment: number = 1
  ): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return false;

    const currentUsage = tenant.usage[resource] || 0;
    const limit = tenant.limits[resource] || 0;

    return currentUsage + increment <= limit;
  }

  /**
   * Track resource usage
   */
  trackUsage(
    tenantId: string,
    resource: 'reports' | 'users' | 'datasources' | 'storage' | 'requestsToday',
    amount: number = 1
  ): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return false;

    const currentUsage = tenant.usage[resource] || 0;
    const limit = tenant.limits[resource] || 0;

    if (resource !== 'requestsToday' && currentUsage + amount > limit) {
      return false; // Over limit
    }

    (tenant.usage as any)[resource] = currentUsage + amount;
    return true;
  }

  /**
   * Reset daily usage counters
   */
  resetDailyUsage(tenantId: string): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return false;

    tenant.usage.requestsToday = 0;
    return true;
  }

  /**
   * Set tenant context for current request
   */
  setTenantContext(context: TenantContext): void {
    this.currentContext = context;
  }

  /**
   * Get current tenant context
   */
  getCurrentContext(): TenantContext | null {
    return this.currentContext;
  }

  /**
   * Clear tenant context
   */
  clearTenantContext(): void {
    this.currentContext = null;
  }

  /**
   * Upgrade tenant plan
   */
  upgradePlan(
    tenantId: string,
    newPlan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
  ): {success: boolean; tenant?: Tenant; error?: string} {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return {success: false, error: 'Tenant not found'};
    }

    if (tenant.plan === newPlan) {
      return {success: false, error: 'Cannot upgrade to the same plan'};
    }

    tenant.plan = newPlan;
    tenant.limits = this.getLimitsForPlan(newPlan);
    tenant.features = this.getFeaturesForPlan(newPlan);

    return {success: true, tenant};
  }

  /**
   * Suspend tenant
   */
  suspendTenant(tenantId: string): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return false;

    tenant.status = 'SUSPENDED';
    return true;
  }

  /**
   * Resume tenant
   */
  resumeTenant(tenantId: string): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return false;

    tenant.status = 'ACTIVE';
    return true;
  }

  /**
   * Check feature availability
   */
  hasFeature(tenantId: string, featureName: string): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return false;

    return tenant.features[featureName] === true;
  }

  /**
   * Add tenant administrator
   */
  addAdministrator(tenantId: string, userId: string): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return false;

    if (!tenant.administrators.includes(userId)) {
      tenant.administrators.push(userId);
      return true;
    }

    return false;
  }

  /**
   * Remove tenant administrator
   */
  removeAdministrator(tenantId: string, userId: string): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return false;

    const index = tenant.administrators.indexOf(userId);
    if (index > -1) {
      tenant.administrators.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * List tenant administrators
   */
  listAdministrators(tenantId: string): string[] {
    const tenant = this.tenants.get(tenantId);
    return tenant?.administrators || [];
  }

  /**
   * Get limits for plan
   */
  private getLimitsForPlan(
    plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
  ): Tenant['limits'] {
    const limitsMap = {
      STARTER: {
        reports: 100,
        users: 5,
        datasources: 3,
        storage: 1024,
        requestsPerDay: 10000,
      },
      PROFESSIONAL: {
        reports: 1000,
        users: 50,
        datasources: 20,
        storage: 51200,
        requestsPerDay: 100000,
      },
      ENTERPRISE: {
        reports: 100000,
        users: 10000,
        datasources: 1000,
        storage: 5242880,
        requestsPerDay: 10000000,
      },
    };

    return limitsMap[plan];
  }

  /**
   * Get features for plan
   */
  private getFeaturesForPlan(
    plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
  ): Record<string, boolean> {
    const featuresMap = {
      STARTER: {
        basic_reporting: true,
        scheduling: false,
        advanced_charts: false,
        pivot_tables: false,
        api_access: false,
        custom_branding: false,
        sso: false,
      },
      PROFESSIONAL: {
        basic_reporting: true,
        scheduling: true,
        advanced_charts: true,
        pivot_tables: true,
        api_access: true,
        custom_branding: false,
        sso: false,
      },
      ENTERPRISE: {
        basic_reporting: true,
        scheduling: true,
        advanced_charts: true,
        pivot_tables: true,
        api_access: true,
        custom_branding: true,
        sso: true,
      },
    };

    return featuresMap[plan];
  }

  /**
   * List all tenants
   */
  listTenants(): Tenant[] {
    return Array.from(this.tenants.values());
  }

  /**
   * Get tenant billing summary
   */
  getBillingSummary(tenantId: string): {
    plan: string;
    monthlyRate: number;
    usage: Record<string, number>;
    percentageUsed: Record<string, number>;
  } | null {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return null;

    const monthlyRates = {STARTER: 99, PROFESSIONAL: 499, ENTERPRISE: 2499};

    const percentageUsed: Record<string, number> = {};
    (Object.keys(tenant.usage) as Array<keyof typeof tenant.usage>).forEach((key) => {
      if (key !== 'requestsToday') {
        const usage = tenant.usage[key];
        const limit = tenant.limits[key as keyof typeof tenant.limits] || 1;
        percentageUsed[key] = (usage / limit) * 100;
      }
    });

    return {
      plan: tenant.plan,
      monthlyRate: monthlyRates[tenant.plan],
      usage: tenant.usage,
      percentageUsed,
    };
  }
}

export default new MultiTenancyService();
