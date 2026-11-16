import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const authorCols = "id, full_name, major, study_year, role_title, avatar_url";

export const coursesQuery = () =>
  queryOptions({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, code, name, description, institution_id")
        .order("code");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60_000,
  });

export const institutionsQuery = () =>
  queryOptions({
    queryKey: ["institutions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("institutions").select("id, name, short_name").order("name");
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60_000,
  });

export type FeedFilter = { courseIds?: string[] | null; search?: string; institutionId?: string | null | undefined; communityId?: string | undefined; sort?: string };

export const feedQuery = (f: FeedFilter) =>
  queryOptions({
    queryKey: ["feed", f],
    queryFn: async () => {
      const { data: ranked, error: rankError } = await supabase.rpc("ranked_questions", { ...(f.courseIds ? {course_ids:f.courseIds} : {}), ...(f.institutionId ? {campus_id:f.institutionId} : {}), ...(f.communityId ? {community:f.communityId} : {}), search_text: f.search?.trim() ?? "", sort_mode: f.sort ?? "hot" });
      if (rankError) throw rankError;
      if (!ranked.length) return [];
      const { data, error } = await supabase.from("questions").select(`id, title, tag, created_at, answer_count, accepted_answer_id, course_id, author:public_profiles!questions_author_id_fkey(${authorCols}), course:courses(id, code, name)`).in("id", ranked.map(r => r.id));
      if (error) throw error;
      return ranked.flatMap(r => { const item = data.find(q => q.id === r.id); return item ? [item] : []; });
    },
  });
export type FeedItem = Awaited<ReturnType<NonNullable<ReturnType<typeof feedQuery>["queryFn"]>>>[number];

/** Classmates who completed each course (for helper recommendations / peer discovery). */
export const helpersQuery = () =>
  queryOptions({
    queryKey: ["helpers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select(`course_id, status, user:public_profiles!enrollments_user_id_fkey(${authorCols})`);
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });

export const liveQuery = () =>
  queryOptions({
    queryKey: ["live"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, studying_course_id")
        .gt("studying_until", new Date().toISOString())
        .not("studying_course_id", "is", null);
      if (error) throw error;
      return data;
    },
    refetchInterval: 60_000,
  });

export const questionQuery = (id: string) =>
  queryOptions({
    queryKey: ["question", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select(`*, author:public_profiles!questions_author_id_fkey(${authorCols}), course:courses(id, code, name)`)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const answersQuery = (questionId: string) =>
  queryOptions({
    queryKey: ["answers", questionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("answers")
        .select(`id, body, upvotes, created_at, parent_answer_id, author_id, author:public_profiles!answers_author_id_fkey(${authorCols})`)
        .eq("question_id", questionId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

export const myVotesQuery = (userId: string | null, questionId: string) =>
  queryOptions({
    queryKey: ["me", "votes", userId, questionId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("votes").select("answer_id");
      if (error) throw error;
      return new Set(data.map((v) => v.answer_id));
    },
  });

export const myBookmarksQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["me", "bookmarks", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookmarks")
        .select(`question_id, created_at, question:questions(id, title, tag, created_at, answer_count, accepted_answer_id, course_id, author:public_profiles!questions_author_id_fkey(${authorCols}), course:courses(id, code, name))`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const notificationsQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["me", "notifications", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select(`id, type, read, created_at, question_id, actor:public_profiles!notifications_actor_id_fkey(${authorCols}), question:questions(id, title)`)
        .order("created_at", { ascending: false })
        .limit(40);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30_000,
  });
