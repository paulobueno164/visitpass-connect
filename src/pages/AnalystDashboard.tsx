import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { SLATracker } from "@/components/SLATracker";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Search, Eye, Check, X, AlertTriangle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const mockAnalystRequests = [
  {
    id: "REQ-2024-001",
    applicant_name: "Ana Clara Souza",
    inmate_name: "João Carlos da Silva",
    status: "em_analise" as const,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    protocol: "PROT-2024-00142",
    relationship: "Cônjuge",
    birth_date: "1990-05-15",
    address: "Rua das Flores, 123, Centro, Curitiba - PR",
    inmate_mother_name: "Maria da Silva",
    documents: {
      rg: "/placeholder.svg",
      cpf: "/placeholder.svg",
      address_proof: "/placeholder.svg",
      criminal_record: "/placeholder.svg",
      photo: "/placeholder.svg",
      marriage_cert: "/placeholder.svg",
    },
  },
  {
    id: "REQ-2024-004",
    applicant_name: "Carlos Eduardo Lima",
    inmate_name: "Pedro Henrique Lima",
    status: "em_analise" as const,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    protocol: "PROT-2024-00145",
    relationship: "Pai/Mãe",
    birth_date: "1965-11-20",
    address: "Av. Brasil, 456, Bairro Alto, Londrina - PR",
    inmate_mother_name: "Francisca Lima",
    documents: {
      rg: "/placeholder.svg",
      cpf: "/placeholder.svg",
      address_proof: "/placeholder.svg",
      criminal_record: "/placeholder.svg",
      photo: "/placeholder.svg",
    },
  },
];

type Request = typeof mockAnalystRequests[0];

export default function AnalystDashboard() {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [rejectionReason, setRejectionReason] = useState("");
  const { toast } = useToast();

  const filteredRequests = mockAnalystRequests.filter((r) => {
    const matchesSearch =
      r.applicant_name.toLowerCase().includes(search.toLowerCase()) ||
      r.protocol.toLowerCase().includes(search.toLowerCase()) ||
      r.inmate_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "todos" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = (req: Request) => {
    toast({ title: "Aprovado", description: `Requerimento ${req.protocol} aprovado. E-mail enviado ao solicitante.` });
    setSelectedRequest(null);
  };

  const handleReject = (req: Request) => {
    if (!rejectionReason.trim()) {
      toast({ title: "Erro", description: "Informe o motivo da recusa.", variant: "destructive" });
      return;
    }
    toast({ title: "Recusado", description: `Requerimento ${req.protocol} recusado. E-mail enviado ao solicitante.` });
    setSelectedRequest(null);
    setRejectionReason("");
  };

  const handlePartialReject = (req: Request) => {
    if (!rejectionReason.trim()) {
      toast({ title: "Erro", description: "Informe os documentos/campos que precisam correção.", variant: "destructive" });
      return;
    }
    toast({ title: "Correção solicitada", description: `Solicitação de correção enviada ao requerente.` });
    setSelectedRequest(null);
    setRejectionReason("");
  };

  if (selectedRequest) {
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

        {/* Split-screen review */}
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
                    <p className="mt-1 text-sm font-medium">{new Date(selectedRequest.birth_date).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="label-institutional">Endereço</span>
                    <p className="mt-1 text-sm font-medium">{selectedRequest.address}</p>
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

                <div className="h-px bg-border" />

                <SLATracker createdAt={selectedRequest.created_at} />
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4 rounded-xl border p-6">
              <h3 className="text-sm font-semibold">Decisão</h3>
              <Textarea
                placeholder="Motivo da recusa ou documentos a corrigir..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
              <div className="flex gap-3">
                <Button onClick={() => handleApprove(selectedRequest)} className="flex-1">
                  <Check className="h-4 w-4" />
                  Aprovar
                </Button>
                <Button variant="warning" onClick={() => handlePartialReject(selectedRequest)} className="flex-1">
                  <AlertTriangle className="h-4 w-4" />
                  Solicitar Correção
                </Button>
                <Button variant="destructive" onClick={() => handleReject(selectedRequest)} className="flex-1">
                  <X className="h-4 w-4" />
                  Recusar
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Documents */}
          <div className="bg-muted/30 p-8 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-6">Documentos Anexados</h2>
            <div className="space-y-4">
              {Object.entries(selectedRequest.documents).map(([key, url]) => {
                const labels: Record<string, string> = {
                  rg: "RG",
                  cpf: "CPF",
                  address_proof: "Comprovante de Endereço",
                  criminal_record: "Certidão Negativa Criminal",
                  photo: "Foto 3x4",
                  marriage_cert: "Certidão de Casamento / União Estável",
                };
                return (
                  <div key={key} className="card-institutional bg-card">
                    <div className="flex items-center justify-between mb-3">
                      <span className="label-institutional">{labels[key] || key}</span>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                        Ampliar
                      </Button>
                    </div>
                    <div className="rounded-lg border bg-muted/50 h-48 flex items-center justify-center">
                      <span className="text-sm text-muted-foreground">Visualização do documento</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold">Painel do Analista</span>
          </div>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              Visão Cidadão
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Fila de Requerimentos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Analise e processe os requerimentos de visitação.</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, protocolo..."
              className="pl-10"
            />
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

        {/* Table-like list */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_1fr_120px_100px] gap-4 border-b px-6 py-3">
            <span className="label-institutional">Protocolo</span>
            <span className="label-institutional">Solicitante</span>
            <span className="label-institutional">Custodiado</span>
            <span className="label-institutional">Situação</span>
            <span className="label-institutional">Data</span>
          </div>
          {filteredRequests.map((req, i) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedRequest(req)}
              className="grid grid-cols-[1fr_1fr_1fr_120px_100px] gap-4 px-6 py-4 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm font-medium">{req.protocol}</span>
              <span className="text-sm">{req.applicant_name}</span>
              <span className="text-sm">{req.inmate_name}</span>
              <StatusBadge status={req.status} />
              <span className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString("pt-BR")}</span>
            </motion.div>
          ))}
          {filteredRequests.length === 0 && (
            <div className="p-12 text-center text-sm text-muted-foreground">
              Nenhum requerimento encontrado com os filtros aplicados.
            </div>
          )}
        </div>

        {/* Pagination placeholder */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{filteredRequests.length} requerimento(s)</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Anterior</Button>
            <Button variant="outline" size="sm" disabled>Próximo</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
