import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, ImagePlus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { communitiesQuery, membershipsQuery } from '@/lib/social-queries';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { EmptyState } from '@/components/jask/ui';
import { CommunityImage } from '@/components/jask/CommunityImage';

export function CommunitiesView() {
  const { userId, profile } = useAuth();
  const qc = useQueryClient();
  const q = useQuery(communitiesQuery());
  const joined = useQuery(membershipsQuery(userId));
  const [s, setS] = useState('');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [campus, setCampus] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setBusy(true);
    let communityId: string | undefined;
    let uploadedPath: string | undefined;
    try {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      if (slug.length < 2) throw new Error('Use at least two letters for the community name');
      const { data, error } = await supabase
        .from('communities')
        .insert({
          name: name.trim(),
          slug,
          description,
          institution_id: campus ? (profile?.institution_id ?? null) : null,
          creator_id: userId,
        })
        .select('id')
        .single();
      if (error) throw error;
      communityId = data.id;
      if (image) {
        if (image.size > 8 * 1024 * 1024) throw new Error('Community images must be 8 MB or smaller');
        uploadedPath = `${userId}/communities/${data.id}/${crypto.randomUUID()}-${image.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const { error: uploadError } = await supabase.storage
          .from('references')
          .upload(uploadedPath, image, { contentType: image.type, upsert: false });
        if (uploadError) throw uploadError;
        const { error: updateError } = await supabase
          .from('communities')
          .update({ image_path: uploadedPath })
          .eq('id', data.id);
        if (updateError) throw updateError;
      }
      const { error: joinError } = await supabase
        .from('community_members')
        .insert({ community_id: data.id, user_id: userId });
      if (joinError) throw joinError;
      qc.invalidateQueries({ queryKey: ['communities'] });
      qc.invalidateQueries({ queryKey: ['me', 'communities'] });
      setOpen(false);
      setName('');
      setDescription('');
      setImage(null);
      toast.success('Community created');
    } catch (e) {
      if (uploadedPath) await supabase.storage.from('references').remove([uploadedPath]);
      toast.error(
        communityId
          ? `Community created, but setup was incomplete: ${(e as Error).message}`
          : (e as Error).message,
      );
      qc.invalidateQueries({ queryKey: ['communities'] });
    } finally {
      setBusy(false);
    }
  };

  const visible =
    q.data?.filter((c) => `${c.name} ${c.description}`.toLowerCase().includes(s.toLowerCase())) ?? [];

  return (
    <div className="pb-20 md:pb-6">
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background/95 px-3 py-2 backdrop-blur sm:px-4">
        <div className="flex flex-1 items-center gap-2 rounded-full border bg-muted/50 px-3 focus-within:border-brand/40 focus-within:bg-card">
          <Search className="h-4 w-4 shrink-0 text-mute" />
          <input
            aria-label="Search communities"
            value={s}
            onChange={(e) => setS(e.target.value)}
            placeholder="Search communities"
            className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-mute"
          />
        </div>
        {userId ? (
          <Button size="sm" variant="outline" className="shrink-0 rounded-full" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Create
          </Button>
        ) : (
          <Link to="/auth" className="shrink-0 text-sm font-semibold text-brand">
            Sign in
          </Link>
        )}
      </div>

      <div>
        {visible.map((c) => (
          <Link
            key={c.id}
            to="/communities/$communityId"
            params={{ communityId: c.id }}
            className="flex gap-3 border-b px-3 py-3 transition-colors hover:bg-muted/40 sm:px-4"
          >
            <CommunityImage path={c.image_path} name={c.name} size="small" />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[15px] font-bold">c/{c.slug}</h2>
              <p className="text-[12px] text-mute">
                {c.members} members · {c.posts} posts
                {joined.data?.some((m) => m.community_id === c.id) ? ' · Joined' : ''}
              </p>
              {c.description && (
                <p className="mt-1 line-clamp-2 text-[13px] text-ink/75">{c.description}</p>
              )}
            </div>
          </Link>
        ))}
        {q.data && visible.length === 0 && (
          <EmptyState title="A place for your people" body="No matching communities found." />
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create community</DialogTitle>
            <DialogDescription>A new home for your conversations.</DialogDescription>
          </DialogHeader>
          <form onSubmit={create} className="space-y-4">
            <label className="block text-sm">
              Name
              <input
                required
                minLength={2}
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 h-11 w-full rounded-md border px-3"
              />
            </label>
            <label className="block text-sm">
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                className="mt-1 w-full rounded-md border p-3"
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm">
              <ImagePlus className="h-5 w-5 text-brand" />
              <span className="flex-1">{image?.name ?? 'Add a community profile image'}</span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              />
            </label>
            {profile?.institution_id && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={campus} onChange={(e) => setCampus(e.target.checked)} />
                Connect to my campus
              </label>
            )}
            <Button disabled={busy} type="submit">
              {busy ? 'Creating…' : 'Create community'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
