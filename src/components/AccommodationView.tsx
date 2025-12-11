import { useMemo } from "react";
import { Guest } from "@/types/guest";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Anchor, Building, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccommodationViewProps {
  guests: Guest[];
}

const accommodationIcons: Record<string, typeof MapPin> = {
  Sandi: Building,
  Aconchego: Home,
  "Vila Bom jardim": Home,
  Bartholomeu: Building,
  "Barco próprio": Anchor,
  "Pousada Literária": Building,
};

const accommodationColors: Record<string, string> = {
  Sandi: "bg-chart-1/20 border-chart-1/30 text-chart-1",
  Aconchego: "bg-chart-2/20 border-chart-2/30 text-chart-2",
  "Vila Bom jardim": "bg-chart-3/20 border-chart-3/30 text-chart-3",
  Bartholomeu: "bg-chart-4/20 border-chart-4/30 text-chart-4",
  "Barco próprio": "bg-chart-5/20 border-chart-5/30 text-chart-5",
  "Pousada Literária": "bg-chart-1/20 border-chart-1/30 text-chart-1",
};

export function AccommodationView({ guests }: AccommodationViewProps) {
  const accommodationGroups = useMemo(() => {
    const groups: Record<string, Guest[]> = {};

    guests
      .filter((g) => g.status === "Confirmado" && g.accommodation)
      .forEach((guest) => {
        if (!groups[guest.accommodation]) {
          groups[guest.accommodation] = [];
        }
        groups[guest.accommodation].push(guest);
      });

    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [guests]);

  return (
    <div className="space-y-6 pb-20">
      <header className="space-y-1">
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Hospedagens</h1>
            <p className="text-sm text-muted-foreground">Distribuição dos convidados confirmados</p>
          </div>
        </div>
      </header>

      <div className="grid gap-4">
        {accommodationGroups.map(([accommodation, guestList]) => {
          const Icon = accommodationIcons[accommodation] || MapPin;
          const colorClass = accommodationColors[accommodation] || "bg-muted border-border";

          return (
            <div
              key={accommodation}
              className={cn(
                "rounded-xl border p-4 animate-slide-up shadow-sm",
                colorClass
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-background/50">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{accommodation}</h3>
                    <p className="text-xs opacity-70">
                      {guestList.length} pessoa{guestList.length !== 1 && "s"}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-background/50">
                  <Users className="h-3 w-3 mr-1" />
                  {guestList.length}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                {guestList.map((guest) => (
                  <Badge
                    key={guest.id}
                    variant="outline"
                    className="bg-background/30 border-current/20 text-xs"
                  >
                    {guest.name}
                    {guest.ageGroup && (
                      <span className="ml-1 opacity-60">({guest.ageGroup})</span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
