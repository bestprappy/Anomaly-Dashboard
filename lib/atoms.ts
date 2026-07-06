import { atom } from "jotai";

export const themeAtom = atom<"light" | "dark">("light");

export const filterProviderAtom = atom<"all" | "PEA" | "MEA">("all");

export const filterCompanyAtom = atom<"all" | "BFKT" | "TUC" | "TMV">("all");

export const siteSearchAtom = atom<string>("");

export const selectedSiteIdAtom = atom<string | null>(null);
