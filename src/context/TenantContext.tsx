'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

export interface Tenant {
  _id: string;
  name: string;
  type: 'bakery' | 'restaurant' | 'hardware' | 'cake_shop';
  enabledModules: ('analytics' | 'pos' | 'kds' | 'inventory')[];
  logoUrl?: string;
  contactEmail: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  ownerName: string;
  ownerEmail: string;
  createdAt: string;
  updatedAt: string;
}

interface TenantContextType {
  tenants: Tenant[];
  activeTenant: Tenant | null;
  loading: boolean;
  selectTenant: (tenantId: string) => void;
  refreshTenants: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTenants = useCallback(async () => {
    try {
      const response = await fetch('/api/tenants');
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setTenants(data.data);

        const savedTenantId = typeof window !== 'undefined' ? localStorage.getItem('selectedTenantId') : null;
        const matchedTenant = data.data.find((t: Tenant) => t._id === savedTenantId);

        if (matchedTenant) {
          setActiveTenant(matchedTenant);
        } else if (data.data.length > 0) {
          setActiveTenant(data.data[0]);
          if (typeof window !== 'undefined') {
            localStorage.setItem('selectedTenantId', data.data[0]._id);
          }
        } else {
          setActiveTenant(null);
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchTenants();
    } else {
      setTenants([]);
      setActiveTenant(null);
      setLoading(true);
    }
  }, [user, fetchTenants]);

  const selectTenant = (tenantId: string) => {
    const selected = tenants.find((t) => t._id === tenantId);
    if (selected) {
      setActiveTenant(selected);
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedTenantId', tenantId);
      }
    }
  };

  const refreshTenants = async () => {
    setLoading(true);
    await fetchTenants();
  };

  return (
    <TenantContext.Provider
      value={{
        tenants,
        activeTenant,
        loading,
        selectTenant,
        refreshTenants,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
