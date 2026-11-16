import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { notificationsQuery } from '@/lib/queries';
import { preferencesQuery } from '@/lib/social-queries';
import { enablePush } from '@/lib/push';
import { pageHead } from '@/lib/head';
import { classLabel, timeAgo } from '@/lib/format';
import { Avatar } from '@/components/jask/ui';

export const Route = createFileRoute('/_authenticated/me')({
  head: () => pageHead('Me', 'Your profile and notification preferences on Jask.'),
  component: Me,
});

function Me() {
  const { userId, profile } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const notifications = useQuery(notificationsQuery(userId));
  const preferences = useQuery(preferencesQuery(userId));
  const [busy, setBusy] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const current = preferences.data ?? {
    enabled: true,
    courses: true,
    communities: true,
    campus: false,
    push_enabled: false,
  };
  const unread = notifications.data?.filter((notification) => !notification.read).length ?? 0;

  const update = async (values: Partial<typeof current>) => {
    if (!userId) return;
    queryClient.setQueryData(['me', 'preferences', userId], { user_id: userId, ...current, ...values });
    const { error } = await supabase.from('notification_preferences').upsert({ user_id: userId, ...current, ...values });
    if (error) {
      toast.error(error.message);
    } else {
      queryClient.invalidateQueries({ queryKey: ['me', 'preferences'] });
      toast.success('Notification preferences saved');
    }
  };

  const push = async () => {
    if (!userId) return;
    setBusy(true);
    try {
      await enablePush(userId);
      await update({ push_enabled: true, enabled: true });
      toast.success('Notifications enabled for this browser');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const markAllRead = async () => {
    if (!userId) return;
    const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['me', 'notifications'] });
    queryClient.invalidateQueries({ queryKey: ['me', 'home-updates'] });
  };

  return (
    <div className="space-y-6 px-4 pb-28 pt-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Me</h1>
        <Button
          variant="ghost"
          size="icon"
          aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
          onClick={() => setAlertsOpen(true)}
          className="relative rounded-full"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-win px-1 text-[10px] font-black text-ink">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Button>
      </header>

      <div className="flex items-center gap-3 border-b pb-5">
        <Avatar name={profile?.full_name ?? ''} url={profile?.avatar_url} size={56} />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold">{profile?.full_name}</p>
          <p className="text-sm text-mute">{classLabel(profile)}</p>
        </div>
        <Link to="/onboarding" className="text-sm text-brand">Edit</Link>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-black">Notification preferences</h2>
        {([
          ['enabled', 'Receive notifications'],
          ['courses', 'My courses'],
          ['communities', 'My communities'],
          ['campus', 'Everything from my campus'],
        ] as const).map(([key, label]) => (
          <label key={key} className="flex items-center justify-between gap-3 text-sm">
            <span>{label}</span>
            <input
              aria-label={label}
              type="checkbox"
              checked={Boolean(current[key])}
              disabled={key !== 'enabled' && !current.enabled}
              onChange={(event) => update({ [key]: event.target.checked })}
            />
          </label>
        ))}
        <Button onClick={push} disabled={busy || !current.enabled}>
          {busy ? 'Enabling…' : current.push_enabled ? 'Enable on this device' : 'Enable browser notifications'}
        </Button>
        {current.push_enabled && (
          <Button
            variant="ghost"
            onClick={async () => {
              if (!userId) return;
              const { error } = await supabase.from('push_devices').delete().eq('user_id', userId);
              if (error) {
                toast.error(error.message);
                return;
              }
              await update({ push_enabled: false });
            }}
          >
            Disable push on all devices
          </Button>
        )}
      </section>

      <Button
        variant="outline"
        onClick={async () => {
          await supabase.auth.signOut();
          navigate({ to: '/' });
        }}
      >
        Sign out
      </Button>

      <Dialog open={alertsOpen} onOpenChange={setAlertsOpen}>
        <DialogContent className="max-w-[440px] rounded-[28px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Notifications</DialogTitle>
            <DialogDescription>Open a post to join the conversation.</DialogDescription>
          </DialogHeader>
          {notifications.data && unread > 0 && (
            <Button size="sm" variant="ghost" onClick={markAllRead}>Mark all read</Button>
          )}
          <div className="max-h-[55vh] overflow-y-auto">
            {notifications.data?.length === 0 && <p className="py-6 text-sm text-mute">No notifications yet.</p>}
            {notifications.data?.filter((notification) => notification.question_id).map((notification) => (
              <Link
                key={notification.id}
                to="/q/$questionId"
                params={{ questionId: notification.question_id ?? '' }}
                onClick={() => setAlertsOpen(false)}
                className="block border-b py-3 last:border-0"
              >
                <p className="text-sm font-semibold">
                  {notification.type === 'accepted'
                    ? 'An answer was accepted'
                    : notification.type === 'answer'
                      ? `${notification.actor?.full_name ?? 'Someone'} answered`
                      : 'New question for you'}
                  {!notification.read && <span className="ml-2 text-win">●</span>}
                </p>
                <p className="mt-1 text-xs text-mute">{notification.question?.title} · {timeAgo(notification.created_at)}</p>
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
