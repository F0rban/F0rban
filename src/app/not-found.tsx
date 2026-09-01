import Link from "next/link";
import { Compass } from "lucide-react";
import { PageContainer } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <PageContainer width="narrow" className="pt-16">
      <EmptyState
        icon={<Compass />}
        title="That page does not exist"
        description="The link may be stale, or the item was deleted from this workspace. Try the command palette — it searches everything at once."
        action={
          <Button variant="primary" size="sm" asChild>
            <Link href="/">Back to the dashboard</Link>
          </Button>
        }
      />
    </PageContainer>
  );
}
