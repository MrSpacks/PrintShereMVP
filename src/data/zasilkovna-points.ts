/** Тестовые výdejní místa Zásilkovny (do integrace Packeta widgetu) */
export interface ZasilkovnaPoint {
  id: string;
  label: string;
  city: string;
}

export const MOCK_ZASILKOVNA_POINTS: ZasilkovnaPoint[] = [
  {
    id: "z-point-prague-1",
    label: "Zásilkovna — Palladium, nám. Republiky 1",
    city: "Praha 1",
  },
  {
    id: "z-point-prague-2",
    label: "Zásilkovna — OC Nový Smíchov, Plzeňská 8",
    city: "Praha 5",
  },
  {
    id: "z-point-prague-3",
    label: "Zásilkovna — Florentinum, Sokolovská 21",
    city: "Praha 8",
  },
  {
    id: "z-point-prague-4",
    label: "Zásilkovna — Billa Korunní, Korunní 42",
    city: "Praha 2",
  },
];
