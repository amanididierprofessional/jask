import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Paperclip, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { referencesQuery } from '@/lib/social-queries';
import type { Tables } from '@/integrations/supabase/types';

type ReferenceItem = Pick<Tables<'post_references'>, 'id' | 'path' | 'name' | 'mime_type' | 'answer_id'>;

export function FilePicker({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  return <div className="flex flex-wrap items-center gap-2">
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-brand"><Paperclip className="h-4 w-4" />Add reference<input aria-label="Upload references" type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx" className="sr-only" onChange={(e) => onChange([...files, ...Array.from(e.target.files ?? [])])} /></label>
    {files.map((f, i) => <span key={i} className="flex max-w-full items-center gap-1 text-xs text-mute"><span className="truncate">{f.name}</span><Button size="icon" variant="ghost" type="button" aria-label={`Remove ${f.name}`} onClick={() => onChange(files.filter((_, j) => i !== j))}><X className="h-3 w-3" /></Button></span>)}
  </div>;
}

export async function uploadReferences(files: File[], userId: string, questionId: string, answerId?: string) {
  for (const file of files) {
    if (file.size > 20 * 1024 * 1024) throw new Error(`${file.name} exceeds the 20 MB upload limit`);
    const path = `${userId}/${crypto.randomUUID()}/${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error } = await supabase.storage.from('references').upload(path, file);
    if (error) throw error;
    const { error: saveError } = await supabase.from('post_references').insert({ question_id: questionId, answer_id: answerId ?? null, owner_id: userId, path, name: file.name, mime_type: file.type || 'application/octet-stream' });
    if (saveError) { await supabase.storage.from('references').remove([path]); throw saveError; }
  }
}

export function ReferenceItems({ items, answerId }: { items: ReferenceItem[]; answerId?: string }) {
  const visible = items.filter((item) => item.answer_id === (answerId ?? null));
  if (!visible.length) return null;
  return <div className="mt-3 grid gap-2">{visible.map((item) => <Reference key={item.id} path={item.path} name={item.name} image={item.mime_type.startsWith('image/')} />)}</div>;
}

export function ReferenceList({ questionId, answerId }: { questionId: string; answerId?: string }) {
  const q = useQuery(referencesQuery(questionId));
  return <ReferenceItems items={q.data ?? []} answerId={answerId} />;
}

function Reference({ path, name, image }: { path: string; name: string; image: boolean }) {
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setUrl(''); setFailed(false);
    supabase.storage.from('references').createSignedUrl(path, 3600).then(({ data, error }) => {
      if (!active) return;
      if (error || !data?.signedUrl) setFailed(true);
      else setUrl(data.signedUrl);
    });
    return () => { active = false; };
  }, [path]);
  if (failed) return <p className="flex items-center gap-2 rounded-xl bg-ground px-3 py-2 text-xs text-mute"><FileText className="h-4 w-4" />{name} · Preview unavailable</p>;
  if (!url) return <p className="flex items-center gap-2 rounded-xl bg-ground px-3 py-2 text-xs text-mute"><FileText className="h-4 w-4" />{name}</p>;
  return <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border bg-ground text-sm text-brand">
    {image ? <img src={url} alt={name} loading="lazy" className="max-h-80 max-w-full object-contain" /> : <span className="flex items-center gap-2 px-3 py-3"><FileText className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1 truncate">{name}</span><span className="text-xs">Open</span></span>}
  </a>;
}
