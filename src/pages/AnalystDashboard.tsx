import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { SLATracker } from "@/components/SLATracker";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Search, Eye, Check, X, AlertTriangle, ArrowLeft, LogOut, Download } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Request = Tables<"visitation_requests">;
type Document = Tables<"request_documents">;
type Dependent = Tables<"request_dependents">;

export default function AnalystDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const { toast } = useToast();

  const fetchRequests = async () => {
    // Analysts see requests for their assigned municipalities via RLS
    const { data, error } = await supabase
      .from("visitation_requests")
      .select("*")
      .order("created_at", { ascending: false });
    // #region agent log
    fetch('http://127.0.0.1:7252/ingest/3ced64f8-0e5d-4805-8835-d741af6a0d7f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AnalystDashboard.tsx:fetchRequests',message:'fetch result',data:{count:data?.length??0,error:error?.message??null},timestamp:Date.now(),hypothesisId:'H1,H2,H3'})}).catch(()=>{});
    // #endregion
    setRequests(data || []);
    setLoadingData(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchRequests();
  }, [user]);

  const openRequest = async (req: Request) => {
    setSelectedRequest(req);
    setRejectionReason("");
    // Fetch documents and dependents
    const [docsRes, depsRes] = await Promise.all([
      supabase.from("request_documents").select("*").eq("request_id", req.id),
      supabase.from("request_dependents").select("*").eq("request_id", req.id),
    ]);
    setDocuments(docsRes.data || []);
    setDependents(depsRes.data || []);
  };

  const updateStatus = async (status: "aprovado" | "recusado" | "pendente_correcao") => {
    if (!selectedRequest || !user) return;
    if ((status === "recusado" || status === "pendente_correcao") && !rejectionReason.trim()) {
      toast({ title: "Erro", description: "Informe o motivo.", variant: "destructive" });
      return;
    }
    setActionLoading(true);
    const { error } = await supabase
      .from("visitation_requests")
      .update({
        status,
        analyst_user_id: user.id,
        decided_at: status !== "pendente_correcao" ? new Date().toISOString() : null,
        rejection_reason: status !== "aprovado" ? rejectionReason : null,
      })
      .eq("id", selectedRequest.id);

    setActionLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    const labels = { aprovado: "Aprovado", recusado: "Recusado", pendente_correcao: "Correção solicitada" };
    toast({ title: labels[status], description: `Requerimento ${selectedRequest.protocol} atualizado.` });
    setSelectedRequest(null);
    fetchRequests();
  };

  const getDocumentUrl = async (filePath: string) => {
    const { data } = await supabase.storage.from("request-documents").createSignedUrl(filePath, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.applicant_name.toLowerCase().includes(search.toLowerCase()) ||
      r.protocol.toLowerCase().includes(search.toLowerCase()) ||
      r.inmate_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "todos" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (authLoading || !user) return null;

  // Detail view
  if (selectedRequest) {
    const docLabels: Record<string, string> = {
      rg: "RG",
      cpf: "CPF",
      comprovante_endereco: "Comprovante de Endereço",
      certidao_criminal: "Certidão Negativa Criminal",
      foto_3x4: "Foto 3x4",
      certidao_casamento: "Certidão de Casamento / União Estável",
      certidao_nascimento: "Certidão de Nascimento (Dependente)",
    };

    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="mx-auto flex h-16 max-w-[1400px] items-center px-6 gap-4">
            <button onClick={() => setSelectedRequest(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Voltar à fila
            </button>
            <div className="h-6 w-px bg-border" />
            <span className="text-sm font-medium">{selectedRequest.protocol}</span>
            <StatusBadge status={selectedRequest.status} />
          </div>
        </header>

        <div className="mx-auto max-w-[1400px] grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[calc(100vh-4rem)]">
          {/* Left: Data */}
          <div className="border-r p-8 overflow-y-auto space-y-8">
            <div>
              <h2 className="text-lg font-semibold mb-6">Dados do Requerimento</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <span className="label-institutional">Solicitante</span>
                    <p className="mt-1 text-sm font-medium">{selectedRequest.applicant_name}</p>
                  </div>
                  <div>
                    <span className="label-institutional">Data de Nascimento</span>
                    <p className="mt-1 text-sm font-medium">{new Date(selectedRequest.applicant_birth_date).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="label-institutional">Endereço</span>
                    <p className="mt-1 text-sm font-medium">{selectedRequest.applicant_address}, {selectedRequest.applicant_city} - {selectedRequest.applicant_state}, CEP: {selectedRequest.applicant_zip}</p>
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <span className="label-institutional">Custodiado</span>
                    <p className="mt-1 text-sm font-medium">{selectedRequest.inmate_name}</p>
                  </div>
                  <div>
                    <span className="label-institutional">Mãe do Custodiado</span>
                    <p className="mt-1 text-sm font-medium">{selectedRequest.inmate_mother_name}</p>
                  </div>
                  <div>
                    <span className="label-institutional">Relacionamento</span>
                    <p className="mt-1 text-sm font-medium">{selectedRequest.relationship}</p>
                  </div>
                </div>

                {dependents.length > 0 && (
                  <>
                    <div className="h-px bg-border" />
                    <div>
                      <span className="label-institutional">Dependentes ({dependents.length})</span>
                      <div className="mt-3 space-y-3">
                        {dependents.map((dep) => (
                          <div key={dep.id} className="rounded-lg border p-4">
                            <p className="text-sm font-medium">{dep.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Nascimento: {new Date(dep.birth_date).toLocaleDateString("pt-BR")} · Doc: {dep.document_number}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="h-px bg-border" />
                <SLATracker createdAt={selectedRequest.created_at} />
              </div>
            </div>

            {/* Actions - only show if still pending */}
            {(selectedRequest.status === "em_analise" || selectedRequest.status === "pendente_correcao") && (
              <div className="space-y-4 rounded-xl border p-6">
                <h3 className="text-sm font-semibold">Decisão</h3>
                <Textarea
                  placeholder="Motivo da recusa ou documentos a corrigir..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-3">
                  <Button onClick={() => updateStatus("aprovado")} className="flex-1" disabled={actionLoading}>
                    <Check className="h-4 w-4" />
                    Aprovar
                  </Button>
                  <Button variant="warning" onClick={() => updateStatus("pendente_correcao")} className="flex-1" disabled={actionLoading}>
                    <AlertTriangle className="h-4 w-4" />
                    Solicitar Correção
                  </Button>
                  <Button variant="destructive" onClick={() => updateStatus("recusado")} className="flex-1" disabled={actionLoading}>
                    <X className="h-4 w-4" />
                    Recusar
                  </Button>
                </div>
              </div>
            )}

            {selectedRequest.status === "aprovado" && (
              <div className="rounded-xl border border-success/30 bg-success/5 p-6 text-center">
                <Check className="mx-auto h-8 w-8 text-success mb-2" />
                <p className="text-sm font-medium text-success">Requerimento aprovado</p>
              </div>
            )}
            {selectedRequest.status === "recusado" && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
                <p className="text-sm font-medium text-destructive">Requerimento recusado</p>
                {selectedRequest.rejection_reason && (
                  <p className="mt-2 text-sm text-muted-foreground">{selectedRequest.rejection_reason}</p>
                )}
              </div>
            )}
          </div>

          {/* Right: Documents */}
          <div className="bg-muted/30 p-8 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-6">Documentos Anexados</h2>
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum documento anexado.</p>
            ) : (
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="card-institutional bg-card">
                    <div className="flex items-center justify-between mb-3">
                      <span className="label-institutional">{docLabels[doc.document_type] || doc.document_type}</span>
                      <Button variant="ghost" size="sm" onClick={() => getDocumentUrl(doc.file_path)}>
                        <Eye className="h-4 w-4" />
                        Visualizar
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">{doc.file_name} · {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : ""}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold">Painel do Analista</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">Visão Cidadão</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Fila de Requerimentos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Analise e processe os requerimentos de visitação.</p>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, protocolo..." className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por situação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="em_analise">Em Análise</SelectItem>
              <SelectItem value="aprovado">Aprovado</SelectItem>
              <SelectItem value="recusado">Recusado</SelectItem>
              <SelectItem value="pendente_correcao">Ação Necessária</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_1fr_140px_100px] gap-4 border-b px-6 py-3">
            <span className="label-institutional">Protocolo</span>
            <span className="label-institutional">Solicitante</span>
            <span className="label-institutional">Custodiado</span>
            <span className="label-institutional">Situação</span>
            <span className="label-institutional">Data</span>
          </div>
          {loadingData ? (
            <div className="p-12 text-center text-sm text-muted-foreground">Carregando...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">Nenhum requerimento encontrado.</div>
          ) : (
            filteredRequests.map((req, i) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => openRequest(req)}
                className="grid grid-cols-[1fr_1fr_1fr_140px_100px] gap-4 px-6 py-4 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm font-medium">{req.protocol}</span>
                <span className="text-sm">{req.applicant_name}</span>
                <span className="text-sm">{req.inmate_name}</span>
                <StatusBadge status={req.status} />
                <span className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString("pt-BR")}</span>
              </motion.div>
            ))
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{filteredRequests.length} requerimento(s)</span>
        </div>
      </main>
    </div>
  );
}
