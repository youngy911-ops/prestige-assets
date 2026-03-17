// Stub — full edit-type functionality is a Phase 4/6 concern
// For now, redirects back to the photo upload page with a placeholder message
import { redirect } from 'next/navigation'

interface EditTypePageProps {
  params: Promise<{ id: string }>
}

export default async function EditTypePage({ params }: EditTypePageProps) {
  const { id } = await params
  // Placeholder: redirect to photos page until wizard editing is implemented
  redirect(`/assets/${id}/photos`)
}
