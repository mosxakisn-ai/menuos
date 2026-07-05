import type { TableTileState } from "@menuos/shared";
import type { DashboardLang } from "@/content/dashboard-i18n";

export type DemoStaffMember = {
  id: string;
  name: string;
  role: string;
  stations: string[];
};

export type DemoPassSignal = {
  id: string;
  table: string;
  station: "kitchen" | "bar" | "cold" | "dessert";
  message: string;
  minutesAgo: number;
};

export type DemoTableTile = {
  id?: string;
  label: string;
  state: TableTileState;
  hint?: string;
};

const DEMO_EL = {
  badge: "Δείγμα — για δοκιμές UI",
  staff: [
    { id: "1", name: "Μαρία Π.", role: "Σερβιτόρος", stations: ["services"] },
    { id: "2", name: "Γιώργος Κ.", role: "Σερβιτόρος", stations: ["services"] },
    { id: "3", name: "Νίκος Α.", role: "Μάγειρας", stations: ["Κουζίνα"] },
    { id: "4", name: "Ελένη Μ.", role: "Μπαρ", stations: ["Μπαρ"] },
    { id: "5", name: "Κώστας Δ.", role: "Manager", stations: ["Όλα"] },
  ] satisfies DemoStaffMember[],
  passSignals: [
    {
      id: "p1",
      table: "12",
      station: "kitchen",
      message: "2 μουσακάς — έλα πάσο",
      minutesAgo: 2,
    },
    {
      id: "p2",
      table: "5",
      station: "bar",
      message: "Ξέχασες τον πάγο",
      minutesAgo: 4,
    },
    {
      id: "p3",
      table: "8",
      station: "kitchen",
      message: "Σαλάτα Cesar",
      minutesAgo: 7,
    },
  ] satisfies DemoPassSignal[],
  tableTiles: [
    { label: "1", state: "idle" },
    { label: "5", state: "bar_ready", hint: "Ποτό έτοιμο" },
    { label: "8", state: "kitchen_ready", hint: "Έλα πάσο" },
    { label: "12", state: "both", hint: "Κλήση + πάσο" },
    { label: "15", state: "guest_call", hint: "Κλήση πελάτη" },
    { label: "20", state: "idle" },
  ] satisfies DemoTableTile[],
  stationLabels: {
    kitchen: "Κουζίνα",
    bar: "Μπαρ",
    cold: "Κρύα",
    dessert: "Γλυκά",
  },
  tableStateLabels: {
    idle: "Ήσυχο",
    guest_call: "Κλήση πελάτη",
    kitchen_ready: "Έτοιμο — κουζίνα",
    cold_ready: "Έτοιμο — κρύα",
    bar_ready: "Έτοιμο — μπαρ",
    both: "Πολλαπλά",
  },
};

const DEMO_EN = {
  badge: "Sample — UI preview",
  staff: [
    { id: "1", name: "Maria P.", role: "Waiter", stations: ["services"] },
    { id: "2", name: "George K.", role: "Waiter", stations: ["services"] },
    { id: "3", name: "Nikos A.", role: "Chef", stations: ["Kitchen"] },
    { id: "4", name: "Eleni M.", role: "Bar", stations: ["Bar"] },
    { id: "5", name: "Kostas D.", role: "Manager", stations: ["All"] },
  ] satisfies DemoStaffMember[],
  passSignals: [
    {
      id: "p1",
      table: "12",
      station: "kitchen",
      message: "2 moussaka — pass ready",
      minutesAgo: 2,
    },
    {
      id: "p2",
      table: "5",
      station: "bar",
      message: "You forgot the ice",
      minutesAgo: 4,
    },
    {
      id: "p3",
      table: "8",
      station: "kitchen",
      message: "Caesar salad",
      minutesAgo: 7,
    },
  ] satisfies DemoPassSignal[],
  tableTiles: [
    { label: "1", state: "idle" },
    { label: "5", state: "bar_ready", hint: "Drink ready" },
    { label: "8", state: "kitchen_ready", hint: "Pass ready" },
    { label: "12", state: "both", hint: "Call + pass" },
    { label: "15", state: "guest_call", hint: "Guest call" },
    { label: "20", state: "idle" },
  ] satisfies DemoTableTile[],
  stationLabels: {
    kitchen: "Kitchen",
    bar: "Bar",
    cold: "Cold",
    dessert: "Dessert",
  },
  tableStateLabels: {
    idle: "Quiet",
    guest_call: "Guest call",
    kitchen_ready: "Kitchen ready",
    cold_ready: "Cold ready",
    bar_ready: "Bar ready",
    both: "Multiple",
  },
};

export function getSettingsDemo(lang: DashboardLang) {
  return lang === "EN" ? DEMO_EN : DEMO_EL;
}
