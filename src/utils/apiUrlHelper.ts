/**
 * Resolves the correct API URL depending on whether the app is running
 * inside a Web Browser (Next.js server context) or inside a Tauri Desktop App.
 */
export function getApiUrl(path: string): string {
  if (typeof window === 'undefined') return path;
  
  // Detect if the app is running inside Tauri (which uses tauri:// or tauri.localhost)
  const isTauri = 
    window.location.protocol === 'tauri:' || 
    window.location.hostname === 'tauri.localhost' || 
    (window as any).__TAURI_INTERNALS__ !== undefined;

  if (isTauri) {
    // Default to the stable git branch deployment URL on Vercel, or override via Env variable
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://chuti-git-main-kamrulislam2s-projects.vercel.app';
    return `${baseUrl.replace(/\/$/, '')}${path}`;
  }
  
  return path;
}
