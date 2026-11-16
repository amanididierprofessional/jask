import { createFileRoute, redirect } from '@tanstack/react-router';
import { pageHead } from '@/lib/head';
export const Route=createFileRoute('/communities/')({head:()=>pageHead('Communities','Find and join real communities on Jask.'),beforeLoad:()=>{throw redirect({to:'/',search:{tab:'communities'}})}});