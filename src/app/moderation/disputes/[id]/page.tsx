import { DisputeDetailView } from "@/components/moderation/dispute-detail-view";
import { cn } from "@/lib/utils";

interface PageProps {
  params: { id: string };
}

export default function ModerationDisputePage({ params }: PageProps) {
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
