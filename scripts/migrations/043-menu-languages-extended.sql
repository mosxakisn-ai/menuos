-- Extend QR menu / catalog translation languages (PL, CS, IT, SV, FI, TR).
ALTER TYPE "SupportedLanguage" ADD VALUE IF NOT EXISTS 'PL';
ALTER TYPE "SupportedLanguage" ADD VALUE IF NOT EXISTS 'CS';
ALTER TYPE "SupportedLanguage" ADD VALUE IF NOT EXISTS 'IT';
ALTER TYPE "SupportedLanguage" ADD VALUE IF NOT EXISTS 'SV';
ALTER TYPE "SupportedLanguage" ADD VALUE IF NOT EXISTS 'FI';
ALTER TYPE "SupportedLanguage" ADD VALUE IF NOT EXISTS 'TR';
