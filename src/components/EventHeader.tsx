import { Separator } from "@/components/ui/separator";

interface EventHeaderProps {
  title: string;
  subtitle?: string;
  image?: string | null;
  location?: string;
  date?: string;
}

export function EventHeader({
  title,
  subtitle = "Festa de aniversário",
  image,
  location = "Villa Bom Jardim, Ilha de Paraty",
  date = "Sexta e Sábado",
}: EventHeaderProps) {
  const imgSrc = image || "./mm-cerimonial.png";
  return (
    <div className="mb-6 bg-card rounded-xl border border-border p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl overflow-hidden border">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={title}
              className="h-full w-full object-cover"
              onError={(e) => {
                try {
                  const cur = e.currentTarget.getAttribute("src") || "";
                  if (cur.endsWith("mm-cerimonial.png")) {
                    e.currentTarget.setAttribute("src", "./mm-cerimonial.svg");
                  } else if (cur !== "/placeholder.svg") {
                    e.currentTarget.setAttribute("src", "/placeholder.svg");
                  }
                } catch { /* noop */ }
              }}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary to-accent opacity-80" />
          )}
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-display font-bold">{title}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <Separator className="my-4" />
      <div className="space-y-2">
        <h3 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Sobre o Evento</h3>
        <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
          <div>
            <p className="text-muted-foreground">Local</p>
            <p className="font-medium">{location}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Data</p>
            <p className="font-medium">{date}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventHeader;
