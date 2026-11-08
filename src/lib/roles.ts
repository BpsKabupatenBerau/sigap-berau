export type UserRole = "SUPERADMIN" | "PEMBINA_SEKTORAL" | "OPERATOR_OPD";

export interface ActiveSession {
  realUser: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    jabatan: string | null;
    opdId: string | null;
    opdName: string | null;
    opdShortName: string | null;
  };
  effectiveUser: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    jabatan: string | null;
    opdId: string | null;
    opdName: string | null;
    opdShortName: string | null;
    activity1Name: string | null;
    activity2Name: string | null;
  };
  isImpersonating: boolean;
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case "SUPERADMIN":
      return "Superadmin BPS";
    case "PEMBINA_SEKTORAL":
      return "Pembina Sektoral";
    case "OPERATOR_OPD":
      return "Operator OPD";
  }
}

