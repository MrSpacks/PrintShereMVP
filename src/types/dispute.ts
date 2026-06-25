export type DisputeStatus = "open" | "resolved";
export type DisputeResolution = "refund" | "rejected";

export interface DisputeEvidenceItem {
  id: string;
  imageUrl: string;
}

export interface DisputeSummary {
  id: string;
  orderId: string;
  status: DisputeStatus;
  complaintText: string;
  resolution: DisputeResolution | null;
  resolutionText: string | null;
  refundAmountCzk: number | null;
  statusBeforeDispute: string;
  evidence: DisputeEvidenceItem[];
  openedByName: string;
  resolvedByName: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface OpenDisputePayload {
  complaintText: string;
  evidenceUrls?: string[];
}

export interface ResolveDisputePayload {
  resolution: DisputeResolution;
  resolutionText: string;
  refundAmountCzk?: number;
}
