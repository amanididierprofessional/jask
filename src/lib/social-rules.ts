export type NotificationChoices = { enabled: boolean; courses: boolean; communities: boolean; campus: boolean };
export function receivesAudience(p: NotificationChoices, audience: 'courses' | 'communities' | 'campus') { return p.enabled && p[audience]; }
export function validStudyYear(year: number) { return Number.isInteger(year) && year >= 1 && year <= 8; }
export function hotScore(votes: number, replies: number, participants: number, ageHours: number) { return (votes + replies * 2 + participants * 3 + 1) / Math.pow(Math.max(ageHours, 0) + 2, 1.25); }
export const defaultHomeScope = 'mine';
