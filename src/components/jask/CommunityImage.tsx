import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function CommunityImage({ path, name, size = 'large' }: { path: string | null; name: string; size?: 'small' | 'large' }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let active = true;
    setUrl('');
    if (!path) return;
    supabase.storage.from('references').createSignedUrl(path, 3600).then(({ data, error }) => {
      if (active && !error && data?.signedUrl) setUrl(data.signedUrl);
    });
    return () => { active = false; };
  }, [path]);
  const cls = size === 'small' ? 'h-12 w-12 rounded-2xl' : 'h-24 w-24 rounded-[28px]';
  return url ? <img src={url} alt={name} className={`${cls} shrink-0 object-cover`} /> : <span className={`${cls} grid shrink-0 place-items-center bg-brand/10 font-display font-black text-brand ${size === 'small' ? 'text-lg' : 'text-3xl'}`}>{name.trim().charAt(0).toUpperCase()}</span>;
}
