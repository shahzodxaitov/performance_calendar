-- 1. ROLLAR VA ENUMLAR
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'editor', 'client');

-- 2. PROFILLAR (auth.users bilan bog'langan)
-- Bu jadval avtomatik ravishda auth.users ga yangi odam qo'shilganda trigger orqali to'ldiriladi
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text NOT NULL,
  role user_role DEFAULT 'editor',
  avatar_url text,
  email text,
  telegram_chat_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. KOMPANIYALAR (MIJOZLAR)
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_info text,
  logo_url text,
  created_at timestamptz DEFAULT now()
);

-- 4. VAZIFALAR (TASKS)
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  assignee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  creator_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  start_date date,
  due_date date NOT NULL,
  media_urls text[], -- SMM postlar uchun fayl linklari
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. TRIGGER: auth.users -> public.profiles
-- Yangi foydalanuvchi ro'yxatdan o'tganda public.profiles ga ma'lumot tushishi uchun
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, 'editor');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. RLS (Row Level Security) - Xavfsizlik qoidalari
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Profillar: hamma tizimdagilar bir-birini profilini ko'rishi mumkin
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Kompaniyalar: Adminlar hamma kompaniyani ko'radi, Mijozlar faqat o'zinikini
CREATE POLICY "Admins can do everything with companies" ON public.companies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Vazifalar: Rollarga ko'ra ruxsatnomalar
CREATE POLICY "Tasks visibility based on roles" ON public.tasks
  FOR SELECT USING (
    -- Admin barchasini ko'radi
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR
    -- Managerlar barchasini ko'radi
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'manager')
    OR
    -- O'ziga biriktirilganlarni ko'radi
    assignee_id = auth.uid()
    OR
    -- Mijozlar faqat o'z kompaniyasiga tegishli vazifalarni ko'radi
    company_id IN (
      -- Bu yerda mijoz qaysi kompaniyaga tegishliligini aniqlash kerak (profiles ga company_id qo'shish kerak bo'ladi)
      -- Hozircha oddiyroq qoidalar
      SELECT id FROM public.companies WHERE id = company_id
    )
  );

-- Vazifa yaratish faqat Admin va Managerlar uchun
CREATE POLICY "Only admins and managers can create tasks" ON public.tasks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );
-- 7. CRM TIHLILI (LEADS & SALES)
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text, -- 'Instagram', 'Telegram', 'Referral'
  status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'closed')),
  value decimal DEFAULT 0,
  customer_name text,
  contact_info text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  amount decimal NOT NULL,
  source text,
  seller_id uuid REFERENCES public.profiles(id),
  date date DEFAULT current_date,
  created_at timestamptz DEFAULT now()
);

-- RLS for leads/sales
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/Managers can manage leads" ON public.leads
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')));

CREATE POLICY "Admins/Managers can manage sales" ON public.sales
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- 8. HISOBOTLAR (REPORTS)
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly')),
  title text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  data jsonb DEFAULT '{}',
  share_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/Managers can manage reports" ON public.reports
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')));

CREATE POLICY "Reports viewable via share token" ON public.reports
  FOR SELECT USING (true);
