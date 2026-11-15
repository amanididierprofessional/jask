import { createFileRoute } from '@tanstack/react-router';
import { FeedView } from '@/components/jask/FeedView';
import { pageHead } from '@/lib/head';
export const Route=createFileRoute('/')({head:()=>pageHead('My Courses','Questions and conversations from your courses on Jask.'),component:Home});
function Home(){return <FeedView mine/>}
