# Release Notes — Chuti v1.0.0 (Major Release)

We are excited to announce the release of **Chuti v1.0.0**, a major release bringing production-grade offline-first stability, robust delta synchronization, localized conflict resolution, and performance optimizations.

## 🚀 Key Achievements

### 📶 Delta Sync & Cache Optimizations
* **Incremental Delta Syncing**: The client now tracks sync timestamps in the local database (`sync_metadata`) and queries only records modified since the last sync using `.gte('updated_at', lastSyncedAt)` filters, reducing network payload sizes.
* **Non-Destructive Cache Merges**: Overwrote full-clearing IndexedDB cache calls with targeted upserts (`upsertCacheItem`) and merges (`mergeCacheData`). This prevents the application from dropping cached supervisor or admin profiles during routine background operations.
* **TTL Cache Expirations**: Integrated automatic database purging of leave records older than 2 years (730 days) to prevent local database bloat.

### 🛡️ Graceful Offline Session Recovery
* **JWT Expiration Fallbacks**: Configured multiple recovery entry points in the session hooks. If an offline user's session token expires or is rejected by Supabase API timeouts, the client gracefully recovers the logged profile from local IndexedDB cache, allowing the user to view cached data without a force-redirect to the login screen.

### 💬 English Conflict Resolution & Localizations (Zero Bengali)
* **Conflict Resolution warnings**: Implemented "Server Wins" policy for offline sync updates, with warnings showing as 8-second toast errors.
* **Localization Sweep**: Translated all user-facing strings, conflict notification bodies, fallback push notification structures, and the PWA manifest details to English.

### 🌐 PWA Asset Pre-caching
* The Custom Service Worker now pre-caches critical offline assets, including the Web App Manifest, favicon, and app icons.
