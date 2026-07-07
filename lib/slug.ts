export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')                    // decompose accented chars
    .replace(/[\u0300-\u036f]/g, '')     // strip diacritics (é→e, ü→u)
    .replace(/[^a-z0-9]+/g, '-')        // non-alphanumeric → hyphen
    .replace(/^-+|-+$/g, '')            // trim leading/trailing hyphens
}

// "New Delhi"     → "new-delhi"
// "São Paulo"     → "sao-paulo"
// "Bengaluru"     → "bengaluru"
// "United Kingdom"→ "united-kingdom"
