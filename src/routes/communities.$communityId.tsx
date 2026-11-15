import { createFileRoute,Link } from '@tanstack/react-router';
import { useQuery,useMutation,useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { FeedView } from '@/components/jask/FeedView';
import { communitiesQuery,membershipsQuery } from '@/lib/social-queries';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { pageHead } from '@/lib/head';
export const Route=createFileRoute('/communities/$communityId')({head:()=>pageHead('Community conversations','Posts, questions and people in a Jask community.'),component:Community});
function Community(){const {communityId}=Route.useParams();const {userId}=useAuth();const qc=useQueryClient();const q=useQuery(communitiesQuery());const memberships=useQuery(membershipsQuery(userId));const joined=memberships.data?.some(m=>m.community_id===communityId);const community=q.data?.find(c=>c.id===communityId);const toggle=useMutation({mutationFn:async()=>{if(!userId)throw new Error('Sign in to join');const {error}=joined?await supabase.from('community_members').delete().eq('user_id',userId).eq('community_id',communityId):await supabase.from('community_members').insert({user_id:userId,community_id:communityId});if(error)throw error;},onSuccess:()=>{qc.invalidateQueries({queryKey:['communities']});qc.invalidateQueries({queryKey:['me','communities']})},onError:e=>toast.error(e.message)});if(q.isLoading)return <p className="p-5 text-mute">Loading community…</p>;if(!community)return <p className="p-5">Community not found.</p>;return <><div className="flex items-center justify-between gap-3 px-4 pt-5"><Link to="/communities" className="text-sm text-brand">← Communities</Link>{userId?<Button size="sm" variant={joined?'outline':'default'} disabled={toggle.isPending} onClick={()=>toggle.mutate()}>{joined?'Leave':'Join community'}</Button>:<Link to="/auth" className="text-sm text-brand">Sign in to join</Link>}</div><p className="px-4 pt-4 text-sm text-mute">{community.description}</p><FeedView communityId={communityId}/></>}
