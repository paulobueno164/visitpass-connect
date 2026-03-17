import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { SLATracker } from "@/components/SLATracker";
import { Shield, Plus, LogOut, FileText, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import type { User } from "@supabase/supabase-js";

// Mock data for now - will be replaced with real DB queries
const mockRequests = [
  {
    id: "REQ-2024-001",
    inmate_name: "João Carlos da Silva",
    status: "em_analise" as const,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    protocol: "PROT-2024-00142",
  },
  {
    id: "REQ-2024-002",
    inmate_name: "Maria Fernanda Santos",
    status: "aprovado" as const,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    protocol: "PROT-2024-00098",
  },
  {
    id: "REQ-2024-003",
    inmate_name: "Pedro Henrique Lima",
    status: "pendente_correcao" as const,
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    protocol: "PROT-2024-00115",
  },
];

const statsConfig = [
  { label: "Total", icon: FileText, key: "total", color: "text-foreground" },
  { label: "Em Análise", icon: Clock, key: "em_analise", color: "text-primary" },
  { label: "Aprovados", icon: CheckCircle, key: "aprovado", color: "text-success" },
  { label: "Ação Necessária", icon: AlertTriangle, key: "pendente_correcao", color: "text-warning" },
];

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) navigate("/auth");
      else setUser(session.user);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      else setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const stats = {
    total: mockRequests.length,
    em_analise: mockRequests.filter((r) => r.status === "em_analise").length,
    aprovado: mockRequests.filter((r) => r.status === "aprovado").length,
    pendente_correcao: mockRequests.filter((r) => r.status === "pendente_correcao").length,
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold">Portal de Visitação</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user.user_metadata?.full_name || user.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Welcome */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Meus Requerimentos
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gerencie suas solicitações de carteira de visitante.
            </p>
          </div>
          <Link to="/novo-requerimento">
            <Button size="lg">
              <Plus className="h-4 w-4" />
              Novo Requerimento
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {statsConfig.map((s) => (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-institutional flex items-center gap-4"
            >
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <p className="text-2xl font-semibold">{stats[s.key as keyof typeof stats]}</p>
                <p className="label-institutional">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Request List */}
        <div className="space-y-3">
          {mockRequests.map((req, i) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card-institutional cursor-pointer"
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
            </motion.div>
          ))}

          {mockRequests.length === 0 && (
            <div className="rounded-xl border-2 border-dashed p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">Nenhum requerimento encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Inicie um novo pedido para visitar um custodiado.
              </p>
              <Link to="/novo-requerimento">
                <Button className="mt-6">
                  <Plus className="h-4 w-4" />
                  Novo Requerimento
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
