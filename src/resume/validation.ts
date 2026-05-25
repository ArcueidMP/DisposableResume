import { resumeSchema } from './schema'

export function validateResume(data: unknown) {
  return resumeSchema.safeParse(data)
}
