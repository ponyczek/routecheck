import { openDB, type IDBPDatabase } from 'idb';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { OfflineQueueItem } from '../validation';
import type { PublicReportSubmitCommand } from '@/types';

const DB_NAME = 'routelog-offline';
const DB_VERSION = 1;
const STORE_NAME = 'queue';
const MAX_RETRIES = 3;

/**
 * Initialize IndexedDB for offline queue
 */
async function initDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('token', 'token', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    },
  });
}

/**
 * Add item to offline queue
 */
async function addToQueue(token: string, data: PublicReportSubmitCommand): Promise<string> {
  const db = await initDB();
  
  const item: OfflineQueueItem = {
    id: crypto.randomUUID(),
    token,
    data,
    createdAt: new Date().toISOString(),
    retries: 0,
  };
  
  await db.add(STORE_NAME, item);
  return item.id;
}

/**
 * Get all items from queue
 */
async function getQueueItems(): Promise<OfflineQueueItem[]> {
  const db = await initDB();
  return db.getAll(STORE_NAME);
}

/**
 * Remove item from queue
 */
async function removeFromQueue(id: string): Promise<void> {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
}

/**
 * Update item retry count
 */
async function updateRetryCount(id: string, retries: number): Promise<void> {
  const db = await initDB();
  const item = await db.get(STORE_NAME, id);
  
  if (item) {
    item.retries = retries;
    await db.put(STORE_NAME, item);
  }
}

/**
 * Clear all items from queue
 */
async function clearQueue(): Promise<void> {
  const db = await initDB();
  await db.clear(STORE_NAME);
}

interface UseOfflineQueueReturn {
  addToQueue: (token: string, data: PublicReportSubmitCommand) => Promise<string>;
  processQueue: () => Promise<void>;
  clearQueue: () => Promise<void>;
  queueSize: number;
  isProcessing: boolean;
}

/**
 * Hook to manage offline queue for report submissions
 * Automatically processes queue when network comes back online
 * 
 * @param isOnline - Network status from useNetworkStatus
 * @param submitFn - Function to submit report (from api.ts)
 * @returns Queue management functions and state
 * 
 * @example
 * const { addToQueue, processQueue, queueSize } = useOfflineQueue(
 *   isOnline,
 *   (token, data) => submitReport(token, data)
 * );
 * 
 * // When offline
 * await addToQueue(token, reportData);
 * 
 * // Automatically processes when online
 */
export function useOfflineQueue(
  isOnline: boolean,
  submitFn: (token: string, data: PublicReportSubmitCommand) => Promise<unknown>
): UseOfflineQueueReturn {
  const [queueSize, setQueueSize] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Update queue size on mount and after changes
  const updateQueueSize = useCallback(async () => {
    const items = await getQueueItems();
    setQueueSize(items.length);
  }, []);

  useEffect(() => {
    updateQueueSize();
  }, [updateQueueSize]);

  // Process queue when coming back online
  const processQueue = useCallback(async () => {
    if (!isOnline || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const items = await getQueueItems();
      
      if (items.length === 0) {
        setIsProcessing(false);
        return;
      }

      for (const item of items) {
        try {
          // Attempt to submit
          await submitFn(item.token, item.data);
          
          // Success - remove from queue
          await removeFromQueue(item.id);
          
          toast.success('Raport wysłany po przywróceniu połączenia', {
            description: `Raport z ${new Date(item.createdAt).toLocaleTimeString()}`,
          });
        } catch (error) {
          console.error('Failed to process queue item:', error);
          
          // Check retry limit
          if (item.retries >= MAX_RETRIES) {
            // Max retries reached - remove from queue
            await removeFromQueue(item.id);
            
            toast.error('Nie udało się wysłać raportu', {
              description: 'Przekroczono limit prób. Skontaktuj się z dyspozytorem.',
              duration: 10000,
            });
          } else {
            // Increment retry count
            await updateRetryCount(item.id, item.retries + 1);
          }
        }
      }
      
      await updateQueueSize();
    } finally {
      setIsProcessing(false);
    }
  }, [isOnline, isProcessing, submitFn, updateQueueSize]);

  // Auto-process when coming back online
  useEffect(() => {
    if (isOnline) {
      processQueue();
    }
  }, [isOnline, processQueue]);

  // Add to queue wrapper
  const addToQueueWrapper = useCallback(async (token: string, data: PublicReportSubmitCommand) => {
    const id = await addToQueue(token, data);
    await updateQueueSize();
    
    toast.info('Raport zapisany offline', {
      description: 'Zostanie wysłany automatycznie po przywróceniu połączenia.',
    });
    
    return id;
  }, [updateQueueSize]);

  // Clear queue wrapper
  const clearQueueWrapper = useCallback(async () => {
    await clearQueue();
    await updateQueueSize();
  }, [updateQueueSize]);

  return {
    addToQueue: addToQueueWrapper,
    processQueue,
    clearQueue: clearQueueWrapper,
    queueSize,
    isProcessing,
  };
}


