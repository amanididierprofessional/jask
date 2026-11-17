import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { notificationsQuery } from '@/lib/queries';
import { useAuth } from '@/lib/auth';

export function NotificationListener() {
  const { userId } = useAuth();
  const q = useQuery(notificationsQuery(userId));
  const seen = useRef<Set<string> | null>(null);
  const qc = useQueryClient();
  const nav = useNavigate();

  useEffect(() => { seen.current = null; }, [userId]);
  useEffect(() => {
    if (!q.data) return;
    if (!seen.current) { seen.current = new Set(q.data.map((n) => n.id)); return; }
    for (const n of q.data) {
      if (!seen.current.has(n.id) && !n.read) {
        toast(n.type === 'accepted' ? 'An answer was accepted' : n.type === 'answer' ? 'New answer' : 'You have a new question', {
          description: n.question?.title,
          action: n.question_id ? { label: 'View', onClick: () => nav({ to: '/q/$questionId', params: { questionId: n.question_id ?? '' } }) } : undefined,
        });
      }
      seen.current.add(n.id);
    }
  }, [q.data, nav]);

  useEffect(() => {
    if (!userId) return;
    const refresh = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) qc.invalidateQueries({ queryKey: ['me', 'notifications', userId] });
    };
    window.addEventListener('focus', refresh);
    window.addEventListener('online', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.removeEventListener('focus', refresh); window.removeEventListener('online', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [userId, qc]);

  // Firebase delivers messages to the page in the foreground. Listen for them
  // so foreground pushes also produce an in-app toast.
  useEffect(() => {
    if (!userId) return;
    let active = true;
    let unsubscribe: (() => void) | undefined;
    const setup = async () => {
      const appId = import.meta.env['VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID'];
      const apiKey = import.meta.env['VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY'];
      const projectId = import.meta.env['VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID'];
      if (!appId || !apiKey || !projectId) return;
      try {
        const { isSupported, getMessaging, onMessage } = await import('firebase/messaging');
        if (!await isSupported() || !active) return;
        const { initializeApp, getApps } = await import('firebase/app');
        const config = { appId, apiKey, projectId, messagingSenderId: appId.split(':')[1] ?? '' };
        const app = getApps()[0] ?? initializeApp(config);
        unsubscribe = onMessage(getMessaging(app), (payload) => {
          if (!active) return;
          toast(payload.notification?.title ?? 'New Jask notification', { description: payload.notification?.body });
          qc.invalidateQueries({ queryKey: ['me', 'notifications', userId] });
        });
      } catch (error) { console.warn('[Jask notifications] Foreground push listener unavailable', error); }
    };
    void setup();
    return () => { active = false; unsubscribe?.(); };
  }, [userId, qc]);

  return null;
}
