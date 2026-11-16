import { createFileRoute } from '@tanstack/react-router';
import { FeedView } from '@/components/jask/FeedView';
import { pageHead } from '@/lib/head';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { CommunitiesView } from '@/components/jask/CommunitiesView';
import { useAuth } from '@/lib/auth';
import { homeUpdatesQuery } from '@/lib/queries';
import { membershipsQuery } from '@/lib/social-queries';
import { homeUpdateCounts } from '@/lib/home-updates';
import { cn } from '@/lib/utils';
import { BrandMark } from '@/components/jask/ui';
export const Route=createFileRoute('/')({validateSearch:(s:Record<string,unknown>):{tab?:'courses'|'campus'|'communities'}=>s['tab']==='campus'||s['tab']==='communities'?{tab:s['tab']}:{},head:()=>pageHead('Home','Your courses, campus conversations and communities on Jask.'),component:Home});
function Home(){
  const {tab='courses'}=Route.useSearch();
  const {userId,profile,enrolledCourseIds}=useAuth();
  const updates=useQuery(homeUpdatesQuery(userId));
  const memberships=useQuery(membershipsQuery(userId));
  const counts=homeUpdateCounts(updates.data??[],enrolledCourseIds,profile?.institution_id??null,(memberships.data??[]).map(m=>m.community_id));
  return <><div className="px-4 pt-5 md:hidden"><BrandMark/></div><nav aria-label="Home feeds" className="sticky top-0 z-20 grid grid-cols-3 border-b bg-ground px-2 pt-3">
    {(['courses','campus','communities'] as const).map(value=><Link key={value} to="/" search={{tab:value}} aria-current={tab===value?'page':undefined} className={cn('relative flex h-14 items-center justify-center gap-2 border-b-2 border-transparent text-sm font-bold text-mute',tab===value&&'border-brand text-brand')}>
      {value==='courses'?'My Courses':value==='campus'?'Campus':'Communities'}
      {value==='courses'&&counts.courses>0?<span aria-label={`${counts.courses} unread course updates`} className="grid h-5 min-w-5 place-items-center rounded-full bg-win px-1 text-xs text-ink">{counts.courses}</span>:value!=='courses'&&counts[value]&&<span aria-label={`New ${value} updates`} className="absolute right-2 top-2 h-2 w-2 rounded-full bg-win"/>}
    </Link>)}
  </nav>{tab==='communities'?<CommunitiesView/>:<FeedView key={tab} mine={tab==='courses'}/>}</>;
}
