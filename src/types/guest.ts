export type AgeGroup = "Criança" | "Adolescente" | "Adulto" | "Idoso" | "";
export type GuestGroup = "Família" | "Amigos";
export type ConfirmationStatus = "Confirmado" | "Pendente" | "Não comparecerá";
export type FridayStatus = "sim" | "não" | "Aye" | "";

export type Accommodation = 
  | "Sandi" 
  | "Aconchego" 
  | "Vila Bom jardim" 
  | "Bartholomeu" 
  | "Barco próprio" 
  | "Pousada Literária"
  | "";

export interface Guest {
  id: string;
  inviteName: string;
  phone: string;
  group: GuestGroup;
  accommodation: Accommodation;
  name: string;
  friday: FridayStatus;
  ageGroup: AgeGroup;
  status: ConfirmationStatus;
  arrived?: boolean;
}

export interface GuestStats {
  total: number;
  confirmed: number;
  pending: number;
  notAttending: number;
  byGroup: Record<GuestGroup, number>;
  byAccommodation: Record<string, number>;
  byAgeGroup: Record<string, number>;
  fridayConfirmed: number;
  fridayCounts: Record<"sim" | "Aye" | "não", number>;
}
