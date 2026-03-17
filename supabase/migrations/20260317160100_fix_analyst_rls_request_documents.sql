-- Admins can view all request documents (analyst sees only via is_analyst_for_municipality)
CREATE POLICY "Admins view all request docs"
  ON public.request_documents FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Analysts can view documents when the request has no municipality assigned
CREATE POLICY "Analysts view docs when request has no municipality"
  ON public.request_documents FOR SELECT
  USING (
    public.has_role(auth.uid(), 'analyst'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.visitation_requests vr
      WHERE vr.id = request_id AND vr.municipality_id IS NULL
    )
  );

-- Same for request_dependents (analyst sees dependents of requests with no municipality)
CREATE POLICY "Admins view all request dependents"
  ON public.request_dependents FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Analysts view dependents when request has no municipality"
  ON public.request_dependents FOR SELECT
  USING (
    public.has_role(auth.uid(), 'analyst'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.visitation_requests vr
      WHERE vr.id = request_id AND vr.municipality_id IS NULL
    )
  );
