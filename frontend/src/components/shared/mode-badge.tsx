import { Badge } from "@/components/ui/badge";
import type { DataSource } from "@/lib/types/looptilt";

export function ModeBadge({ dataSource }: { dataSource: DataSource | null }) {
  if (!dataSource) {
    return <Badge variant="outline">Not connected</Badge>;
  }
  if (dataSource === "LIVE_KIT") {
    return <Badge variant="success">Live (Kit)</Badge>;
  }
  return <Badge variant="warning">Demo data</Badge>;
}
