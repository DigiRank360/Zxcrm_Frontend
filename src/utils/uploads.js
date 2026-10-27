const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const supportedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

export function fileToDataUrl(file) {
  if (!file || !supportedImageTypes.has(file.type)) {
    throw new Error('Choose a JPEG, PNG, or WebP image.')
  }
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Image must be no larger than 5 MB.')
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read the selected image.'))
    reader.readAsDataURL(file)
  })
}

export function documentToDataUrl(file) {
  const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png'])
  if (!file || !allowedTypes.has(file.type)) {
    throw new Error('Choose a PDF, JPEG, or PNG document.')
  }
  if (file.size > 7 * 1024 * 1024) throw new Error('Document must be no larger than 7 MB.')
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read the selected document.'))
    reader.readAsDataURL(file)
  })
}
