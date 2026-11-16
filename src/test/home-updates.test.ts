import { describe, expect, it } from 'vitest';
import { homeUpdateCounts } from '@/lib/home-updates';
describe('Home update indicators',()=>{
  it('counts every unread course notification once, without a display cap',()=>{
    const items=Array.from({length:125},(_,i)=>({id:String(i),courseId:'course',campusId:'campus',communityIds:['group']}));
    const first=items[0];
    if(!first) throw new Error('Missing test input');
    expect(homeUpdateCounts([...items,first],['course'],'campus',['group']).courses).toBe(125);
  });
  it('uses a boolean dot for campus updates',()=>{
    expect(homeUpdateCounts([{id:'1',courseId:null,campusId:'campus',communityIds:[]}],[],'campus',[]).campus).toBe(true);
    expect(homeUpdateCounts([{id:'1',courseId:null,campusId:'other',communityIds:[]}],[],'campus',[]).campus).toBe(false);
  });
  it('uses a boolean dot only for joined community updates',()=>{
    expect(homeUpdateCounts([{id:'1',courseId:null,campusId:null,communityIds:['group']}],[],null,['group']).communities).toBe(true);
    expect(homeUpdateCounts([{id:'1',courseId:null,campusId:null,communityIds:['other']}],[],null,['group']).communities).toBe(false);
  });
});