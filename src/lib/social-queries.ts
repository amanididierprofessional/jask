import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type CommunityItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  institution_id: string | null;
  creator_id: string;
  image_path: string | null;
  members: number;
  posts: number;
  participants: number;
  activity: number;
};

export const communitiesQuery = () =>
  queryOptions({
    queryKey: ['communities'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('community_activity');
      if (error) throw error;
      return data as unknown as CommunityItem[];
    },
  });

export const membershipsQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ['me', 'communities', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', userId);
      if (error) throw error;
      return data;
    },
  });

export const peopleQuery = (search: string) =>
  queryOptions({
    queryKey: ['people', search],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('public_profiles')
        .select('id, full_name, avatar_url, major, study_year')
        .ilike('full_name', `%${search.replace(/[%_]/g, '')}%`)
        .limit(30);
      if (error) throw error;
      return data.filter(
        (person): person is typeof person & { id: string; full_name: string } =>
          typeof person.id === 'string' && typeof person.full_name === 'string',
      );
    },
  });

export const departmentsQuery = (institutionId: string) =>
  queryOptions({
    queryKey: ['departments', institutionId],
    enabled: !!institutionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('institution_id', institutionId)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

export const preferencesQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ['me', 'preferences', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const postVotesQuery = (id: string) =>
  queryOptions({
    queryKey: ['post-votes', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('question_votes')
        .select('user_id')
        .eq('question_id', id);
      if (error) throw error;
      return data;
    },
  });

export const referencesQuery = (id: string) =>
  queryOptions({
    queryKey: ['references', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_references')
        .select('*')
        .eq('question_id', id);
      if (error) throw error;
      return data;
    },
  });
