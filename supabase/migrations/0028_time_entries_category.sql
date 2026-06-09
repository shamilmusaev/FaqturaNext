-- A time entry's task type (e.g. Dashboard, System prompt, Meeting). Projects
-- are real deliverables; the category is the kind of work within a project.
alter table time_entries add column category text;

create index time_entries_category_idx on time_entries (organization_id, category);
