import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, ArrowRight } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: "Cadastro realizado",
          description: "Verifique seu e-mail para confirmar o cadastro.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-foreground p-12">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-lg font-semibold text-primary-foreground">
            Portal de Visitação
          </span>
        </div>
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-primary-foreground leading-tight">
            Solicite sua credencial<br />de visitação.
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Acompanhe o status do seu requerimento em tempo real. Prazo de análise: 30 dias.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          © 2024 Portal de Visitação Integrada. Todos os direitos reservados.
        </p>
      </div>

      {/* Right Panel */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-[400px] space-y-8">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <Shield className="h-7 w-7 text-primary" />
            <span className="text-lg font-semibold">Portal de Visitação</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              {isLogin ? "Entrar no portal" : "Criar conta"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isLogin
                ? "Acesse com suas credenciais para gerenciar seus requerimentos."
                : "Preencha os dados abaixo para criar sua conta no portal."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome completo</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                  required={!isLogin}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Processando..." : isLogin ? "Entrar" : "Criar conta"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
