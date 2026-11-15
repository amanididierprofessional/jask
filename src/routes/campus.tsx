import { createFileRoute } from '@tanstack/react-router';
import { FeedView } from '@/components/jask/FeedView';
import { pageHead } from '@/lib/head';
export const Route=createFileRoute('/campus')({head:()=>pageHead('Campus Feed','Popular questions and trending communities from your campus.'),component:Campus});
function Campus(){return <FeedView/>}
