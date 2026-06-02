import { Badge } from "@/components/ui/badge";
import type { LifecycleStage } from "@/lib/types/looptilt";

const VARIANT: Record<LifecycleStage, "default" | "success" | "warning" | "danger" | "outline"> = {
  NEW: "outline",
  WARMING: "default",
  ENGAGED: "success",
  COOLING: "warning",
  DORMANT: "danger",
  REACTIVATED: "success",
};

export function LifecycleBadge({ stage }: { stage: LifecycleStage }) {
  return <Badge variant={VARIANT[stage]}>{stage.toLowerCase()}</Badge>;
}
