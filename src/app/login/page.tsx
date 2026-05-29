'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Lock, Mail, AlertCircle, Loader, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Load theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session) {
          const userId = session.user.id;
          const now = Date.now();
          const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
          const sessionStart = localStorage.getItem(`session_start_time_${userId}`);
          const lastAccess = localStorage.getItem(`last_access_time_${userId}`);

          if (sessionStart || lastAccess) {
            const startAge = sessionStart ? now - parseInt(sessionStart, 10) : 0;
            const accessAge = lastAccess ? now - parseInt(lastAccess, 10) : 0;

            if (startAge > oneWeekMs || accessAge > oneWeekMs) {
              localStorage.removeItem(`session_start_time_${userId}`);
              localStorage.removeItem(`last_access_time_${userId}`);
              try {
                await supabase.auth.signOut();
              } catch (e) {
                console.error('Error signing out expired session:', e);
              }
              return;
            }
          }
          router.push('/');
        }
      } catch (err) {
        console.error('Error during checkUser session check:', err);
      }
    };
    checkUser();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Try resolving username/codename to registered email first
    let loginEmail = email.trim();
    if (!loginEmail.includes('@')) {
      try {
        const { data: resolvedEmail } = await supabase.rpc('get_user_email_by_username', { p_username: loginEmail });
        if (resolvedEmail) {
          loginEmail = resolvedEmail;
        } else {
          // fallback mapping
          if (loginEmail.toLowerCase().includes('admin') || loginEmail.toLowerCase() === 'kamrul') {
            loginEmail = `${loginEmail.toLowerCase()}@admin.chuti`;
          } else if (loginEmail.toLowerCase().includes('supervisor')) {
            loginEmail = `${loginEmail.toLowerCase()}@supervisor.chuti`;
          } else {
            loginEmail = `${loginEmail.toLowerCase()}@user.chuti`;
          }
        }
      } catch {
        // fallback mapping
        if (loginEmail.toLowerCase().includes('admin') || loginEmail.toLowerCase() === 'kamrul') {
          loginEmail = `${loginEmail.toLowerCase()}@admin.chuti`;
        } else if (loginEmail.toLowerCase().includes('supervisor')) {
          loginEmail = `${loginEmail.toLowerCase()}@supervisor.chuti`;
        } else {
          loginEmail = `${loginEmail.toLowerCase()}@user.chuti`;
        }
      }
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });

      if (authError) {
        setError(authError.message === 'Invalid login credentials' 
          ? 'ভুল কোডনেম বা ভুল পাসওয়ার্ড দেওয়া হয়েছে...' 
          : authError.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        const userId = data.session.user.id;
        localStorage.setItem(`session_start_time_${userId}`, Date.now().toString());
        localStorage.setItem(`last_access_time_${userId}`, Date.now().toString());
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('লগইন করার সময় একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-950 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-violet-900/20 blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
          ছুটি ট্রেকার
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          লগইন করে আপনার ছুটির এন্ট্রি সম্পন্ন করুন
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 py-8 px-4 shadow-2xl rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="rounded-lg bg-red-950/50 border border-red-800/50 p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div className="text-sm text-red-200">{error}</div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                কোডনেম (Codename)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" aria-hidden="true" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="text"
                  required
                  placeholder="যেমন: KI1024"
                  value={email}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEmail(val.includes('@') ? val : val.toUpperCase());
                  }}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                পাসওয়ার্ড (Password)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader className="animate-spin h-5 w-5 text-white" /> Loading...
                  </span>
                ) : (
                  'লগইন করুন'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
