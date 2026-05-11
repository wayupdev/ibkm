export type UserRole = "admin" | "parent" | "child";
export type Audience = "all" | "parents" | "children";

export type Profile = {
  id: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  birth_date: string | null;
  phone: string | null;
  family_id: string | null;
  photo_consent: boolean;
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
};

export type Family = {
  id: string;
  name: string;
  notes: string | null;
  created_at: string;
  created_by: string | null;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  audience: Audience;
  pinned: boolean;
  created_at: string;
  created_by: string;
};

export type Doc = {
  id: string;
  title: string;
  description: string | null;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  audience: Audience;
  family_id: string | null;
  created_at: string;
  created_by: string;
};

export type Photo = {
  id: string;
  caption: string | null;
  storage_path: string;
  audience: Audience;
  created_at: string;
  created_by: string;
};

export type MessageThread = {
  id: string;
  user_a: string;
  user_b: string;
  last_msg_at: string;
};

export type Message = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export type Trip = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  created_by: string;
};

export type TripDocument = {
  id: string;
  trip_id: string;
  title: string;
  description: string | null;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
  created_by: string;
};

export type TripMessage = {
  id: string;
  trip_id: string;
  body: string;
  created_at: string;
  created_by: string;
};

export type ChildThread = {
  id: string;
  child_id: string;
  last_msg_at: string;
  created_at: string;
};

export type ChildThreadMessage = {
  id: string;
  thread_id: string;
  child_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export type ChildDocument = {
  id: string;
  child_id: string;
  title: string;
  description: string | null;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  sender_id: string;
  created_at: string;
};
