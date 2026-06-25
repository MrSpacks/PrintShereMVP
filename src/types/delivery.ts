/** Способ получения заказа */
export type DeliveryMethod = "pickup" | "zasilkovna";

export interface DeliveryChoice {
  method: DeliveryMethod;
  deliveryPriceCzk: number;
  zasilkovnaPointId?: string;
  zasilkovnaPointLabel?: string;
}

export interface ZasilkovnaQuoteRequest {
  makerId: string;
  weightGrams: number;
}

export interface ZasilkovnaQuoteResponse {
  priceCzk: number;
  currency: "CZK";
  provider: "zasilkovna";
  /** Заглушка до полной интеграции Packeta API */
  isEstimate: boolean;
}
