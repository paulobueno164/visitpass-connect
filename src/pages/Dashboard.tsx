import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { SLATracker } from "@/components/SLATracker";
import { Shield, Plus, LogOut, FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";

type Request = Tables<"visitation_requests">;

const statsConfig = [
  { label: "Total", icon: FileText, key: "total", color: "text-foreground" },
  { label: "Em Análise", icon: Clock, key: "em_analise", color: "text-primary" },
  { label: "Aprovados", icon: CheckCircle, key: "aprovado", color: "text-success" },
  { label: "Ação Necessária", icon: AlertTriangle, key: "pendente_correcao", color: "text-warning" },
];

export default function Dashboard() {
  const { user, isAnalyst, loading, logout } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchRequests = async () => {
      const { data } = await supabase
        .from("visitation_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setRequests(data || []);
      setLoadingData(false);
    };
    fetchRequests();
  }, [user]);

  if (loading || !user) return null;

  const stats = {
    total: requests.length,
    em_analise: requests.filter((r) => r.status === "em_analise").length,
    aprovado: requests.filter((r) => r.status === "aprovado").length,
    pendente_correcao: requests.filter((r) => r.status === "pendente_correcao").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold">Portal de Visitação</span>
          </div>
          <div className="flex items-center gap-4">
            {isAnalyst && (
              <Link to="/analista">
                <Button variant="outline" size="sm">Painel do Analista</Button>
              </Link>
            )}
            <span className="text-sm text-muted-foreground">
              {user.user_metadata?.full_name || user.email}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Meus Requerimentos</h1>
            <p className="mt-1 text-sm text-muted-foreground">Gerencie suas solicitações de carteira de visitante.</p>
          </div>
          <Link to="/novo-requerimento">
            <Button size="lg">
              <Plus className="h-4 w-4" />
              Novo Requerimento
            </Button>
          </Link>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {statsConfig.map((s) => (
            <motion.div key={s.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-institutional flex items-center gap-4">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <p className="text-2xl font-semibold">{stats[s.key as keyof typeof stats]}</p>
                <p className="label-institutional">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-3">
          {loadingData ? (
            <div className="p-12 text-center text-sm text-muted-foreground">Carregando...</div>
          ) : requests.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">Nenhum requerimento encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">Inicie um novo pedido para visitar um custodiado.</p>
              <Link to="/novo-requerimento">
                <Button className="mt-6">
                  <Plus className="h-4 w-4" />
                  Novo Requerimento
                </Button>
              </Link>
            </div>
          ) : (
            requests.map((req, i) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card-institutional"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="label-institutional">{req.protocol}</p>
                      <p className="text-sm font-medium mt-1">{req.inmate_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <StatusBadge status={req.status} />
                    <span className="text-xs text-muted-foreground">
                      {new Date(req.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
                {req.status === "em_analise" && (
                  <div className="mt-4">
                    <SLATracker createdAt={req.created_at} />
                  </div>
                )}
                {req.status === "recusado" && req.rejection_reason && (
                  <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <p className="text-sm text-destructive"><strong>Motivo da recusa:</strong> {req.rejection_reason}</p>
                  </div>
                )}
                {req.status === "pendente_correcao" && req.rejection_reason && (
                  <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 p-3">
                    <p className="text-sm text-warning"><strong>Correção solicitada:</strong> {req.rejection_reason}</p>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
