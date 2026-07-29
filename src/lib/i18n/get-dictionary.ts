import "server-only";
import type { Locale } from "./config";

import de from "./dictionaries/de.json";
import en from "./dictionaries/en.json";
import fr from "./dictionaries/fr.json";

export type Dictionary = typeof de;

const dictionaries: Record<Locale, Dictionary> = { de, en, fr };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
