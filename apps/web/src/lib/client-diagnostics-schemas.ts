import { z } from "zod";

export const diagnosticReportIngestSchema = z.object({
  severity: z.enum(["INFO", "WARN", "ERROR"]).optional(),
  source: z.string().trim().min(1).max(64),
  category: z.string().trim().min(1).max(64),
  message: z.string().trim().min(1).max(2000),
  errorCode: z.string().trim().max(128).optional().nullable(),
  stack: z.string().max(8000).optional().nullable(),
  context: z.record(z.unknown()).optional().nullable(),
});

export const helpDeskReportUpdateSchema = z.object({
  status: z.enum(["OPEN", "ACKNOWLEDGED", "RESOLVED"]).optional(),
  internalNote: z.string().max(4000).optional().nullable(),
});
