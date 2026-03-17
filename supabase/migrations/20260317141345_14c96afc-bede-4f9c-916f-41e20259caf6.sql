
-- Create enums
CREATE TYPE public.request_status AS ENUM ('rascunho', 'em_analise', 'aprovado', 'recusado', 'pendente_correcao');
CREATE TYPE public.app_role AS ENUM ('admin', 'analyst', 'citizen');

-- Sequence for protocol numbers
CREATE SEQUENCE public.protocol_seq START 1;

-- Municipalities
CREATE TABLE public.municipalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL DEFAULT 'PR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.municipalities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read municipalities" ON public.municipalities FOR SELECT USING (true);

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  birth_date DATE,
  street TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Analyst-municipality mapping
CREATE TABLE public.analyst_municipalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  municipality_id UUID NOT NULL REFERENCES public.municipalities(id) ON DELETE CASCADE,
  UNIQUE (user_id, municipality_id)
);
ALTER TABLE public.analyst_municipalities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Analysts can view own assignments" ON public.analyst_municipalities FOR SELECT USING (auth.uid() = user_id);

-- is_analyst_for_municipality function
CREATE OR REPLACE FUNCTION public.is_analyst_for_municipality(_municipality_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.analyst_municipalities WHERE user_id = auth.uid() AND municipality_id = _municipality_id
  ) AND public.has_role(auth.uid(), 'analyst'::app_role)
$$;

-- Visitation requests
CREATE TABLE public.visitation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  protocol TEXT NOT NULL UNIQUE DEFAULT ('PROT-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.protocol_seq')::text, 5, '0')),
  status request_status NOT NULL DEFAULT 'em_analise',
  applicant_name TEXT NOT NULL,
  applicant_birth_date DATE NOT NULL,
  applicant_address TEXT NOT NULL,
  applicant_city TEXT NOT NULL,
  applicant_state TEXT NOT NULL,
  applicant_zip TEXT NOT NULL,
  inmate_name TEXT NOT NULL,
  inmate_mother_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  municipality_id UUID REFERENCES public.municipalities(id),
  analyst_user_id UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  decided_at TIMESTAMPTZ,
  has_dependents BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.visitation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Citizens view own requests" ON public.visitation_requests FOR SELECT
  USING (auth.uid() = user_id OR public.is_analyst_for_municipality(municipality_id));
CREATE POLICY "Citizens create own requests" ON public.visitation_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own or analyst" ON public.visitation_requests FOR UPDATE
  USING ((auth.uid() = user_id AND status IN ('rascunho', 'pendente_correcao')) OR public.is_analyst_for_municipality(municipality_id));
CREATE POLICY "Delete own drafts" ON public.visitation_requests FOR DELETE
  USING (auth.uid() = user_id AND status = 'rascunho');

-- Request documents
CREATE TABLE public.request_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.visitation_requests(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.request_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own request docs" ON public.request_documents FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.visitation_requests vr WHERE vr.id = request_id AND (vr.user_id = auth.uid() OR public.is_analyst_for_municipality(vr.municipality_id))));
CREATE POLICY "Insert own request docs" ON public.request_documents FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.visitation_requests vr WHERE vr.id = request_id AND vr.user_id = auth.uid()));
CREATE POLICY "Delete own request docs" ON public.request_documents FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.visitation_requests vr WHERE vr.id = request_id AND vr.user_id = auth.uid()));

-- Request dependents
CREATE TABLE public.request_dependents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.visitation_requests(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  document_number TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.request_dependents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own request dependents" ON public.request_dependents FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.visitation_requests vr WHERE vr.id = request_id AND (vr.user_id = auth.uid() OR public.is_analyst_for_municipality(vr.municipality_id))));
CREATE POLICY "Insert own request dependents" ON public.request_dependents FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.visitation_requests vr WHERE vr.id = request_id AND vr.user_id = auth.uid()));
CREATE POLICY "Delete own request dependents" ON public.request_dependents FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.visitation_requests vr WHERE vr.id = request_id AND vr.user_id = auth.uid()));

-- Auto-create profile + citizen role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'citizen');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON public.visitation_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('request-documents', 'request-documents', false);

CREATE POLICY "Upload to own folder" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'request-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "View own docs" ON storage.objects FOR SELECT
  USING (bucket_id = 'request-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Analysts view docs" ON storage.objects FOR SELECT
  USING (bucket_id = 'request-documents' AND public.has_role(auth.uid(), 'analyst'::app_role));

-- Seed municipalities
INSERT INTO public.municipalities (name, state) VALUES
  ('Curitiba', 'PR'), ('Londrina', 'PR'), ('Maringá', 'PR'),
  ('Ponta Grossa', 'PR'), ('Cascavel', 'PR'), ('Foz do Iguaçu', 'PR');
