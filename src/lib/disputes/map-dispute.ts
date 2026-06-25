import type { Dispute, DisputeEvidence, User } from "@prisma/client";

import type { DisputeSummary } from "@/types/dispute";

type DisputeWithRelations = Dispute & {
  evidence: DisputeEvidence[];
  openedBy: Pick<User, "name">;
  resolvedBy: Pick<User, "name"> | null;
};

export function mapDispute(dispute: DisputeWithRelations): DisputeSummary {
  return {
    id: dispute.id,
    orderId: dispute.orderId,
    status: dispute.status,
    complaintText: dispute.complaintText,
    resolution: dispute.resolution,
    resolutionText: dispute.resolutionText,
    refundAmountCzk: dispute.refundAmountCzk,
    statusBeforeDispute: dispute.statusBeforeDispute,
    evidence: dispute.evidence.map((item) => ({
      id: item.id,
      imageUrl: item.imageUrl,
    })),
    openedByName: dispute.openedBy.name,
    resolvedByName: dispute.resolvedBy?.name ?? null,
    createdAt: dispute.createdAt.toISOString(),
    resolvedAt: dispute.resolvedAt?.toISOString() ?? null,
  };
}
