import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Paperclip, X, FileText, Download, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { referencesQuery } from '@/lib/social-queries';
import type { Tables } from '@/integrations/supabase/types';

type ReferenceItem = Pick<Tables<'post_references'>, 'id' | 'path' | 'name' | 'mime_type' | 'answer_id'>;
const ACCEPT = 'image/*,video/mp4,video/webm,video/quicktime,.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx';

export function FilePicker({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  return <div className="flex flex-wrap items-center gap-2">
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-brand"><Paperclip className="h-4 w-4" />Add photos, videos or documents<input aria-label="Upload photos, videos or documents" type="file" multiple accept={ACCEPT} className="sr-only" onChange={(e) => { onChange([...files, ...Array.from(e.target.files ?? [])]); e.currentTarget.value = ''; }} /></label>
    {files.map((f, i) => <span key={i} className="flex max-w-full items-center gap-1 text-xs text-mute"><span className="truncate">{f.name}</span><Button size="icon" variant="ghost" type="button" aria-label={`Remove ${f.name}`} onClick={() => onChange(files.filter((_, j) => j !== i))}><X className="h-3 w-3" /></Button></span>)}
  </div>;
}

export async function uploadReferences(files: File[], userId: string, questionId: string, answerId?: string) {
  for (const file of files) {
    if (file.size > 20 * 1024 * 1024) throw new Error(`${file.name} exceeds the 20 MB upload limit`);
    const path = `${userId}/${crypto.randomUUID()}/${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error } = await supabase.storage.from('references').upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
    if (error) throw new Error(`Could not upload ${file.name}: ${error.message}`);
    const { error: saveError } = await supabase.from('post_references').insert({ question_id: questionId, answer_id: answerId ?? null, owner_id: userId, path, name: file.name, mime_type: file.type || 'application/octet-stream' });
    if (saveError) { await supabase.storage.from('references').remove([path]); throw new Error(`Could not attach ${file.name}: ${saveError.message}`); }
  }
}

export function ReferenceItems({ items, answerId }: { items: ReferenceItem[]; answerId?: string }) {
  const visible = items.filter((item) => item.answer_id === (answerId ?? null));
  if (!visible.length) return null;
  return <div className="mt-3 grid gap-3">{visible.map((item) => <Reference key={item.id} path={item.path} name={item.name} mimeType={item.mime_type} />)}</div>;
}

export function ReferenceList({ questionId, answerId }: { questionId: string; answerId?: string }) {
  const q = useQuery(referencesQuery(questionId));
  return <ReferenceItems items={q.data ?? []} answerId={answerId} />;
}

function Reference({ path, name, mimeType }: { path: string; name: string; mimeType: string }) {
  const [url, setUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [failed, setFailed] = useState(false);
  const isImage = mimeType.startsWith('image/');
  const isVideo = mimeType.startsWith('video/');
  useEffect(() => {
    let active = true;
    setUrl(''); setDownloadUrl(''); setFailed(false);
    Promise.all([
      supabase.storage.from('references').createSignedUrl(path, 3600),
      supabase.storage.from('references').createSignedUrl(path, 3600, { download: name }),
    ]).then(([preview, download]) => {
      if (!active) return;
      if (preview.error || !preview.data?.signedUrl) setFailed(true);
      else setUrl(preview.data.signedUrl);
      if (!download.error && download.data?.signedUrl) setDownloadUrl(download.data.signedUrl);
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [path, name]);
  if (failed) return <div className="flex items-center justify-between gap-3 rounded-2xl border bg-ground p-3 text-sm"><span className="flex min-w-0 items-center gap-2 text-mute"><FileText className="h-5 w-5 shrink-0" /><span className="truncate">{name}</span></span><span className="text-xs text-mute">Preview unavailable</span></div>;
  if (!url) return <div className="rounded-2xl border bg-ground p-3 text-sm text-mute">Loading {name}…</div>;
  if (isImage) return <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border bg-ground"><img src={url} alt={name} loading="lazy" className="max-h-[520px] w-full object-contain" /><span className="block truncate px-3 py-2 text-xs text-mute">{name}</span></a>;
  if (isVideo) return <div className="overflow-hidden rounded-2xl border bg-black"><video src={url} controls playsInline preload="metadata" className="max-h-[520px] w-full" aria-label={name}>Your browser cannot play this video.</video><p className="truncate bg-card px-3 py-2 text-xs text-mute"><Play className="mr-1 inline h-3 w-3" />{name}</p></div>;
  return <div className="flex items-center gap-3 rounded-2xl border bg-ground p-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><FileText className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{name}</span><span className="text-xs text-mute">Document · Download to open</span></span><a href={downloadUrl || url} download={name} target="_blank" rel="noreferrer" className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-brand px-3 text-xs font-bold text-brand-foreground"><Download className="h-4 w-4" />Download</a></div>;
}
