import { Guest } from "@/types/guest";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Phone, MapPin, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuestCardProps {
  guest: Guest;
  onStatusChange?: (id: string, status: Guest["status"]) => void;
  onArrivedToggle?: (id: string, arrived: boolean) => void;
}

const statusStyles = {
  Confirmado: "bg-success/10 text-success border-success/20",
  Pendente: "bg-warning/10 text-warning border-warning/20",
  "Não comparecerá": "bg-destructive/10 text-destructive border-destructive/20",
};

const ageGroupStyles = {
  Criança: "bg-chart-4/10 text-chart-4",
  Adolescente: "bg-chart-2/10 text-chart-2",
  Adulto: "bg-chart-1/10 text-chart-1",
  Idoso: "bg-chart-3/10 text-chart-3",
  "": "",
};

const waUrl = (raw: string) => {
  const digits = String(raw || "").replace(/\D/g, "");
  const hasCountry = digits.length > 11 && digits.startsWith("55");
  const normalized = hasCountry ? digits : `55${digits}`;
  return `https://wa.me/${normalized}`;
};

export function GuestCard({ guest, onArrivedToggle }: GuestCardProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-xl border p-4 transition-all duration-300 hover:shadow-md animate-fade-in",
        "border-border"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h3 className="font-semibold text-foreground">{guest.name}</h3>
            </div>
            <p className="text-xs text-muted-foreground">{guest.inviteName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={cn("text-xs font-medium", statusStyles[guest.status])}
          >
            {guest.status}
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-3.5 w-3.5" />
          <span>{guest.phone || "Sem telefone"}</span>
          {guest.phone && (
            <a
              href={waUrl(guest.phone)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Conversar no WhatsApp"
              className="ml-auto inline-flex items-center justify-center rounded-md p-1 text-green-600 hover:text-green-700"
            >
              <WhatsAppIcon className="h-4 w-4" />
            </a>
          )}
        </div>

        {guest.accommodation && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{guest.accommodation}</span>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap mt-3">
          <Badge variant="secondary" className="text-xs">
            {guest.group}
          </Badge>
          {guest.ageGroup && (
            <Badge
              variant="outline"
              className={cn("text-xs", ageGroupStyles[guest.ageGroup])}
            >
              {guest.ageGroup}
            </Badge>
          )}
          {guest.friday === "sim" || guest.friday === "Aye" ? (
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              <Calendar className="h-3 w-3 mr-1" />
              Sexta
            </Badge>
          ) : null}
        </div>
      </div>
    </div>
  );
}
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
  >
    <path d="M12.04 2C6.88 2 2.71 6.17 2.71 11.33c0 2.01.6 3.88 1.63 5.44L2 22l5.36-2.18a9.29 9.29 0 0 0 4.68 1.25c5.16 0 9.33-4.17 9.33-9.33S17.2 2 12.04 2Zm5.52 13.62c-.23.66-1.33 1.25-1.86 1.33-.48.08-1.1.11-1.77-.11-.41-.13-.94-.31-1.63-.61-2.87-1.24-4.73-4.14-4.87-4.33-.14-.19-1.17-1.56-1.17-2.97 0-1.4.74-2.08 1-2.37.23-.28.62-.4.99-.4.12 0 .23 0 .33.01.29.01.44.03.63.49.23.55.79 1.93.86 2.07.07.14.12.31.02.49-.09.19-.14.3-.28.48-.13.19-.3.43-.43.58-.14.15-.29.32-.12.62.17.3.76 1.25 1.64 2.03 1.13 1.01 2.07 1.32 2.37 1.46.3.14.47.12.63-.07.16-.19.72-.84.91-1.13.19-.3.4-.24.66-.14.26.09 1.65.78 1.93.92.28.14.46.21.53.33.07.12.07.7-.16 1.36Z" />
  </svg>
);
