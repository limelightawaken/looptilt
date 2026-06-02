import { Badge } from "@/components/ui/badge";
import type { SendStatus } from "@/lib/types/looptilt";

const VARIANT: Record<SendStatus, "default" | "success" | "warning" | "danger" | "outline"> = {
  DRAFT: "outline",
  GENERATING: "warning",
  READY: "default",
  PUBLISHING: "warning",
  PUBLISHED: "success",
  FAILED: "danger",
};

export function SendStatusBadge({ status }: { status: SendStatus }) {
  return <Badge variant={VARIANT[status]}>{status.toLowerCase()}</Badge>;
}
