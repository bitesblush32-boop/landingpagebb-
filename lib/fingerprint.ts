export async function getFingerprint(): Promise<string> {
  const raw = [
    navigator.language,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.platform,
    navigator.hardwareConcurrency ?? 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).deviceMemory ?? 0,
  ].join('|')

  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
