import { describe,it,expect } from 'vitest';
import { receivesAudience,validStudyYear,hotScore,defaultHomeScope } from '@/lib/social-rules';
describe('Jask product rules',()=>{
 it('opens My Courses by default',()=>expect(defaultHomeScope).toBe('mine'));
 it('turning all notifications off excludes every audience',()=>{for(const audience of ['courses','communities','campus'] as const)expect(receivesAudience({enabled:false,courses:true,communities:true,campus:true},audience)).toBe(false)});
 it('course and community choices do not opt into the entire campus',()=>{const p={enabled:true,courses:true,communities:true,campus:false};expect(receivesAudience(p,'courses')).toBe(true);expect(receivesAudience(p,'communities')).toBe(true);expect(receivesAudience(p,'campus')).toBe(false)});
 it('campus opt-in receives campus activity',()=>expect(receivesAudience({enabled:true,courses:false,communities:false,campus:true},'campus')).toBe(true));
 it('current years 1, 2, 3 are accepted instead of graduation dates',()=>{[1,2,3].forEach(y=>expect(validStudyYear(y)).toBe(true));expect(validStudyYear(2027)).toBe(false);expect(validStudyYear(1.5)).toBe(false)});
 it('real upvotes improve popular ranking',()=>expect(hotScore(10,0,0,1)).toBeGreaterThan(hotScore(0,0,0,1)));
 it('more distinct interactions improve popular ranking',()=>expect(hotScore(0,4,3,1)).toBeGreaterThan(hotScore(0,1,1,1)));
 it('older posts lose priority when engagement is equal',()=>expect(hotScore(10,4,3,1)).toBeGreaterThan(hotScore(10,4,3,48)));
});
