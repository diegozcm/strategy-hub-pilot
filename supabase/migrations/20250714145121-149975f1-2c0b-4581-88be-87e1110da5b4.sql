-- Delete all data from all tables, respecting foreign key constraints
-- Starting with dependent tables first

-- AI related tables
DELETE FROM ai_analytics;
DELETE FROM ai_chat_messages;
DELETE FROM ai_chat_sessions;
DELETE FROM ai_recommendations;
DELETE FROM ai_insights;
DELETE FROM ai_user_preferences;

-- Performance and project related tables
DELETE FROM performance_reviews;
DELETE FROM project_tasks;
DELETE FROM project_members;
DELETE FROM project_kr_relations;
DELETE FROM project_objective_relations;
DELETE FROM key_result_values;

-- Strategic planning tables (order matters due to dependencies)
DELETE FROM key_results;
DELETE FROM strategic_objectives;
DELETE FROM strategic_projects;
DELETE FROM strategic_pillars;
DELETE FROM strategic_plans;

-- Company and user tables
DELETE FROM companies;
DELETE FROM user_roles;

-- Note: We don't delete from profiles table as it's linked to auth.users
-- If you want to delete profiles too, uncomment the line below:
-- DELETE FROM profiles;