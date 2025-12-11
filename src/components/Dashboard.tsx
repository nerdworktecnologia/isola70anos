import { useMemo, useEffect, useState } from "react";
import { Guest, GuestStats } from "@/types/guest";
import { StatsCard } from "./StatsCard";
import { Users, UserCheck, UserX, Clock, Home, CalendarDays } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LabelList } from "recharts";

interface DashboardProps {
  guests: Guest[];
  title?: string;
}

const COLORS = [
  "hsl(195 45% 45%)", // teal
  "hsl(210 60% 40%)", // oceano
  "hsl(25 65% 46%)",  // coral
  "hsl(45 35% 55%)",  // areia
  "hsl(210 25% 18%)", // azul escuro
  "hsl(180 50% 40%)", // água
];

export function Dashboard({ guests, title = "Isola 70" }: DashboardProps) {
  const readEvent = () => {
    try {
      const raw = localStorage.getItem("isola.event");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  const [subtitle, setSubtitle] = useState<string>(() => {
    const ev = readEvent();
    const v = ev && typeof ev.subtitle === "string" ? (ev.subtitle as string) : null;
    return v || "";
  });
  const [locationText, setLocationText] = useState<string>(() => {
    const ev = readEvent();
    const v = ev && typeof ev.location === "string" ? (ev.location as string) : null;
    return v || "";
  });
  const [dateText, setDateText] = useState<string>(() => {
    const ev = readEvent();
    const v = ev && typeof ev.date === "string" ? (ev.date as string) : null;
    return v || "";
  });
  useEffect(() => {
    const onUpdate = () => {
      const ev = readEvent();
      setSubtitle(ev && typeof ev.subtitle === "string" ? (ev.subtitle as string) : "");
      setLocationText(ev && typeof ev.location === "string" ? (ev.location as string) : "");
      setDateText(ev && typeof ev.date === "string" ? (ev.date as string) : "");
    };
    window.addEventListener("isola:event-update", onUpdate as EventListener);
    return () => {
      window.removeEventListener("isola:event-update", onUpdate as EventListener);
    };
  }, []);
  const stats: GuestStats = useMemo(() => {
    const confirmed = guests.filter((g) => g.status === "Confirmado").length;
    const notAttending = guests.filter((g) => g.status === "Não comparecerá").length;
    const pending = guests.length - confirmed - notAttending;

    const byGroup: Record<string, number> = {};
    const byAccommodation: Record<string, number> = {};
    const byAgeGroup: Record<string, number> = {};
    let fridayConfirmed = 0;
    const fridayCounts: Record<"sim" | "Aye" | "não", number> = { sim: 0, Aye: 0, "não": 0 };

    guests.forEach((guest) => {
      if (guest.status !== "Confirmado") return;

      byGroup[guest.group] = (byGroup[guest.group] || 0) + 1;

      if (guest.accommodation) {
        byAccommodation[guest.accommodation] =
          (byAccommodation[guest.accommodation] || 0) + 1;
      }

      const age = guest.ageGroup || "Adulto";
      byAgeGroup[age] = (byAgeGroup[age] || 0) + 1;

      if (guest.friday === "sim" || guest.friday === "Aye") fridayConfirmed++;
      if (guest.friday === "sim") fridayCounts.sim++;
      else if (guest.friday === "Aye") fridayCounts.Aye++;
      else if (guest.friday === "não") fridayCounts["não"]++;
    });

    return {
      total: guests.length,
      confirmed,
      pending,
      notAttending,
      byGroup: byGroup as Record<"Família" | "Amigos", number>,
      byAccommodation,
      byAgeGroup,
      fridayConfirmed,
      fridayCounts,
    };
  }, [guests]);

  const accommodationData = Object.entries(stats.byAccommodation)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const groupData = Object.entries(stats.byGroup).map(([name, value]) => ({
    name,
    value,
  }));

  const fridayTotal = stats.fridayCounts.sim + stats.fridayCounts.Aye + stats.fridayCounts["não"];
  const fridayData = [
    {
      name: "Sim",
      value: stats.fridayCounts.sim,
      color: "hsl(145 50% 45%)",
      label: `${stats.fridayCounts.sim} (${fridayTotal ? Math.round((stats.fridayCounts.sim * 100) / fridayTotal) : 0}%)`,
    },
    {
      name: "Aye",
      value: stats.fridayCounts.Aye,
      color: "hsl(210 60% 40%)",
      label: `${stats.fridayCounts.Aye} (${fridayTotal ? Math.round((stats.fridayCounts.Aye * 100) / fridayTotal) : 0}%)`,
    },
    {
      name: "Não",
      value: stats.fridayCounts["não"],
      color: "hsl(0 65% 55%)",
      label: `${stats.fridayCounts["não"]} (${fridayTotal ? Math.round((stats.fridayCounts["não"] * 100) / fridayTotal) : 0}%)`,
    },
  ];

  return (
    <div className="space-y-6 pb-20">
      <header className="space-y-1">
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
            </div>
            <p className="text-sm text-muted-foreground">Acompanhe os números do evento</p>
            {subtitle ? (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-muted-foreground">
              {locationText ? (
                <span className="inline-flex items-center gap-1"><Home className="h-4 w-4" /> {locationText}</span>
              ) : null}
              {dateText ? (
                <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" /> {dateText}</span>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <StatsCard
          title="Total"
          value={stats.total}
          subtitle="convidados"
          icon={Users}
          variant="default"
        />
        <StatsCard
          title="Confirmados"
          value={stats.confirmed}
          subtitle="para sábado"
          icon={UserCheck}
          variant="success"
        />
        <StatsCard
          title="Sexta"
          value={stats.fridayConfirmed}
          subtitle="confirmados"
          icon={CalendarDays}
          variant="primary"
        />
        <StatsCard
          title="Ausentes"
          value={stats.notAttending}
          subtitle="não vão"
          icon={UserX}
          variant="danger"
        />
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-display font-semibold text-foreground">
          Sexta
        </h2>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-center gap-6">
            <div className="h-24 w-24 md:h-32 md:w-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fridayData}
                    cx="50%"
                    cy="50%"
                    innerRadius={32}
                    outerRadius={58}
                    dataKey="value"
                    strokeWidth={2}
                    label
                  >
                    {fridayData.map((d, index) => (
                      <Cell key={`cell-${index}`} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number, name: string) => {
                      const pct = fridayTotal ? Math.round((Number(value) * 100) / fridayTotal) : 0;
                      return [`${value} (${pct}%)`, name];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {fridayData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {entry.name}
                  </span>
                  <span className="text-sm font-semibold">{entry.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-display font-semibold text-foreground">
          Por Hospedagem
        </h2>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-center gap-6">
            <div className="h-24 w-24 md:h-32 md:w-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={accommodationData.map((d, index) => ({
                      name: d.name,
                      value: d.value,
                      color: COLORS[index % COLORS.length],
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={32}
                    outerRadius={58}
                    dataKey="value"
                    strokeWidth={2}
                  >
                    {accommodationData.map((d, index) => (
                      <Cell key={d.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number, name: string) => {
                      const total = accommodationData.reduce((sum, d) => sum + d.value, 0);
                      const pct = total ? Math.round((Number(value) * 100) / total) : 0;
                      return [`${value} (${pct}%)`, name];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {accommodationData.map((entry, index) => {
                const total = accommodationData.reduce((sum, d) => sum + d.value, 0);
                const pct = total ? Math.round((Number(entry.value) * 100) / total) : 0;
                return (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {entry.name}
                    </span>
                    <span className="text-sm font-semibold">{`${entry.value} (${pct}%)`}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-display font-semibold text-foreground">
          Por Grupo
        </h2>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-center gap-4 md:gap-8">
            <div className="h-24 w-24 md:h-32 md:w-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={groupData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={55}
                    dataKey="value"
                    strokeWidth={2}
                  >
                    {groupData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {groupData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {entry.name}
                  </span>
                  <span className="text-sm font-semibold">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-display font-semibold text-foreground">
          Por Faixa Etária
        </h2>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(stats.byAgeGroup).map(([age, count], index) => (
              <div
                key={age}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <span className="text-sm text-muted-foreground">{age}</span>
                <span
                  className="text-lg font-bold"
                  style={{ color: COLORS[index % COLORS.length] }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
