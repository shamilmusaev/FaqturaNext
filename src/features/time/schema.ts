import { z } from 'zod'

export const ProjectStatusSchema = z.enum(['active', 'closed'])
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>

// Parsed, validated project payload. The H:MM and money strings from the form
// are turned into integers (minutes) / cents in the action before validation.
export const ProjectInputSchema = z.object({
  clientId: z.string().uuid('Pick a client'),
  name: z.string().min(1, 'Name is required').max(200),
  estimateMinutes: z.number().int().positive().nullable(),
  rateCents: z.number().int().nonnegative().nullable(),
  status: ProjectStatusSchema,
})
export type ProjectInput = z.infer<typeof ProjectInputSchema>

export const TaskStatusSchema = z.enum(['todo', 'in_progress', 'done'])
export type TaskStatus = z.infer<typeof TaskStatusSchema>

export const TaskInputSchema = z.object({
  projectId: z.string().uuid('Pick a project'),
  name: z.string().min(1, 'Name is required').max(200),
  estMinMinutes: z.number().int().nonnegative().nullable(),
  estMaxMinutes: z.number().int().nonnegative().nullable(),
  actualMinutes: z.number().int().nonnegative().nullable(),
  status: TaskStatusSchema,
})
export type TaskInput = z.infer<typeof TaskInputSchema>

export const TimeEntryInputSchema = z.object({
  projectId: z.string().uuid('Pick a project'),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date'),
  minutes: z.number().int().positive('Enter time as H:MM'),
  category: z.preprocess((v) => (v === '' ? undefined : v), z.string().max(100).optional()),
  description: z.preprocess((v) => (v === '' ? undefined : v), z.string().max(500).optional()),
})
export type TimeEntryInput = z.infer<typeof TimeEntryInputSchema>
