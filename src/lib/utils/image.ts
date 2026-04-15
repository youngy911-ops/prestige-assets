// Client-only — do NOT import from server components
// Libraries are dynamically imported to avoid bloating the client bundle (~80KB gzipped)

/**
 * Processes a File before upload:
 * 1. Reads EXIF orientation with exifr.rotation()
 * 2. If rotation needed, redraws onto canvas to bake pixels correctly (strips EXIF)
 * 3. Compresses to max 1600px longest side at 0.88 quality (JPEG output)
 *
 * Falls back gracefully at every step — if EXIF read or canvas rotation fails,
 * skips that step and proceeds with compression only. Never throws.
 */
export async function processImageForUpload(file: File): Promise<File> {
  let sourceFile: File = file

  // Step 1 & 2: EXIF rotation — wrapped in try/catch; failure is non-fatal
  try {
    const exifr = await import('exifr')
    const rotation = await exifr.rotation(file).catch(() => null)

    if (rotation && rotation.deg !== 0) {
      const bitmap = await createImageBitmap(file)
      const { width, height } = bitmap
      const deg = rotation.deg
      const swap = deg === 90 || deg === 270

      const canvas = document.createElement('canvas')
      canvas.width = swap ? height : width
      canvas.height = swap ? width : height

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate((deg * Math.PI) / 180)
        ctx.scale(rotation.scaleX ?? 1, rotation.scaleY ?? 1)
        ctx.drawImage(bitmap, -width / 2, -height / 2)

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.95)
        )
        if (blob) {
          sourceFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
        }
      }
    }
  } catch {
    // EXIF/canvas rotation failed — proceed with original file
    sourceFile = file
  }

  // Step 3: Compress — also wrapped; if compression fails return source as-is
  try {
    const imageCompression = (await import('browser-image-compression')).default
    return await imageCompression(sourceFile, {
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: 0.88,
    })
  } catch {
    // Compression failed — return uncompressed (better to upload large than not upload)
    return sourceFile
  }
}
