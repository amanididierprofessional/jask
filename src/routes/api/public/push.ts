import { createFileRoute } from '@tanstack/react-router';
import { authenticateCronRequest } from '@/integrations/supabase/cron-auth';

const deliverPush = async ({ request }: { request: Request }) => {
  const denied = await authenticateCronRequest(request);
  if (denied) return denied;
  const key = process.env['LOVABLE_API_KEY'];
  const connection = process.env['FIREBASE_MESSAGING_API_KEY'];
  if (!key || !connection) return Response.json({ error: 'Push delivery is not configured' }, { status: 503 });
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data: pending, error } = await supabaseAdmin.from('notifications')
    .select('id,user_id,type,question_id,question:questions(title)')
    .is('push_sent_at', null).order('created_at').limit(100);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  let sent = 0;
  for (const n of pending ?? []) {
    const { data: preferences } = await supabaseAdmin.from('notification_preferences')
      .select('enabled,push_enabled').eq('user_id', n.user_id).maybeSingle();
    if (!preferences?.enabled || !preferences.push_enabled) {
      await supabaseAdmin.from('notifications').update({ push_sent_at: new Date().toISOString() }).eq('id', n.id);
      continue;
    }
    const { data: devices } = await supabaseAdmin.from('push_devices').select('id,token').eq('user_id', n.user_id);
    let failed = false;
    for (const device of devices ?? []) {
      const response = await fetch('https://connector-gateway.lovable.dev/firebase_messaging/v1/projects/_/messages:send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'X-Connection-Api-Key': connection, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: {
          token: device.token,
          notification: {
            title: n.type === 'accepted' ? 'Jask · Answer accepted' : n.type === 'answer' ? 'Jask · New answer' : 'Jask · New question',
            body: n.question?.title ?? 'You have a new notification',
          },
          data: { path: n.question_id ? `/q/${n.question_id}` : '/me' },
        } }),
      });
      if (response.ok) sent++;
      else {
        const body = await response.text();
        if (body.includes('UNREGISTERED') || body.includes('INVALID_ARGUMENT')) {
          await supabaseAdmin.from('push_devices').delete().eq('id', device.id);
        } else {
          console.error('Push provider failed', response.status, body);
          failed = true;
        }
      }
    }
    if (!failed) await supabaseAdmin.from('notifications').update({ push_sent_at: new Date().toISOString() }).eq('id', n.id);
  }
  return Response.json({ sent });
};

// Vercel Cron invokes routes with GET; POST remains available for an external scheduler.
export const Route = createFileRoute('/api/public/push')({
  server: { handlers: { GET: deliverPush, POST: deliverPush } },
});
