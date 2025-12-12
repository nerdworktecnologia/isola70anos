import { LayoutDashboard, Users, MapPin, Settings, Wine } from "lucide-react";
import { cn } from "@/lib/utils";

type TabType = "dashboard" | "guests" | "accommodations" | "stock" | "settings";

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const navItems: { id: TabType; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "guests", label: "Convidados", icon: Users },
  { id: "accommodations", label: "Hospedagem", icon: MapPin },
  { id: "stock", label: "Estoque", icon: Wine },
  { id: "settings", label: "Config", icon: Settings },
];

const disabledTabs: TabType[] = [];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around h-12 px-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const isDisabled = disabledTabs.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => {
                if (!isDisabled) onTabChange(item.id);
              }}
              disabled={isDisabled}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full px-1 transition-all duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isDisabled ? "opacity-50 cursor-not-allowed" : isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 mb-0.5 transition-transform duration-200",
                  isActive && "scale-110"
                )}
              />
              <span
                className={cn(
                  "text-[9px] font-medium transition-all duration-200",
                  isActive && "font-semibold"
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0.5 w-6 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
