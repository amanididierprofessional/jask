ALTER TABLE public.communities ADD COLUMN image_path text;

DROP FUNCTION IF EXISTS public.community_activity();
CREATE FUNCTION public.community_activity()
RETURNS TABLE(id uuid,name text,slug text,description text,institution_id uuid,creator_id uuid,image_path text,members bigint,posts bigint,participants bigint,activity numeric)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$
  SELECT c.id,c.name,c.slug,c.description,c.institution_id,c.creator_id,c.image_path,
    (SELECT count(*) FROM public.community_members m WHERE m.community_id=c.id),
    (SELECT count(*) FROM public.question_communities t WHERE t.community_id=c.id),
    (SELECT count(DISTINCT a.author_id) FROM public.answers a JOIN public.question_communities t ON t.question_id=a.question_id WHERE t.community_id=c.id AND a.created_at>now()-interval '7 days'),
    ((SELECT count(*) FROM public.question_votes v JOIN public.question_communities t ON t.question_id=v.question_id WHERE t.community_id=c.id AND v.created_at>now()-interval '7 days')
    +(SELECT count(*)*2 FROM public.answers a JOIN public.question_communities t ON t.question_id=a.question_id WHERE t.community_id=c.id AND a.created_at>now()-interval '7 days')
    +(SELECT count(*) FROM public.question_communities t JOIN public.questions q ON q.id=t.question_id WHERE t.community_id=c.id AND q.created_at>now()-interval '7 days'))::numeric
  FROM public.communities c ORDER BY 11 DESC,8 DESC
$$;
GRANT EXECUTE ON FUNCTION public.community_activity() TO anon,authenticated;

CREATE POLICY "community images readable" ON storage.objects FOR SELECT TO anon,authenticated
USING(bucket_id='references' AND EXISTS(SELECT 1 FROM public.communities c WHERE c.image_path=name));
