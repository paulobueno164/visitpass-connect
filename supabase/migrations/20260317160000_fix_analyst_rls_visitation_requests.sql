-- Admins can see all visitation requests (current policy only allows analyst for municipality)
CREATE POLICY "Admins view all requests"
  ON public.visitation_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Analysts can see requests with no municipality assigned (citizen left it optional)
CREATE POLICY "Analysts view requests with no municipality"
  ON public.visitation_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'analyst'::app_role) AND municipality_id IS NULL);
