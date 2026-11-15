import { useEffect,useRef } from 'react';
import { useQuery,useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { notificationsQuery } from '@/lib/queries';
import { useAuth } from '@/lib/auth';
export function NotificationListener(){const {userId}=useAuth();const q=useQuery(notificationsQuery(userId));const seen=useRef<Set<string>|null>(null);const qc=useQueryClient();const nav=useNavigate();useEffect(()=>{seen.current=null},[userId]);useEffect(()=>{if(!q.data)return;if(!seen.current){seen.current=new Set(q.data.map(n=>n.id));return}for(const n of q.data){if(!seen.current.has(n.id)&&!n.read)toast(n.type==='accepted'?'An answer was accepted':n.type==='answer'?'New answer':'You have a new question',{description:n.question?.title,action:n.question_id?{label:'View',onClick:()=>nav({to:'/q/$questionId',params:{questionId:n.question_id??''}})}:undefined});seen.current.add(n.id)}},[q.data,nav]);useEffect(()=>{if(!userId)return;const onFocus=()=>qc.invalidateQueries({queryKey:['me','notifications']});window.addEventListener('focus',onFocus);return()=>window.removeEventListener('focus',onFocus)},[userId,qc]);return null}
