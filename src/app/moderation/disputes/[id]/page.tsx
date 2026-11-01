import { DisputeDetailView } from "@/components/moderation/dispute-detail-view";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ModerationDisputePage(props: PageProps) {
  const params = await props.params;
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-6 lg:py-8"
      )}
    >
      <DisputeDetailView disputeId={params.id} />
    </div>
  );
}
