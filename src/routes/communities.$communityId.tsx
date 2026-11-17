import { useState } from 'react';
import { createFileRoute,Link } from '@tanstack/react-router';
import { useQuery,useMutation,useQueryClient } from '@tanstack/react-query';
import { ImagePlus,Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { FeedView } from '@/components/jask/FeedView';
import { communitiesQuery,membershipsQuery } from '@/lib/social-queries';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { pageHead } from '@/lib/head';
import { CommunityImage } from '@/components/jask/CommunityImage';

export const Route=createFileRoute('/communities/$communityId')({head:()=>pageHead('Community conversations','Posts, questions and people in a Jask community.'),component:Community});
function Community(){
  const {communityId}=Route.useParams();const {userId}=useAuth();const qc=useQueryClient();const q=useQuery(communitiesQuery());const memberships=useQuery(membershipsQuery(userId));const [uploading,setUploading]=useState(false);
  const joined=memberships.data?.some(m=>m.community_id===communityId);const community=q.data?.find(c=>c.id===communityId);const isCreator=community?.creator_id===userId;
  const toggle=useMutation({mutationFn:async()=>{if(!userId)throw new Error('Sign in to join');const {error}=joined?await supabase.from('community_members').delete().eq('user_id',userId).eq('community_id',communityId):await supabase.from('community_members').insert({user_id:userId,community_id:communityId});if(error)throw error;},onSuccess:()=>{qc.invalidateQueries({queryKey:['communities']});qc.invalidateQueries({queryKey:['me','communities']})},onError:e=>toast.error(e.message)});
  const changeImage=async(file?:File)=>{if(!file||!userId||!community)return;if(!file.type.startsWith('image/')){toast.error('Choose an image file');return;}if(file.size>8*1024*1024){toast.error('Community images must be 8 MB or smaller');return;}setUploading(true);let path='';try{path=`${userId}/communities/${communityId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;const {error:uploadError}=await supabase.storage.from('references').upload(path,file,{contentType:file.type,upsert:false});if(uploadError)throw uploadError;const {error:updateError}=await supabase.from('communities').update({image_path:path}).eq('id',communityId);if(updateError)throw updateError;if(community.image_path)await supabase.storage.from('references').remove([community.image_path]);await qc.invalidateQueries({queryKey:['communities']});toast.success('Community image updated');}catch(e){if(path)await supabase.storage.from('references').remove([path]);toast.error((e as Error).message);}finally{setUploading(false)}};
  if(q.isLoading)return <p className="p-5 text-mute">Loading community…</p>;if(!community)return <p className="p-5">Community not found.</p>;
  return <><div className="px-4 pt-5"><div className="mb-4 flex items-center justify-between gap-3"><Link to="/communities" className="text-sm text-brand">← Communities</Link>{userId?<Button size="sm" variant={joined?'outline':'default'} disabled={toggle.isPending} onClick={()=>toggle.mutate()}>{joined?'Leave':'Join community'}</Button>:<Link to="/auth" className="text-sm text-brand">Sign in to join</Link>}</div>
    <section className="rounded-[28px] border bg-card p-4"><div className="flex items-center gap-4"><CommunityImage path={community.image_path} name={community.name}/><div className="min-w-0 flex-1"><h1 className="break-words text-xl font-black">c/{community.slug}</h1><p className="mt-1 text-xs text-mute">{community.members} members · {community.posts} posts</p></div></div><p className="mt-4 whitespace-pre-wrap text-sm text-mute">{community.description}</p>{isCreator&&<label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-brand"><ImagePlus className="h-4 w-4"/>{uploading?'Uploading…':'Change community image'}<input type="file" accept="image/*" disabled={uploading} className="sr-only" onChange={e=>{void changeImage(e.target.files?.[0]);e.currentTarget.value='';}}/></label>}</section>
  </div><FeedView communityId={communityId}/></>;
}
