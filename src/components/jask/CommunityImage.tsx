import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function CommunityImage({
  path,
  name,
  size = 'large',
}: {
  path: string | null;
  name: string;
  size?: 'small' | 'large';
}) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let active = true;
    setUrl('');
    if (!path) return;
    supabase.storage
      .from('references')
      .createSignedUrl(path, 3600)
      .then(({ data, error }) => {
        if (active && !error && data?.signedUrl) setUrl(data.signedUrl);
      });
    return () => {
      active = false;
    };
  }, [path]);

  const cls =
    size === 'small'
      ? 'h-8 w-8 rounded-md'
      : 'h-20 w-20 rounded-lg';

  return url ? (
    <img src={url} alt={name} className={`${cls} shrink-0 object-cover`} />
  ) : (
    <span
      className={`${cls} grid shrink-0 place-items-center bg-brand/10 font-display font-black text-brand ${size === 'small' ? 'text-sm' : 'text-2xl'}`}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
