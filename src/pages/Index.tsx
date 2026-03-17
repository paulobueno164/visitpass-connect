import { Shield, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Index() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold">Portal de Visitação</span>
          </div>
          <Link to="/auth">
            <Button variant="outline" size="sm">
              Entrar
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-xl text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Solicite sua credencial de visitação.
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Acompanhe o status do seu requerimento em tempo real. Prazo de análise: 30 dias.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg">
                Iniciar Requerimento
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline" size="lg">
                Consultar Protocolo
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="text-xs text-muted-foreground">
            © 2024 Portal de Visitação Integrada. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
