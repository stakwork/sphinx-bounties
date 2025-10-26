import type {
  BountyStatus as PrismaBountyStatus,
  ProgrammingLanguage as PrismaProgrammingLanguage,
  WorkspaceRole as PrismaWorkspaceRole,
} from "@prisma/client";
import type { BountyStatus, ProgrammingLanguage, WorkspaceRole } from "@/types/enums";

export function mapBountyStatus(status: BountyStatus): PrismaBountyStatus {
  return status as unknown as PrismaBountyStatus;
}

export function mapProgrammingLanguage(lang: ProgrammingLanguage): PrismaProgrammingLanguage {
  return lang as unknown as PrismaProgrammingLanguage;
}

export function mapProgrammingLanguages(langs: ProgrammingLanguage[]): PrismaProgrammingLanguage[] {
  return langs as unknown as PrismaProgrammingLanguage[];
}

export function mapWorkspaceRole(role: WorkspaceRole): PrismaWorkspaceRole {
  return role as unknown as PrismaWorkspaceRole;
}
