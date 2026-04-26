export const PROFESSIONS = [
  { value: 'software_web',               label: 'Software / Web Development' },
  { value: 'design',                      label: 'Design (UI/UX, graphic, brand)' },
  { value: 'architecture_engineering',   label: 'Architecture / Engineering' },
  { value: 'photography_video',          label: 'Photography / Video' },
  { value: 'writing_content',            label: 'Writing / Content / Copywriting' },
  { value: 'marketing',                  label: 'Marketing / Social Media' },
  { value: 'consulting',                 label: 'Consulting / Strategy' },
  { value: 'music_audio',               label: 'Music / Audio' },
  { value: 'other',                      label: 'Other' },
] as const

export type ProfessionValue = typeof PROFESSIONS[number]['value']

export const PROFESSION_LABEL: Record<ProfessionValue, string> = Object.fromEntries(
  PROFESSIONS.map(p => [p.value, p.label])
) as Record<ProfessionValue, string>

export function professionContext(profession: string | null | undefined): string | null {
  if (!profession) return null
  const label = PROFESSION_LABEL[profession as ProfessionValue] ?? profession
  return `FREELANCER PROFESSION: ${label}`
}
