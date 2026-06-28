import type { WorkshopPrinterInput } from "@/types/maker";

export interface MakerSignupPayload {
  name: string;
  email: string;
  password: string;
  workshopName: string;
  address: string;
  printers: WorkshopPrinterInput[];
}
