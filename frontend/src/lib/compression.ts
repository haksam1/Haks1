/**
 * Compresses a Base64 Data URL string into a GZIP binary Blob.
 */
export async function compressToGzipBlob(base64DataUrl: string): Promise<Blob> {
  const bytes = new TextEncoder().encode(base64DataUrl);
  
  if (typeof (window as any).CompressionStream === 'undefined') {
    // Fallback if CompressionStream is not available
    return new Blob([bytes], { type: 'application/gzip' });
  }

  const blob = new Blob([bytes]);
  const stream = blob.stream().pipeThrough(new (window as any).CompressionStream('gzip'));
  return await new Response(stream).blob();
}

/**
 * Decompresses a GZIP ArrayBuffer back into the original Base64 Data URL string.
 */
export async function decompressGzipArrayBuffer(buffer: ArrayBuffer): Promise<string> {
  if (typeof (window as any).DecompressionStream === 'undefined') {
    // Fallback if DecompressionStream is not available
    return new TextDecoder().decode(buffer);
  }

  const blob = new Blob([buffer]);
  const stream = blob.stream().pipeThrough(new (window as any).DecompressionStream('gzip'));
  const decompressedBuffer = await new Response(stream).arrayBuffer();
  return new TextDecoder().decode(decompressedBuffer);
}
