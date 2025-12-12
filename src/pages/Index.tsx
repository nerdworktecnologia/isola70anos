import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dashboard } from "@/components/Dashboard";
import { GuestList } from "@/components/GuestList";
import { AccommodationView } from "@/components/AccommodationView";
import { SettingsView } from "@/components/SettingsView";
import { BottomNav } from "@/components/BottomNav";
import { StockView } from "@/components/StockView";
import { initialGuests } from "@/data/guests";
import EventHeader from "@/components/EventHeader";
import { getArrivals, setArrived } from "@/lib/api";
import { getStore } from "@/lib/api";

type TabType = "dashboard" | "guests" | "accommodations" | "stock" | "settings";

const readEvent = () => {
  try {
    const raw = localStorage.getItem("isola.event");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeEvent = (patch: Record<string, unknown>) => {
  try {
    const cur = readEvent() || {};
    const next = { ...cur, ...patch };
    localStorage.setItem("isola.event", JSON.stringify(next));
    try { window.dispatchEvent(new CustomEvent("isola:event-update")); } catch { /* noop */ }
  } catch { void 0; }
};

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [guests, setGuests] = useState(() => {
    try {
      const ev = readEvent();
      if (ev && Array.isArray(ev.guests)) return ev.guests as typeof initialGuests;
      const raw = localStorage.getItem("isola.guests");
      if (!raw) return initialGuests;
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : initialGuests;
    } catch {
      return initialGuests;
    }
  });
  const [eventTitle, setEventTitle] = useState<string>(() => {
    try {
      const ev = readEvent();
      const t = (ev && typeof ev.title === "string" ? (ev.title as string) : null) || localStorage.getItem("isola.title");
      return t || "Isola 70";
    } catch {
      return "Isola 70";
    }
  });
  const [eventImage, setEventImage] = useState<string | null>(() => {
    try {
      const ev = readEvent();
      const img = (ev && typeof ev.image === "string" ? (ev.image as string) : null) || localStorage.getItem("isola.eventImage");
      return img || null;
    } catch {
      return null;
    }
  });
  const isMobile = useIsMobile();
  const contentRef = useRef<HTMLDivElement>(null);
  const [showTop, setShowTop] = useState(false);
  const [settingsUnlocked, setSettingsUnlocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem("isola.settings.unlocked") === "true";
    } catch {
      return false;
    }
  });
  const [arrivalsRefreshedAt, setArrivalsRefreshedAt] = useState<number | null>(null);
  const refreshArrivalsNow = async () => {
    return;
  };
  const arrivalsAutoLockRef = useRef<number>(0);

  useEffect(() => {
    (async () => {
      try {
        const meta = await getStore<Record<string, string | undefined>>("event.meta");
        if (meta && typeof meta === "object") {
          const t = typeof meta.title === "string" ? meta.title : undefined;
          const s = typeof meta.subtitle === "string" ? meta.subtitle : undefined;
          const l = typeof meta.location === "string" ? meta.location : undefined;
          const d = typeof meta.date === "string" ? meta.date : undefined;
          const img = typeof meta.image === "string" ? meta.image : undefined;
          if (t && t !== eventTitle) setEventTitle(t);
          if (img && img !== eventImage) setEventImage(img);
          writeEvent({ title: t || eventTitle, subtitle: s ?? undefined, location: l ?? undefined, date: d ?? undefined, image: img || (eventImage || "") });
        }
      } catch { void 0; }
    })();
  }, []);

  useEffect(() => {
    const refresh = async () => {
      try {
        const meta = await getStore<Record<string, string | undefined>>("event.meta");
        if (meta && typeof meta === "object") {
          const t = typeof meta.title === "string" ? meta.title : undefined;
          const img = typeof meta.image === "string" ? meta.image : undefined;
          if (t && t !== eventTitle) setEventTitle(t);
          if (img && img !== eventImage) setEventImage(img);
          const s = typeof meta.subtitle === "string" ? meta.subtitle : undefined;
          const l = typeof meta.location === "string" ? meta.location : undefined;
          const d = typeof meta.date === "string" ? meta.date : undefined;
          writeEvent({ title: t || eventTitle, subtitle: s ?? undefined, location: l ?? undefined, date: d ?? undefined, image: img || (eventImage || "") });
        }
      } catch { void 0; }
    };
    const onFocus = () => {
      const now = Date.now();
      if (now - arrivalsAutoLockRef.current < 3000) return;
      arrivalsAutoLockRef.current = now;
      refresh();
    };
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - arrivalsAutoLockRef.current < 3000) return;
      arrivalsAutoLockRef.current = now;
      refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [eventTitle, eventImage]);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard guests={guests} />;
      case "guests":
        return <GuestList guests={guests} />;
      case "accommodations":
        return <AccommodationView guests={guests} />;
      case "stock":
        return <StockView />;
      case "settings":
        return <SettingsView guests={guests} onImport={setGuests} />;
      default:
        return <Dashboard guests={guests} />;
    }
  };

  useEffect(() => {
    document.title = `${eventTitle} - Controle de Convidados`;
  }, [eventTitle]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("isola.event");
      const ev = raw ? JSON.parse(raw) : {};
      const gRaw = localStorage.getItem("isola.guests");
      const tRaw = localStorage.getItem("isola.title");
      const iRaw = localStorage.getItem("isola.eventImage");
      const aRaw = localStorage.getItem("isola.arrivals");
      const sRaw = localStorage.getItem("isola.stock");
      const next: Record<string, unknown> = { ...ev };
      if (!Array.isArray(next.guests)) next.guests = gRaw ? JSON.parse(gRaw) : next.guests;
      if (typeof next.title !== "string") next.title = tRaw || next.title;
      if (typeof next.image !== "string") next.image = iRaw || next.image;
      if (!next.arrivals || typeof next.arrivals !== "object") next.arrivals = aRaw ? JSON.parse(aRaw) : next.arrivals;
      if (!Array.isArray(next.stock)) next.stock = sRaw ? JSON.parse(sRaw) : next.stock;
      localStorage.setItem("isola.event", JSON.stringify(next));
      localStorage.removeItem("isola.guests");
      localStorage.removeItem("isola.title");
      localStorage.removeItem("isola.eventImage");
      localStorage.removeItem("isola.arrivals");
      localStorage.removeItem("isola.stock");
    } catch { void 0; }
  }, []);

  useEffect(() => {
    writeEvent({ guests });
  }, [guests]);

  useEffect(() => {
    writeEvent({ title: eventTitle });
  }, [eventTitle]);

  useEffect(() => {
    if (!eventImage) return;
    writeEvent({ image: eventImage });
  }, [eventImage]);

  useEffect(() => {
    const el = (isMobile ? contentRef.current : window) as HTMLDivElement | (Window & typeof globalThis) | null;
    if (!el) return;
    const onScroll = () => {
      const y = isMobile ? (contentRef.current?.scrollTop || 0) : window.scrollY;
      setShowTop(y > 120);
    };
    onScroll();
    el.addEventListener("scroll", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
    };
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) {
      contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeTab, isMobile]);

  useEffect(() => { }, []);

  useEffect(() => { }, []);

  const scrollToTop = () => {
    if (isMobile) {
      contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleTabChange = (tab: TabType) => {
    if (tab === "settings" && !settingsUnlocked) {
      try {
        const input = window.prompt("Digite a senha para acessar Configurações");
        if (input === "1931") {
          setSettingsUnlocked(true);
          try { localStorage.setItem("isola.settings.unlocked", "true"); } catch { /* noop */ }
          setActiveTab("settings");
          return;
        }
        return;
      } catch {
        return;
      }
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-background">
      <main
        className={cn(
          isMobile
            ? "container w-full px-3 h-[calc(100vh-3rem)] overflow-y-auto pb-3"
            : "container max-w-3xl mx-auto px-6 py-8 pb-20"
        )}
        ref={contentRef}
      >
        {activeTab !== "settings" && (
          <EventHeader title={eventTitle} image={eventImage} />
        )}
        {activeTab === "dashboard" ? (
          <Dashboard guests={guests} title={eventTitle} />
        ) : activeTab === "guests" ? (
          <GuestList
            guests={guests}
            eventTitle={eventTitle}
            lastRefreshTs={arrivalsRefreshedAt || undefined}
            onRefreshArrivals={refreshArrivalsNow}
            onToggleArrived={async (id, arrived) => {
              setGuests((prev) => prev.map((g) => (g.id === id ? { ...g, arrived } : g)));
              try {
                await setArrived(id, arrived);
              } catch { /* noop */ }
              try {
                const cur = readEvent() || {};
                const m = (cur.arrivals as Record<string, boolean>) || {};
                m[id] = arrived;
                writeEvent({ arrivals: m });
              } catch { void 0; }
            }}
          />
        ) : activeTab === "accommodations" ? (
          <AccommodationView guests={guests} />
        ) : activeTab === "stock" ? (
          <StockView />
        ) : (
          <SettingsView
            guests={guests}
            onImport={setGuests}
            eventTitle={eventTitle}
            onTitleChange={setEventTitle}
            eventImage={eventImage || undefined}
            onImageChange={(img) => setEventImage(img)}
          />
        )}
      </main>
      {showTop && (
        <button
          onClick={scrollToTop}
          aria-label="Subir para o topo"
          className="fixed right-3 bottom-16 sm:bottom-20 z-50 rounded-full bg-primary text-primary-foreground shadow-lg p-3 hover:opacity-90"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default Index;
