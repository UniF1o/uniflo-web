// TODO: regen with `npm run types:api` after uniflo-api admin PR deploys.
// These stub types mirror the Pydantic schemas in app/api/admin/schemas.py.

export type AdminStatusCount = {
  status: string;
  count: number;
};

export type AdminStatsResponse = {
  total_students: number;
  active_universities: number;
  applications_by_status: AdminStatusCount[];
};

export type AdminStudentRow = {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  profile_complete: boolean;
  application_count: number;
  created_at: string;
};

export type AdminStudentsResponse = {
  items: AdminStudentRow[];
  total: number;
  page: number;
  per_page: number;
};

export type AdminApplicationRow = {
  id: string;
  student_email: string;
  student_name: string | null;
  university_name: string;
  programme: string;
  status: string | null;
  created_at: string;
};

export type AdminApplicationsResponse = {
  items: AdminApplicationRow[];
  total: number;
  page: number;
  per_page: number;
};

export type UniversityCreate = {
  name: string;
  website: string;
  portal_url: string;
  open_date?: string | null;
  close_date?: string | null;
  is_active: boolean;
  scoring_method?: string | null;
};

export type UniversityUpdate = Partial<UniversityCreate>;
