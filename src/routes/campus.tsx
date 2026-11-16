import { createFileRoute,redirect } from '@tanstack/react-router';
import { pageHead } from '@/lib/head';
export const Route=createFileRoute('/campus')({head:()=>pageHead('Campus Feed','Popular questions and trending communities from your campus.'),beforeLoad:()=>{throw redirect({to:'/',search:{tab:'campus'}})}});
