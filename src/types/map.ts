export type UserLocationStatus =
  | "idle"
  | "loading"
  | "granted"
  | "denied"
  | "error";

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export interface MapOrigin {
  latitude: number;
  longitude: number;
}
