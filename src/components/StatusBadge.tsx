import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all",
  {
    variants: {
      status: {
        em_analise: "bg-primary/10 text-primary animate-pulse-soft",
        aprovado: "bg-success/10 text-success",
        recusado: "bg-destructive/10 text-destructive",
        pendente_correcao: "bg-warning/10 text-warning",
        rascunho: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      status: "em_analise",
    },
  }
);

const statusLabels: Record<string, string> = {
  em_analise: "Em Análise",
  aprovado: "Aprovado",
  recusado: "Recusado",
  pendente_correcao: "Ação Necessária",
  rascunho: "Rascunho",
};

interface StatusBadgeProps extends VariantProps<typeof statusVariants> {
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(statusVariants({ status }), className)}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabels[status || "em_analise"]}
    </span>
  );
}
