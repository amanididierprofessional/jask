import { useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, Search, Tag, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { coursesQuery } from '@/lib/queries';
import { communitiesQuery, peopleQuery } from '@/lib/social-queries';
import { pageHead } from '@/lib/head';
import { Avatar, BackHeader, EmptyState } from '@/components/jask/ui';
import { FilePicker, uploadReferences } from '@/components/jask/Attachments';

export const Route = createFileRoute('/_authenticated/ask')({
  validateSearch: (s: Record<string, unknown>) => ({
    course: typeof s['course'] === 'string' ? s['course'] : undefined,
    community: typeof s['community'] === 'string' ? s['community'] : undefined,
  }),
  head: () => pageHead('Just Ask', 'Post a question and tag relevant people and communities.'),
  component: Ask,
});

function Ask() {
  const initial = Route.useSearch();
  const { userId, profile } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const courses = useQuery(coursesQuery());
  const communities = useQuery(communitiesQuery());
  const [course, setCourse] = useState(initial.course ?? '');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagged, setTagged] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[]>(initial.community ? [initial.community] : []);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const selectedPeopleQuery = useQuery({
    queryKey: ['tagged-people', tagged],
    enabled: tagged.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from('public_profiles').select('id, full_name, avatar_url').in('id', tagged);
      if (error) throw error;
      return data;
    },
  });

  if (profile && !profile.onboarded) return <EmptyState title="Finish your profile first" body="Select your college and department." action={<Link to="/onboarding" className="text-brand">Set up profile</Link>} />;

  const publish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (!course && !groups.length) { toast.error('Select a course or tag a community'); return; }
    setBusy(true);
    let postedId: string | undefined;
    try {
      const { data, error } = await supabase.from('questions').insert({
        author_id: userId, institution_id: profile?.institution_id ?? null,
        course_id: course || null, title: title.trim(), body: body.trim(), tag: null,
      }).select('id').single();
      if (error) throw error;
      postedId = data.id;
      if (groups.length) {
        const { error: groupError } = await supabase.from('question_communities').insert(groups.map((community_id) => ({ question_id: data.id, community_id })));
        if (groupError) throw groupError;
      }
      if (tagged.length) {
        const { error: peopleError } = await supabase.from('helper_invites').insert(tagged.map((helper_id) => ({ question_id: data.id, helper_id, inviter_id: userId })));
        if (peopleError) throw peopleError;
      }
      await uploadReferences(files, userId, data.id);
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['communities'] });
      toast.success('Question published');
      nav({ to: '/q/$questionId', params: { questionId: data.id } });
    } catch (e) {
      toast.error(postedId ? `Question posted, but a reference or tag failed: ${(e as Error).message}` : (e as Error).message);
      if (postedId) nav({ to: '/q/$questionId', params: { questionId: postedId } });
    } finally { setBusy(false); }
  };

  const selectedPeople = selectedPeopleQuery.data ?? [];
  const selectedCommunities = communities.data?.filter((c) => groups.includes(c.id)) ?? [];
  const field = 'mt-1 w-full rounded-lg border bg-card px-3 py-3 text-sm outline-none focus:border-brand';

  return <>
    <BackHeader title="Just Ask" />
    <form onSubmit={publish} className="space-y-5 px-4 pb-12">
      <label className="block text-sm font-semibold">Course
        <select aria-label="Course" value={course} onChange={(e) => setCourse(e.target.value)} className={field}>
          <option value="">Community post (no course)</option>
          {courses.data?.filter((c) => c.institution_id === profile?.institution_id).map((c) => <option key={c.id} value={c.id}>{c.name} · {c.code}</option>)}
        </select>
      </label>
      <Link to="/courses" className="block text-xs text-brand">Don't see your course? Add it</Link>
      <label className="block text-sm font-semibold">Question
        <input aria-label="Question" required minLength={8} maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} className={field} placeholder="What would you like to ask?" />
      </label>
      <label className="block text-sm font-semibold">Details
        <textarea aria-label="Details" rows={5} maxLength={5000} value={body} onChange={(e) => setBody(e.target.value)} onPaste={(e) => { const images = Array.from(e.clipboardData.files); if (images.length) { e.preventDefault(); setFiles((f) => [...f, ...images]); } }} className={field} />
      </label>
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div><h2 className="font-bold">Tag</h2><p className="text-xs text-mute">Notify people and share your question with communities</p></div>
          <Button type="button" variant="outline" className="rounded-full" onClick={() => setPickerOpen(true)}><Tag className="h-4 w-4" />{tagged.length + groups.length ? 'Edit tags' : 'Tag'}</Button>
        </div>
        {(tagged.length > 0 || groups.length > 0) ? <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-3">
          {selectedPeople.length > 0 && <div className="flex items-center">{selectedPeople.slice(0, 7).map((p, i) => <Avatar key={p.id} name={p.full_name ?? ''} url={p.avatar_url} size={36} ring="white" className={i ? '-ml-2' : ''} />)}{selectedPeople.length > 7 && <span className="-ml-2 grid h-9 w-9 place-items-center rounded-full bg-secondary text-[11px] font-bold text-brand ring-2 ring-card">+{selectedPeople.length - 7}</span>}</div>}
          {selectedCommunities.map((c) => <span key={c.id} className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand"><Users className="h-3.5 w-3.5" />c/{c.slug}</span>)}
        </div> : <button type="button" onClick={() => setPickerOpen(true)} className="flex w-full items-center gap-3 rounded-2xl border border-dashed p-4 text-left text-sm text-mute transition hover:border-brand hover:text-brand"><span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-brand"><Users className="h-5 w-5" /></span>Choose people or communities to tag</button>}
      </section>
      <FilePicker files={files} onChange={setFiles} />
      <Button className="h-12 w-full rounded-full" disabled={busy} type="submit">{busy ? 'Publishing…' : 'Publish question'}</Button>
    </form>
    <TagPicker open={pickerOpen} onOpenChange={setPickerOpen} userId={userId ?? ''} tagged={tagged} groups={groups} onConfirm={(p, c) => { setTagged(p); setGroups(c); setPickerOpen(false); }} />
  </>;
}

function TagPicker({ open, onOpenChange, userId, tagged, groups, onConfirm }: {
  open: boolean; onOpenChange: (open: boolean) => void; userId: string;
  tagged: string[]; groups: string[]; onConfirm: (people: string[], communities: string[]) => void;
}) {
  const [tab, setTab] = useState('people');
  const [search, setSearch] = useState('');
  const [peopleSelected, setPeopleSelected] = useState<string[]>(tagged);
  const [groupsSelected, setGroupsSelected] = useState<string[]>(groups);
  const people = useQuery({ ...peopleQuery(search), enabled: open });
  const communities = useQuery({ ...communitiesQuery(), enabled: open });
  const toggle = (items: string[], id: string) => items.includes(id) ? items.filter((x) => x !== id) : [...items, id];

  return <Dialog open={open} onOpenChange={(next) => { if (next) { setPeopleSelected(tagged); setGroupsSelected(groups); } onOpenChange(next); }}>
    <DialogContent className="max-h-[85dvh] max-w-[440px] overflow-hidden rounded-[28px] p-0">
      <DialogHeader className="px-5 pt-5"><DialogTitle className="text-xl font-black">Tag people and communities</DialogTitle><DialogDescription>Choose who should see your question and who you'd like to invite.</DialogDescription></DialogHeader>
      <Tabs value={tab} onValueChange={setTab} className="min-h-0">
        <TabsList className="mx-5 grid w-[calc(100%-2.5rem)] grid-cols-2">
          <TabsTrigger value="people">People {peopleSelected.length > 0 && <span className="ml-1 text-xs">({peopleSelected.length})</span>}</TabsTrigger>
          <TabsTrigger value="communities">Communities {groupsSelected.length > 0 && <span className="ml-1 text-xs">({groupsSelected.length})</span>}</TabsTrigger>
        </TabsList>
        <TabsContent value="people" className="mt-0">
          <div className="mx-5 my-3 flex items-center gap-2 rounded-full border bg-card px-3"><Search className="h-4 w-4 text-mute" /><input aria-label="Search people" placeholder="Search people" value={search} onChange={(e) => setSearch(e.target.value)} className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none" /></div>
          <div className="max-h-[42dvh] overflow-y-auto px-5 pb-3">
            {people.data?.filter((p) => p.id !== userId).map((p) => { const checked = peopleSelected.includes(p.id); return <button key={p.id} type="button" onClick={() => setPeopleSelected((v) => toggle(v, p.id))} className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-secondary"><Avatar name={p.full_name} url={p.avatar_url} size={42} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{p.full_name}</span><span className="block truncate text-xs text-mute">{[p.major, p.study_year ? `Year ${p.study_year}` : null].filter(Boolean).join(' · ')}</span></span><span className={`grid h-6 w-6 place-items-center rounded-full border ${checked ? 'border-brand bg-brand text-white' : 'border-ink/20'}`}>{checked && <Check className="h-4 w-4" />}</span></button>; })}
            {people.isLoading && <p className="py-6 text-center text-sm text-mute">Loading people…</p>}
            {!people.isLoading && people.data?.filter((p) => p.id !== userId).length === 0 && <p className="py-6 text-center text-sm text-mute">No people found.</p>}
          </div>
        </TabsContent>
        <TabsContent value="communities" className="mt-0"><div className="max-h-[49dvh] overflow-y-auto px-5 py-3">
          {communities.data?.map((c) => { const checked = groupsSelected.includes(c.id); return <button key={c.id} type="button" onClick={() => setGroupsSelected((v) => toggle(v, c.id))} className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-secondary"><span className="grid h-11 w-11 place-items-center rounded-full bg-brand/10 text-brand"><Users className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">c/{c.slug}</span><span className="block truncate text-xs text-mute">{c.members} members</span></span><span className={`grid h-6 w-6 place-items-center rounded-full border ${checked ? 'border-brand bg-brand text-white' : 'border-ink/20'}`}>{checked && <Check className="h-4 w-4" />}</span></button>; })}
          {communities.isLoading && <p className="py-6 text-center text-sm text-mute">Loading communities…</p>}
          {!communities.isLoading && communities.data?.length === 0 && <p className="py-6 text-center text-sm text-mute">No communities available yet.</p>}
        </div></TabsContent>
      </Tabs>
      <div className="border-t bg-card p-4"><Button className="h-12 w-full rounded-full" onClick={() => onConfirm(peopleSelected, groupsSelected)}>Tag {peopleSelected.length + groupsSelected.length ? `(${peopleSelected.length + groupsSelected.length})` : 'selected'}</Button></div>
    </DialogContent>
  </Dialog>;
}
