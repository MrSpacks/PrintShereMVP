/**
 * Режим продукта: connection MVP (без платежей на платформе) vs полный marketplace.
 * Код платежей/модерации остаётся — включается флагами или env на Vercel.
 */

function envFlag(name: string, defaultValue = false): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  return defaultValue;
}

/** Stripe, escrow, кнопка «Zaplatit» */
export function isPaymentsEnabled(): boolean {
  return envFlag("NEXT_PUBLIC_PAYMENTS_ENABLED", false);
}

/** Споры и раздел Moderace в UI */
export function isModerationEnabled(): boolean {
  return envFlag("NEXT_PUBLIC_MODERATION_ENABLED", false);
}

/** 10 % комиссия в расчёте цены для клиента */
export function isPlatformFeeEnabled(): boolean {
  return envFlag("NEXT_PUBLIC_PLATFORM_FEE_ENABLED", false);
}

/** Gross-up под Stripe в итоговой сумме */
export function isStripeFeeInQuoteEnabled(): boolean {
  return envFlag("NEXT_PUBLIC_STRIPE_FEE_IN_QUOTE", false);
}

/** Блок QR-пodpory na /support */
export function isSupportDonationsEnabled(): boolean {
  return envFlag("NEXT_PUBLIC_SUPPORT_DONATIONS_ENABLED", true);
}

/** Рекламные слоты (пока заглушки) */
export function isAdsEnabled(): boolean {
  return envFlag("NEXT_PUBLIC_ADS_ENABLED", false);
}

/** Connection MVP: оплата и доставка договариваются вне платформы */
export function isConnectionMode(): boolean {
  return !isPaymentsEnabled();
}

/** Показывать finance/Stripe в админке */
export function isAdminFinanceVisible(): boolean {
  return isPaymentsEnabled();
}

/** Модерация в навигации (moderator/admin) */
export function isModerationNavVisible(): boolean {
  return isModerationEnabled();
}

/** accept_terms сразу переводит в paid (без awaiting_payment) */
export function acceptTermsSkipsPayment(): boolean {
  return isConnectionMode();
}
