import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { MessageCircle, UserPlus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FeedItem } from '@/lib/queries';
import { timeAgo } from '@/lib/format';
import { Avatar, Card } from './ui';
import { PostVote } from './PostVote';
import { HelperSheet } from './HelperSheet';
export function QuestionCard({q}:{q:FeedItem}){const [open,setOpen]=useState(false);return <Card><div className="flex items-center gap-3"><Avatar name={q.author?.full_name??''} url={q.author?.avatar_url} size={36}/><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{q.author?.full_name}</p><p className="text-xs text-mute">{timeAgo(q.created_at)}{q.course?` · ${q.course.name}`:''}</p></div>{q.accepted_answer_id&&<Check className="h-5 w-5 text-win"/>}</div><Link to="/q/$questionId" params={{questionId:q.id}} className="mt-4 block font-display text-lg font-extrabold leading-snug">{q.title}</Link>{q.tag&&<p className="mt-2 text-xs text-brand">{q.tag}</p>}<div className="mt-4 flex flex-wrap items-center gap-2"><PostVote id={q.id}/><Link to="/q/$questionId" params={{questionId:q.id}} className="flex items-center gap-2 px-2 text-sm text-mute"><MessageCircle className="h-4 w-4"/>{q.answer_count} answers</Link><Button variant="ghost" size="sm" onClick={()=>setOpen(true)} className="ml-auto"><UserPlus className="h-4 w-4"/>Tag person</Button></div><HelperSheet open={open} onOpenChange={setOpen} questionId={q.id} courseId={q.course_id??''} courseName={q.course?.name??'this question'} excludeIds={q.author?.id?[q.author.id]:[]}/></Card>}
