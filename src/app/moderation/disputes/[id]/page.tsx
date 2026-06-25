import { DisputeDetailView } from "@/components/moderation/dispute-detail-view";

interface PageProps {
  params: { id: string };
}

export default function ModerationDisputePage({ params }: PageProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <DisputeDetailView disputeId={params.id} />
    </div>
  );
}
