import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { pageHead } from '@/lib/head';
import { BrandMark, Card, PrimaryButton } from '@/components/jask/ui';
import { NotificationSetup } from '@/components/jask/NotificationSetup';

export const Route = createFileRoute('/auth')({
  head: () => pageHead('Sign in', 'Join real college and group conversations on Jask.'),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [setupUser, setSetupUser] = useState<string | null>(null);

  const afterSignIn = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('onboarded').eq('id', userId).maybeSingle();
    navigate({ to: data?.onboarded ? '/' : '/onboarding' });
  };

  const finishNotificationSetup = async () => {
    if (!setupUser) return;
    const userId = setupUser;
    setSetupUser(null);
    await afterSignIn(userId);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === 'up') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
        if (data.session && data.user) {
          window.localStorage.setItem(`jask-notification-setup:${data.user.id}`, 'shown');
          setSetupUser(data.user.id);
        } else {
          setSent(true);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await afterSignIn(data.user.id);
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error(String(result.error.message ?? result.error));
      return;
    }
    if (result.redirected) return;
    const { data } = await supabase.auth.getUser();
    if (data.user) await afterSignIn(data.user.id);
  };

  const field = 'h-12 w-full rounded-[18px] border border-ink/10 bg-card px-4 text-[15px] outline-none focus:border-brand';

  return (
    <div className="mx-auto flex min-h-screen max-w-[420px] flex-col justify-center gap-5 px-4 py-10">
      <div className="px-1">
        <BrandMark />
        <h1 className="mt-2 text-[28px] font-black leading-tight">{mode === 'in' ? 'Welcome back' : 'Join your campus'}</h1>
        <p className="mt-1 text-[14px] text-mute">Just Ask. Find the people. Find the answers.</p>
      </div>
      <Card>
        {sent ? (
          <div className="text-center">
            <p className="font-display text-[18px] font-extrabold">Check your email</p>
            <p className="mt-1 text-[14px] text-mute">We sent a confirmation link to {email}. Open it to finish signing up.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            {mode === 'up' && (
              <input required maxLength={80} placeholder="Full name" value={name} onChange={(event) => setName(event.target.value)} className={field} />
            )}
            <input required type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} className={field} />
            <input required type="password" minLength={6} placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} className={field} />
            <PrimaryButton type="submit" disabled={busy}>
              {busy ? 'One sec…' : mode === 'in' ? 'Sign in' : 'Create account'}
            </PrimaryButton>
            <button type="button" onClick={google} className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full border text-[14px] font-medium">
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
                <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
              </svg>
              Continue with Google
            </button>
          </form>
        )}
      </Card>
      <button type="button" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setSent(false); }} className="text-[14px] font-bold text-brand">
        {mode === 'in' ? 'New here? Create an account' : 'Already have an account? Sign in'}
      </button>
      {setupUser && <NotificationSetup userId={setupUser} onDone={finishNotificationSetup} />}
    </div>
  );
}
