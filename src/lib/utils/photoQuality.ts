/**
 * Basic client-side photo quality checks using canvas.
 * Returns a list of warning strings (empty = all good).
 */
export async function checkPhotoQuality(imageUrl: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const size = 100 // downsample for speed
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve([]); return }
        ctx.drawImage(img, 0, 0, size, size)
        const data = ctx.getImageData(0, 0, size, size).data
        const warnings: string[] = []

        // Brightness check — average luminance
        let totalLuminance = 0
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2]
          totalLuminance += 0.299 * r + 0.587 * g + 0.114 * b
        }
        const avgLuminance = totalLuminance / (size * size)
        if (avgLuminance < 30) warnings.push('too dark')
        if (avgLuminance > 240) warnings.push('overexposed')

        // Contrast/blur estimate — standard deviation of luminance
        let variance = 0
        const pixelCount = size * size
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2]
          const lum = 0.299 * r + 0.587 * g + 0.114 * b
          variance += Math.pow(lum - avgLuminance, 2)
        }
        const stdDev = Math.sqrt(variance / pixelCount)
        if (stdDev < 12) warnings.push('possibly blurry or featureless')

        resolve(warnings)
      } catch {
        resolve([])
      }
    }
    img.onerror = () => resolve([])
    img.src = imageUrl
  })
}
