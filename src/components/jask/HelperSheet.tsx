import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { peopleQuery } from '@/lib/social-queries';
import { useAuth } from '@/lib/auth';
import { useInvite,useMyInvites } from '@/lib/mutations';
import { Avatar } from './ui';
export function HelperSheet({open,onOpenChange,questionId,excludeIds=[]}:{open:boolean;onOpenChange:(o:boolean)=>void;questionId:string;courseId:string;courseName:string;excludeIds?:string[]}){const [s,setS]=useState('');const people=useQuery({...peopleQuery(s),enabled:open});const {userId}=useAuth();const invite=useInvite();const invites=useMyInvites();return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Tag a person</DialogTitle><DialogDescription>Invite someone with a Jask account.</DialogDescription></DialogHeader><input aria-label="Search people" placeholder="Search people" value={s} onChange={e=>setS(e.target.value)} className="h-11 rounded-lg border px-3"/><div className="max-h-96 space-y-3 overflow-y-auto">{people.data?.filter(p=>p.id!==userId&&!excludeIds.includes(p.id)).map(p=><div key={p.id} className="flex items-center gap-3"><Avatar name={p.full_name} url={p.avatar_url}/><span className="flex-1 text-sm">{p.full_name}</span><Button size="sm" disabled={invite.isPending||invites.data?.has(`${questionId}:${p.id}`)} onClick={()=>invite.mutate({questionId,helperId:p.id,helperName:p.full_name})}>{invites.data?.has(`${questionId}:${p.id}`)?'Tagged':'Tag'}</Button></div>)}{people.data?.length===0&&<p className="text-sm text-mute">No accounts found.</p>}</div></DialogContent></Dialog>}
