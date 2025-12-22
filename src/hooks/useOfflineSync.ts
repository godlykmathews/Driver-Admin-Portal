import { useState, useEffect } from 'react';
import Dexie from 'dexie';
import { apiService } from '@/lib/api';
import { toast } from 'sonner';

// Define database interface
interface GroupsCache {
  id?: number;
  data: any;
  timestamp: number;
}

interface Signature {
  id?: number;
  customerVisitGroup: string;
  data: Blob;
  notes?: string;
  timestamp: number;
  synced: number;
  retryCount: number;
}

// Initialize Dexie database
class DriverAppDB extends Dexie {
  groups: Dexie.Table<GroupsCache, number>;
  signatures: Dexie.Table<Signature, number>;

  constructor() {
    super('DriverApp');
    this.version(2).stores({
      groups: '++id, data, timestamp',
      signatures: '++id, customerVisitGroup, data, notes, timestamp, synced, retryCount'
    });
  }
}

const db = new DriverAppDB();

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online) {
        syncSignatures();
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Initial check
    updateOnlineStatus();
    updatePendingCount();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const saveSignature = async (customerVisitGroup: string, data: Blob, notes?: string) => {
    try {
      await db.signatures.add({
        customerVisitGroup,
        data,
        notes,
        timestamp: Date.now(),
        synced: 0,
        retryCount: 0
      });
      updatePendingCount();
      toast.success('Signature saved locally');
    } catch (error) {
      console.error('Failed to save signature locally:', error);
      toast.error('Failed to save signature');
    }
  };

  const syncSignatures = async () => {
    const pending = await db.signatures.where('synced').equals(0).toArray();
    for (const sig of pending) {
      try {
        const formData = new FormData();
        formData.append('customer_visit_group', sig.customerVisitGroup);
        formData.append('signature', sig.data);
        if (sig.notes) {
          formData.append('notes', sig.notes);
        }

        await apiService.uploadSignature(sig.customerVisitGroup, formData);
        await db.signatures.update(sig.id, { synced: 1 });
        toast.success('Signature synced successfully');
      } catch (error) {
        console.error('Sync failed for signature:', sig.id, error);
        const newRetryCount = sig.retryCount + 1;
        if (newRetryCount < 5) { // Max retries
          await db.signatures.update(sig.id, { retryCount: newRetryCount });
        } else {
          toast.error(`Signature sync failed after ${newRetryCount} attempts`);
        }
      }
    }
    updatePendingCount();
  };

  const updatePendingCount = async () => {
    const count = await db.signatures.where('synced').equals(0).count();
    setPendingCount(count);
  };

  const getCachedGroups = async () => {
    console.log('🔍 getCachedGroups called');
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000;
    console.log('⏰ Cutoff time:', new Date(cutoffTime).toISOString());

    try {
      const cached = await db.groups.where('timestamp').above(cutoffTime).first();
      console.log('📦 Raw cached result:', cached);

      if (cached) {
        console.log('📦 Cached data timestamp:', new Date(cached.timestamp).toISOString());
        console.log('📦 Cached data exists:', !!cached.data);
        console.log('📦 Cached data groups count:', cached.data?.groups?.length || 0);
        return cached.data || null;
      } else {
        console.log('📦 No cached data found');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting cached groups:', error);
      return null;
    }
  };

  const saveGroupsCache = async (data: any) => {
    await db.groups.clear();
    await db.groups.add({ data, timestamp: Date.now() });
  };

  return {
    isOnline,
    pendingCount,
    saveSignature,
    syncSignatures,
    getCachedGroups,
    saveGroupsCache
  };
};