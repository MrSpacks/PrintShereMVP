/** Способ получения заказа */
export type DeliveryMethod = "pickup" | "delivery" | "zasilkovna";

export interface DeliveryChoice {
  method: DeliveryMethod;
  deliveryPriceCzk: number;
  /** Legacy Packeta point fields — unused for maker-fixed delivery */
  zasilkovnaPointId?: string;
  zasilkovnaPointLabel?: string;
}

/** Legacy stub types — Packeta API later when company is set up */
export interface ZasilkovnaQuoteRequest {
  makerId: string;
  weightGrams: number;
}

export interface ZasilkovnaQuoteResponse {
  priceCzk: number;
  currency: "CZK";
  provider: "zasilkovna";
  isEstimate: boolean;
}
