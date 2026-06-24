import type {
  ZasilkovnaQuoteRequest,
  ZasilkovnaQuoteResponse,
} from "@/types/delivery";

/**
 * Заглушка расчёта доставки Zásilkovna (Packeta).
 * Заменится на реальный вызов Packeta API при выборе пункта выдачи.
 */
export async function getZasilkovnaQuote(
  request: ZasilkovnaQuoteRequest
): Promise<ZasilkovnaQuoteResponse> {
  const baseFee = 79;
  const weightSurcharge = Math.ceil(request.weightGrams / 500) * 15;

  return {
    priceCzk: baseFee + weightSurcharge,
    currency: "CZK",
    provider: "zasilkovna",
    isEstimate: true,
  };
}
