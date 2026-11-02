/** RFC 5987 value encoding: encodeURIComponent leaves ' ( ) * ! unescaped */
function encodeRfc5987(value: string): string {
  return encodeURIComponent(value).replace(
    /['()*!]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

/**
 * `attachment` header that survives any file name. HTTP headers only carry
 * Latin-1, so "součástka.stl" or Cyrillic names would throw when building the
 * response; send an ASCII fallback plus the exact UTF-8 name in filename*.
 */
export function attachmentContentDisposition(fileName: string): string {
  const name = fileName.trim() || "download";
  const asciiFallback = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]|["\\]/g, "_");

  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeRfc5987(name)}`;
}
