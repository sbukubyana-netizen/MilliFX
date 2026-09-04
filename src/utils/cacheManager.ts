/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Cache and Storage Management Utility
 * 
 * Removes bloated, stale, or blocking browser caches (Service Workers, CacheStorage,
 * legacy IndexedDB persistence, and bloated temporary keys) to ensure the application
 * launches with minimal latency and always fetches fresh content directly.
 */

export interface CachePurgeResult {
  cachesCleared: number;
  serviceWorkersUnregistered: number;
  indexedDbDatabasesPurged: number;
  localStorageCleaned: boolean;
  timestamp: string;
}

/**
 * Purges all temporary cache data from the browser.
 */
export async function purgeAllCacheData(): Promise<CachePurgeResult> {
  let cachesCleared = 0;
  let serviceWorkersUnregistered = 0;
  let indexedDbDatabasesPurged = 0;
  let localStorageCleaned = false;

  // 1. Clear CacheStorage API caches
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cacheNames = await window.caches.keys();
      await Promise.all(
        cacheNames.map(async (name) => {
          const deleted = await window.caches.delete(name);
          if (deleted) cachesCleared++;
        })
      );
    } catch (err) {
      console.warn('CacheStorage cleanup note:', err);
    }
  }

  // 2. Unregister any lingering or stale Service Workers
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(async (reg) => {
          const unregistered = await reg.unregister();
          if (unregistered) serviceWorkersUnregistered++;
        })
      );
    } catch (err) {
      console.warn('Service Worker unregister note:', err);
    }
  }

  // 3. Purge legacy Firestore or PWA IndexedDB databases that slow down startup disk I/O
  if (typeof window !== 'undefined' && 'indexedDB' in window) {
    try {
      if (typeof indexedDB.databases === 'function') {
        const dbs = await indexedDB.databases();
        for (const dbInfo of dbs) {
          if (
            dbInfo.name &&
            (dbInfo.name.includes('firestore') ||
              dbInfo.name.includes('firebase') ||
              dbInfo.name.includes('workbox') ||
              dbInfo.name.includes('sw-cache'))
          ) {
            try {
              indexedDB.deleteDatabase(dbInfo.name);
              indexedDbDatabasesPurged++;
            } catch {
              // Ignore individual database deletion errors
            }
          }
        }
      }
    } catch (err) {
      console.warn('IndexedDB cleanup note:', err);
    }
  }

  // 4. Clean up temporary / bloated keys in localStorage while preserving essential user settings
  if (typeof window !== 'undefined' && 'localStorage' in window) {
    try {
      // Remove reload loops or temporary flags
      localStorage.removeItem('millifix_asset_reload_count');
      sessionStorage.clear();

      // Trim continueWatching if it has grown excessively large
      const continueWatchingRaw = localStorage.getItem('millifix_continue');
      if (continueWatchingRaw) {
        try {
          const parsed = JSON.parse(continueWatchingRaw);
          if (Array.isArray(parsed) && parsed.length > 12) {
            // Keep only the most recent 12 entries
            localStorage.setItem('millifix_continue', JSON.stringify(parsed.slice(0, 12)));
          }
        } catch {
          localStorage.removeItem('millifix_continue');
        }
      }

      localStorageCleaned = true;
    } catch (err) {
      console.warn('localStorage cleanup note:', err);
    }
  }

  return {
    cachesCleared,
    serviceWorkersUnregistered,
    indexedDbDatabasesPurged,
    localStorageCleaned,
    timestamp: new Date().toISOString()
  };
}

/**
 * Fast startup cleanup hook: runs automatically on application boot to prevent
 * stale caches from blocking or delaying the initial render.
 */
export function autoPurgeStaleCacheOnStartup(): void {
  if (typeof window === 'undefined') return;

  // Unregister service workers immediately
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      for (const reg of regs) {
        reg.unregister().catch(() => {});
      }
    }).catch(() => {});
  }

  // Clear caches silently in the background
  if ('caches' in window) {
    window.caches.keys().then((names) => {
      for (const name of names) {
        window.caches.delete(name).catch(() => {});
      }
    }).catch(() => {});
  }

  // Clear any temporary reload count
  try {
    sessionStorage.removeItem('millifix_asset_reload_count');
  } catch {
    // Ignore
  }
}
