export function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')

  try {
    link.href = objectUrl
    link.download = filename
    document.body.append(link)
    link.click()
  } finally {
    link.remove()
    URL.revokeObjectURL(objectUrl)
  }
}
