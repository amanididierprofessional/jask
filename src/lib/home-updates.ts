export type UpdateItem = { id: string; courseId: string | null; campusId: string | null; communityIds: string[] };
export function homeUpdateCounts(items: UpdateItem[], courseIds: string[], campusId: string | null, communityIds: string[]) {
  const unique = [...new Map(items.map(item => [item.id, item])).values()];
  return {
    courses: unique.filter(item => item.courseId !== null && courseIds.includes(item.courseId)).length,
    campus: campusId !== null && unique.some(item => item.campusId === campusId),
    communities: unique.some(item => item.communityIds.some(id => communityIds.includes(id))),
  };
}