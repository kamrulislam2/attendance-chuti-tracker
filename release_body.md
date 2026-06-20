# Release Notes — Chuti v1.1.1

We are pleased to announce the release of **Chuti v1.1.1**, a maintenance update focusing on database schema consolidation and robustness.

## 🚀 Key Improvements

### 🗃️ Unified Database Schema
* **Consolidated Schema**: Merged all outstanding PostgreSQL migrations (`migration_delta_sync.sql`, `migration_soft_delete.sql`, `migration_settlements.sql`, and `migration_splits.sql`) directly into the base `supabase/schema.sql` script.
* **Cleanup**: Removed redundant migration files from the repository to prevent confusion and ensure a clean single-file database initialization.

### 🐛 Database Constraint Alignment & Bug Fix
* **Leave Settlements Default Status**: Resolved a mismatch where `leave_settlements.status` defaulted to `'pending'` in the table definition but was restricted to `('initiated', 'responded', 'processed')` in the check constraints. The default has been aligned to `'initiated'` to prevent potential database level constraint violations.
