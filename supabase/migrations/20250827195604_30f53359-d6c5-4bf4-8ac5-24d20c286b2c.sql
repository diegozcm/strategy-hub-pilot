-- Remove startup_name column from beep_assessments and add company_id
ALTER TABLE beep_assessments DROP COLUMN startup_name;
ALTER TABLE beep_assessments ADD COLUMN company_id uuid REFERENCES companies(id);