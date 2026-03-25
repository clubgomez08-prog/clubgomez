/**
 * Detecta si una URL apunta a un video por extensión (p. ej. .mov, .mp4).
 */
export function esUrlVideo(url) {
  if (!url || typeof url !== "string") return false;
  const clean = url.split("?")[0].split("#")[0].toLowerCase();
  return /\.(mov|mp4|webm|m4v|ogv|avi|mkv)$/.test(clean);
}
