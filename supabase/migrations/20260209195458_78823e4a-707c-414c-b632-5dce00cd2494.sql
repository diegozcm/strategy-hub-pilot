-- Enable Supabase Realtime for admin-v2 key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.companies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_login_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_module_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_modules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_company_relations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mentor_startup_relations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.startup_hub_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mentoring_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.backup_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.database_cleanup_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.landing_page_content;
ALTER PUBLICATION supabase_realtime ADD TABLE public.landing_page_content_draft;