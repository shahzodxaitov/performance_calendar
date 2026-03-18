-- Xodimlar
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text DEFAULT 'member', -- 'admin' | 'member'
  avatar_color text,
  created_at timestamptz DEFAULT now()
);

-- Ishlar (asosiy jadval)
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text,              -- 'SMM', 'Design', 'Video', 'Reklama' etc.
  description text,
  start_date date,
  deadline date NOT NULL,
  assignee_id uuid REFERENCES users(id) ON DELETE SET NULL,
  status text DEFAULT 'pending', -- 'pending' | 'in_progress' | 'done' | 'cancelled'
  client text,           -- Mijoz nomi
  priority text DEFAULT 'normal', -- 'low' | 'normal' | 'high'
  created_at timestamptz DEFAULT now()
);

-- Mijozlar (kelajakda kengaytirish uchun)
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact text,
  created_at timestamptz DEFAULT now()
);
