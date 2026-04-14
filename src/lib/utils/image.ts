// Client-only — do NOT import from server components
import imageCompression from 'browser-image-compression'
import * as exifr from 'exifr'

/**
 * Processes a File before upload:
 * 1. Reads EXIF orientation with exifr.rotation()
 * 2. If rotation needed, redraws onto canvas to bake pixels correctly (strips EXIF)
 * 3. Compresses to max 1920px longest side at 0.85 quality (JPEG output)
 *
 * This ensures images display and process correctly regardless of browser EXIF handling,
 * and that GPT-4o receives correctly oriented pixel data in Phase 3.
 */
export async function processImageForUpload(file: File): Promise<File> {
  // Step 1: Read EXIF rotation — catch errors for files with no EXIF (e.g. screenshots)
  const rotation = await exifr.rotation(file).catch(() => null)

  let sourceFile: File = file

  // Step 2: Canvas redraw only if rotation is needed
  if (rotation && rotation.deg !== 0) {
    const bitmap = await createImageBitmap(file)
    const { width, height } = bitmap
    const deg = rotation.deg
    const swap = deg === 90 || deg === 270

    const canvas = document.createElement('canvas')
    canvas.width = swap ? height : width
    canvas.height = swap ? width : height

    const ctx = canvas.getContext('2d')!
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((deg * Math.PI) / 180)
    ctx.scale(rotation.scaleX ?? 1, rotation.scaleY ?? 1)
    ctx.drawImage(bitmap, -width / 2, -height / 2)

    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.95)
    )
    sourceFile = new File([blob], file.name, { type: 'image/jpeg' })
  }

  // Step 3: Compress to max 1200px — sufficient for GPT-4o vision, 2x faster than 1920px
  return imageCompression(sourceFile, {
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.82,
    // Do NOT set preserveExif: true — we've already baked orientation into pixels
  })
}
