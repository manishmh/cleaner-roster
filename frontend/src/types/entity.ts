export type EntityType = "Supervisor" | "Cleaner" | "Team" | "Client";

export interface Entity {
  id?: number;
  type: EntityType;
  name: string;
  contact: string;
  email: string;
  status: "Active" | "Inactive";
  mobileUsername?: string;
  supervisor?: string;
  cleaners?: string[];
  address?: string;
} 