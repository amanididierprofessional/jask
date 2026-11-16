ALTER POLICY "profiles readable" ON public.profiles TO authenticated USING (id = (SELECT auth.uid()));
ALTER POLICY "enrollments readable" ON public.enrollments TO authenticated USING (user_id = (SELECT auth.uid()));
REVOKE SELECT ON public.profiles, public.enrollments FROM anon;

-- Deliberately owner-executed projection: exposes only the display fields already
-- used in public conversations, never full profiles or course subscriptions.
CREATE VIEW public.public_profiles WITH (security_barrier = true) AS
SELECT id, full_name, major, study_year, role_title, avatar_url
FROM public.profiles;
REVOKE ALL ON public.public_profiles FROM PUBLIC;
GRANT SELECT ON public.public_profiles TO anon, authenticated, service_role;
COMMENT ON VIEW public.public_profiles IS 'Public display-only projection for author attribution and account tagging. Do not add private profile fields or enrollments. Base profiles are owner-readable only.';