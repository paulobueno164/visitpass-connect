import { cn } from "@/lib/utils";

interface SLATrackerProps {
  createdAt: string;
  maxDays?: number;
  className?: string;
}

export function SLATracker({ createdAt, maxDays = 30, className }: SLATrackerProps) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const daysPassed = Math.min(Math.floor(diffMs / (1000 * 60 * 60 * 24)), maxDays);
  const percentage = Math.min((daysPassed / maxDays) * 100, 100);
  const remaining = maxDays - daysPassed;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <span className="label-institutional">Prazo de Análise</span>
        <span className="text-xs font-medium text-muted-foreground">
          Dia {daysPassed} de {maxDays}
          {remaining > 0 ? ` · ${remaining} dias restantes` : " · Prazo expirado"}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            percentage < 50 ? "bg-primary" : percentage < 80 ? "bg-warning" : "bg-destructive"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
