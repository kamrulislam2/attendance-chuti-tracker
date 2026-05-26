# 🌟 ছুটি (Chuti) — Role-Based Office Attendance & Leave Tracker

A premium, modern, and offline-first Progressive Web App (PWA) built with **Next.js (TypeScript)** and **Supabase (PostgreSQL)**. It is designed to manage employee sign-in/out, track working hours, and automate multi-role leave approvals and adjustments (Full Day, Short Leave, Overtime, and Reserve Holiday) with Google Sheets-level logic and synchronization.

---

## 🚀 Key Features

### 👤 User (Staff) Dashboard
*   **Time Tracking**: Live tracking of daily working hours and break durations.
*   **Sign-In / Sign-Out**: Single-click sign-in/out with customizable default timings.
*   **Leave Requests**: Submit applications for 4 types of leaves (Full Leave, Short Leave, Overtime, and Reserve Holiday).
*   **Leave Adjustment**: Request adjustments (e.g., using accumulated overtime or reserve holidays to offset short leaves).
*   **Personal Filtering Panel**: Filter personal records by category, year (with year-locked calendars), or custom date ranges.
*   **Excel/CSV Exports**: Export filtered personal leave and attendance histories directly to Excel or CSV.
*   **Realtime Sync**: Seamlessly syncs updates with the administrative database in real time.

### 👥 Supervisor Panel
*   **Request Management**: Approve or reject leave, adjustment, or profile change requests submitted by supervisees.
*   **Hierarchical Approvals**: Support for multi-stage supervisor-to-admin workflows (e.g., `pending_supervisor` -> `approved_by_supervisor` -> `approved`).

### 🔑 Admin Dashboard
*   **Comprehensive Staff List**: A master table displaying every staff member's unadjusted leave and overtime counts.
*   **User Account Control**: Create, update, or delete staff credentials, passwords, and roles directly from the interface.
*   **Settings Overrides**: Customize individual rules per user, such as enabling/disabling overtime (`allow_overtime`), reserve holidays (`allow_reserve`), or supervisor approval bypass (`needs_supervisor_approval`).
*   **Quick Adjustments**: Perform instant, direct leave adjustments for any user, bypassing normal multi-level approval workflows.
*   **Master Data Export**: Export the entire company’s leave summary database to CSV/Excel in one click.

### 📶 Offline-First & Realtime Features (PWA)
*   **Service Worker (`sw.js`)**: Caches static assets for offline startup and updates.
*   **IndexedDB Storage (`offlineSync.ts`)**: Locally queues attendance logs and leave submissions if the device loses connection.
*   **Background Synchronization**: Automatically syncs queued offline data to Supabase once internet connectivity is restored.
*   **Supabase Realtime Replication**: Real-time listeners automatically update dashboard metrics and tables when database changes occur, avoiding manual page reloads.
*   **Web Push Notifications**: Alerts users of status updates, profile modifications, or approval events in real time.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 19, Next.js 16 (App Router), TypeScript, Tailwind CSS, Lucide Icons |
| **Database & Auth** | Supabase (PostgreSQL), Postgres Row-Level Security (RLS), Triggers, PG Functions, RPCs |
| **Offline Sync** | IndexedDB API, Service Worker API |
| **Notifications** | Web Push API, `web-push` Node Library, VAPID Keys |

---

## 📁 Project Structure

```text
chuti/
├── public/                 # PWA Icons, manifest.webmanifest, and sw.js
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── send-push/  # Edge-compatible Web Push Notification API handler
│   │   │       └── route.ts
│   │   ├── login/          # Login panel with username-to-email mapping
│   │   │   └── page.tsx
│   │   ├── globals.css     # Dark-mode glassmorphic theme definitions
│   │   ├── layout.tsx
│   │   └── page.tsx        # Core App Dashboard (UI, stats, cards, filters, tables)
│   ├── js/                 # Organized directory for diagnostic and maintenance scripts
│   └── utils/
│       ├── offlineSync.ts  # IndexedDB store, fetch, and background sync logic
│       ├── supabase.ts     # Supabase Client configuration
│       └── webPushHelper.ts# Push notification registration and helper routines
├── supabase/
│   ├── schema.sql          # Primary database schemas, constraints, and triggers
│   └── push_subscriptions.sql # Push subscriptions schema and security definer functions
├── eslint.config.mjs       # ESLint configurations with global ignores
├── package.json
└── tsconfig.json
```

---

## 🗄️ Database Schema Details

The database is built on PostgreSQL with strict Row Level Security (RLS) policies.

### Tables
1.  **`public.profiles`**: Contains employee metadata (roles, usernames, default sign-in/out times, and supervisor requirements). Linked to `auth.users` via a Postgres trigger (`on_auth_user_created`) that auto-populates the profile upon signup.
2.  **`public.chuti`**: Holds attendance logs and leave records. Contains date-uniqueness constraints (`unique_user_date`) to prevent duplicate entries and fields utilizing Postgres `INTERVAL` types for precise hour calculations.
3.  **`public.push_subscriptions`**: Holds VAPID push endpoints, auth tokens, and browser public keys for individual users.

### Row Level Security (RLS) Summary
*   **Users**: Can read/write their own profiles and chuti entries.
*   **Supervisors**: Can read all profiles/chuti and approve/reject entries for their staff.
*   **Admins**: Possess full read/write permissions for all profiles, chuti entries, and system configurations.

---

## 💻 Local Development Setup

### 1. Prerequisites
*   Node.js (v18 or higher)
*   A Supabase project setup

### 2. Database Initialization
Run the SQL scripts in your Supabase SQL Editor in the following order:
1.  Execute `supabase/schema.sql` (Creates profiles, chuti, triggers, and RPC functions).
2.  Execute `supabase/push_subscriptions.sql` (Creates push notification tables and security definer functions).

### 3. Environment Setup
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

*Note: You can generate VAPID keys using the command `npx web-push generate-vapid-keys`.*

### 4. Running the App
Install dependencies and run the development environment:
```bash
# Install packages
npm install

# Start Next.js development server
npm run dev

# Check Linting
npm run lint

# Build optimized production bundle
npm run build
```
