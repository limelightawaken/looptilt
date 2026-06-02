import { Card } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
}

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <Card className="flex h-full min-h-[7.5rem] flex-col p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 flex-1 text-2xl font-semibold leading-none tracking-tight">{value}</p>
      <p className="mt-2 min-h-[1.125rem] text-xs leading-snug text-muted-foreground">
        {hint ?? "\u00a0"}
      </p>
    </Card>
  );
}
