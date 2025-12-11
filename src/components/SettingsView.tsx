import { PartyPopper, Info, Download, Upload, Settings, Trash2, Image as ImageIcon, Pencil, MapPin, CalendarDays } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Guest, AgeGroup, GuestGroup, ConfirmationStatus, FridayStatus, GuestStats } from "@/types/guest";
// XLSX and ExcelJS are loaded on demand to reduce memory usage
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ToastAction } from "@/components/ui/toast";
import { z } from "zod";
import { getStore, setStore } from "@/lib/api";

interface SettingsViewProps {
  guests: Guest[];
  onImport: (guests: Guest[]) => void;
  eventTitle: string;
  onTitleChange: (title: string) => void;
}

export function SettingsView({ guests, onImport, eventTitle, onTitleChange, eventImage, onImageChange }: SettingsViewProps & { eventImage?: string; onImageChange?: (img: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [reportOpen, setReportOpen] = useState(false);
  const [report, setReport] = useState<{ added: Guest[]; ignored: Guest[] } | null>(null);
  const [backupAt, setBackupAt] = useState<number | null>(null);
  const [backupTitle, setBackupTitle] = useState<string | null>(null);
  const [clientIP, setClientIP] = useState<string | null>(null);
  const [importUrl, setImportUrl] = useState("");
  const [importOk, setImportOk] = useState(false);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [subtitle, setSubtitle] = useState<string>(() => {
    try {
      const raw = localStorage.getItem("isola.event");
      const ev = raw ? JSON.parse(raw) : null;
      const v = ev && typeof ev.subtitle === "string" ? (ev.subtitle as string) : null;
      return v || "";
    } catch {
      return "";
    }
  });
  const [locationText, setLocationText] = useState<string>(() => {
    try {
      const raw = localStorage.getItem("isola.event");
      const ev = raw ? JSON.parse(raw) : null;
      const v = ev && typeof ev.location === "string" ? (ev.location as string) : null;
      return v || "Villa Bom Jardim, Ilha de Paraty";
    } catch {
      return "Villa Bom Jardim, Ilha de Paraty";
    }
  });
  const [dateText, setDateText] = useState<string>(() => {
    try {
      const raw = localStorage.getItem("isola.event");
      const ev = raw ? JSON.parse(raw) : null;
      const v = ev && typeof ev.date === "string" ? (ev.date as string) : null;
      return v || "Sexta e Sábado";
    } catch {
      return "Sexta e Sábado";
    }
  });
  const [editOpen, setEditOpen] = useState(false);
  const [tempTitle, setTempTitle] = useState<string>(eventTitle);
  const [tempSubtitle, setTempSubtitle] = useState<string>(subtitle);
  const [tempLocation, setTempLocation] = useState<string>(locationText);
  const [tempDate, setTempDate] = useState<string>(dateText);
  const CURRENT_VERSION = "1";
  const compactBtn = "w-full whitespace-normal break-words text-center justify-center gap-2";
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
    } catch { /* noop */ }
  };

  useEffect(() => {
    try {
      const t = localStorage.getItem("isola.event.bak.ts");
      setBackupAt(t ? Number(t) : null);
      const bakRaw = localStorage.getItem("isola.event.bak");
      if (bakRaw) {
        const bak = JSON.parse(bakRaw);
        setBackupTitle(typeof bak.title === "string" ? bak.title : null);
      } else {
        setBackupTitle(null);
      }
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("https://api.ipify.org?format=json");
        const j = await r.json();
        setClientIP(typeof j.ip === "string" ? j.ip : null);
        if (typeof j.ip === "string" && j.ip) {
          try { localStorage.setItem("isola.clientIP", j.ip); } catch { /* noop */ }
        }
      } catch { void 0; }
    })();
  }, []);

  useEffect(() => {
    try {
      const qs = new URLSearchParams(window.location.search);
      const p = qs.get("dataUrl") || qs.get("json") || qs.get("url");
      const fromQS = p && /^https?:/i.test(p) ? p : null;
      const fromLSRaw = localStorage.getItem("isola.lastImportUrl");
      const fromLS = fromLSRaw && /^https?:/i.test(fromLSRaw) ? fromLSRaw : null;
      const url = fromQS || fromLS;
      if (url) {
        setImportUrl(url);
        try { localStorage.setItem("isola.lastImportUrl", url); } catch { /* noop */ }
        setTimeout(() => {
          try {
            const ev = new Event("isola:auto-import");
            window.dispatchEvent(ev);
          } catch { /* noop */ }
        }, 0);
      }
    } catch { /* noop */ }
  }, []);

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
          if (t && t !== eventTitle) onTitleChange(t);
          if (typeof s === "string") setSubtitle(s);
          if (typeof l === "string") setLocationText(l);
          if (typeof d === "string") setDateText(d);
          if (img && onImageChange) onImageChange(img);
          writeEvent({ title: t || eventTitle, subtitle: s ?? subtitle, location: l ?? locationText, date: d ?? dateText, image: img || (eventImage || "") });
          try { window.dispatchEvent(new CustomEvent("isola:event-update")); } catch { /* noop */ }
        }
      } catch { /* noop */ }
    })();
  }, []);

  useEffect(() => {
    if (editOpen) {
      setTempTitle(eventTitle);
      setTempSubtitle(subtitle);
      setTempLocation(locationText);
      setTempDate(dateText);
    }
  }, [editOpen, eventTitle, subtitle, locationText, dateText]);

  const saveTexts = () => {
    const t = tempTitle.trim();
    const s = tempSubtitle.trim();
    const l = tempLocation.trim();
    const d = tempDate.trim();
    if (t !== eventTitle) onTitleChange(t);
    writeEvent({ subtitle: s, location: l, date: d });
    setSubtitle(s);
    setLocationText(l);
    setDateText(d);
    try { window.dispatchEvent(new CustomEvent("isola:event-update")); } catch { /* noop */ }
    (async () => {
      try { await setStore("event.meta", { title: t, subtitle: s, location: l, date: d, image: eventImage || "" }); } catch { /* noop */ }
    })();
    setEditOpen(false);
    toast({ title: "Textos atualizados" });
  };

  const formatTS = (ts?: number | null) => (ts ? new Date(ts).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "");


  const exportXLSX = async () => {
    const ExcelJS = (await import("exceljs")).default;
    const header = [
      "Nome do convite *",
      "DDI",
      "DDD +Telefone",
      "Grupo do convite",
      "Local de Hospedagem",
      "Nome dos convidados *",
      "Sexta",
      "Faixa etária",
      "sábado",
    ];
    const PRIMARY_BG = "FFFFF3E0";
    const PRIMARY_BORDER = "FFD4AF37";
    const HIGHLIGHT_BG = "FFFAE3B0";
    const PRIMARY_GRADIENT_START = "FFD99726";
    const PRIMARY_GRADIENT_END = "FFEBC247";
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Convidados");
    ws.columns = [
      { header: header[0], key: "inviteName", width: 28 },
      { header: header[1], key: "ddi", width: 6 },
      { header: header[2], key: "dddPhone", width: 16 },
      { header: header[3], key: "group", width: 12 },
      { header: header[4], key: "accommodation", width: 18 },
      { header: header[5], key: "name", width: 22 },
      { header: header[6], key: "friday", width: 10 },
      { header: header[7], key: "ageGroup", width: 12 },
      { header: header[8], key: "status", width: 12 },
    ];
    ws.addRow(["PLANILHA DE CONVIDADOS (2.0)"]);
    ws.mergeCells(1, 1, 1, header.length);
    ws.getRow(1).height = 22;
    ws.getCell(1, 1).alignment = { horizontal: "center", vertical: "middle" };
    ws.getCell(1, 1).font = { bold: true, size: 14 };
    for (let c = 1; c <= header.length; c++) {
      const cell = ws.getCell(1, c);
      cell.fill = {
        type: "gradient",
        gradient: "angle",
        degree: 0,
        stops: [
          { position: 0, color: { argb: PRIMARY_GRADIENT_START } },
          { position: 1, color: { argb: PRIMARY_GRADIENT_END } },
        ],
      };
      cell.border = {
        top: { style: "thin", color: { argb: PRIMARY_BORDER } },
        left: { style: "thin", color: { argb: PRIMARY_BORDER } },
        bottom: { style: "thin", color: { argb: PRIMARY_BORDER } },
        right: { style: "thin", color: { argb: PRIMARY_BORDER } },
      };
    }
    const headerRow = ws.addRow(header);
    headerRow.height = 20;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF2F7" } };
      cell.border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      };
    });
    guests.forEach((g) => {
      const p = splitBRPhone(g.phone);
      const r = ws.addRow([
        g.inviteName || eventTitle,
        p.ddi,
        p.dddPhone,
        g.group,
        g.accommodation,
        g.name,
        g.friday,
        g.ageGroup,
        g.status,
      ]);
      r.eachCell((cell) => {
        cell.border = {
          top: { style: "hair" },
          left: { style: "hair" },
          bottom: { style: "hair" },
          right: { style: "hair" },
        };
      });
    });
    ws.addRow([""]); ws.addRow([""]);
    const stats = computeStats(guests);
    ws.addRow(["RESUMO DO EVENTO"]);
    ws.mergeCells(ws.lastRow!.number, 1, ws.lastRow!.number, header.length);
    ws.getCell(ws.lastRow!.number, 1).alignment = { horizontal: "center" };
    ws.getCell(ws.lastRow!.number, 1).font = { bold: true, size: 12 };
    ws.getCell(ws.lastRow!.number, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: PRIMARY_BG } };
    ws.getCell(ws.lastRow!.number, 1).border = {
      top: { style: "thin", color: { argb: PRIMARY_BORDER } },
      left: { style: "thin", color: { argb: PRIMARY_BORDER } },
      bottom: { style: "thin", color: { argb: PRIMARY_BORDER } },
      right: { style: "thin", color: { argb: PRIMARY_BORDER } },
    };
    const summaryRows = buildSummaryRows(stats);
    summaryRows.forEach((row) => {
      const r = ws.addRow([String(row["Métrica"]), row["Valor"]]);
      r.getCell(1).font = { bold: row["Métrica"] === "" ? false : true };
      if (String(row["Métrica"]) === "Total") {
        r.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HIGHLIGHT_BG } };
          cell.border = {
            top: { style: "thin", color: { argb: PRIMARY_BORDER } },
            left: { style: "thin", color: { argb: PRIMARY_BORDER } },
            bottom: { style: "thin", color: { argb: PRIMARY_BORDER } },
            right: { style: "thin", color: { argb: PRIMARY_BORDER } },
          };
        });
      }
    });
    ws.addRow([""]);
    ws.addRow(["POR GRUPO"]);
    ws.getCell(ws.lastRow!.number, 1).font = { bold: true };
    ws.getCell(ws.lastRow!.number, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: PRIMARY_BG } };
    Object.entries(stats.byGroup).forEach(([k, v]) => ws.addRow([k, v]));
    ws.addRow([""]);
    ws.addRow(["POR HOSPEDAGEM"]);
    ws.getCell(ws.lastRow!.number, 1).font = { bold: true };
    ws.getCell(ws.lastRow!.number, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: PRIMARY_BG } };
    Object.entries(stats.byAccommodation).forEach(([k, v]) => ws.addRow([k, v]));
    ws.addRow([""]);
    ws.addRow(["POR FAIXA ETÁRIA"]);
    ws.getCell(ws.lastRow!.number, 1).font = { bold: true };
    ws.getCell(ws.lastRow!.number, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: PRIMARY_BG } };
    Object.entries(stats.byAgeGroup).forEach(([k, v]) => ws.addRow([k, v]));
    ws.addRow([""]); ws.addRow([""]);
    ws.addRow(["DUPLICIDADES POTENCIAIS"]);
    ws.mergeCells(ws.lastRow!.number, 1, ws.lastRow!.number, header.length);
    ws.getCell(ws.lastRow!.number, 1).alignment = { horizontal: "center" };
    ws.getCell(ws.lastRow!.number, 1).font = { bold: true, size: 12 };
    ws.getCell(ws.lastRow!.number, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: PRIMARY_BG } };
    ws.getCell(ws.lastRow!.number, 1).border = {
      top: { style: "thin", color: { argb: PRIMARY_BORDER } },
      left: { style: "thin", color: { argb: PRIMARY_BORDER } },
      bottom: { style: "thin", color: { argb: PRIMARY_BORDER } },
      right: { style: "thin", color: { argb: PRIMARY_BORDER } },
    };
    const dupRows = buildDuplicateRows(guests);
    if (dupRows.length > 1) {
      const dupHeader = ws.addRow(["Nome", "Telefones", "Ocorrências"]);
      dupHeader.eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center" };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF2F7" } };
        cell.border = {
          top: { style: "thin", color: { argb: "FFCBD5E1" } },
          left: { style: "thin", color: { argb: "FFCBD5E1" } },
          bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
          right: { style: "thin", color: { argb: "FFCBD5E1" } },
        };
      });
      dupRows.slice(1).forEach((r) => ws.addRow([String(r.Nome), String(r.Telefones), r.Ocorrências]));
    } else {
      ws.addRow(["Sem duplicidades"]);
    }
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventTitle}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exportação concluída", description: `Arquivo ${eventTitle}.xlsx baixado` });
  };

  const exportJSON = async () => {
    try {
      const base = buildEventBase();
      downloadJSON(`${eventTitle || "evento"}.json`, base);
      toast({ title: "Exportação concluída", description: `Arquivo ${eventTitle || "evento"}.json baixado` });
    } catch {
      toast({ title: "Falha ao exportar", variant: "destructive" });
    }
  };

  const exportGuestsJSON = async () => {
    try {
      downloadJSON(`${eventTitle || "convidados"}.json`, guests);
      toast({ title: "Exportação concluída", description: `Arquivo ${eventTitle || "convidados"}.json baixado` });
    } catch {
      toast({ title: "Falha ao exportar", variant: "destructive" });
    }
  };

  const exportArrivalsJSON = async () => {
    try {
      const base = buildEventBase();
      downloadJSON(`${eventTitle || "chegadas"}.json`, base.arrivals);
      toast({ title: "Exportação concluída", description: `Arquivo ${eventTitle || "chegadas"}.json baixado` });
    } catch {
      toast({ title: "Falha ao exportar", variant: "destructive" });
    }
  };

  const exportStockJSON = async () => {
    try {
      const base = buildEventBase();
      downloadJSON(`${eventTitle || "estoque"}.json`, base.stock);
      toast({ title: "Exportação concluída", description: `Arquivo ${eventTitle || "estoque"}.json baixado` });
    } catch {
      toast({ title: "Falha ao exportar", variant: "destructive" });
    }
  };

  const exportFullJSON = async () => {
    try {
      const base = buildEventBase();
      const checksum = await computeChecksum(base);
      const payload = { ...base, checksum };
      downloadJSON(`${eventTitle || "evento"}.full.json`, payload);
      toast({ title: "Backup completo exportado" });
    } catch {
      toast({ title: "Falha ao exportar backup", variant: "destructive" });
    }
  };

  const exportCSV = async () => {
    const header = [
      "Nome do convite *",
      "DDI",
      "DDD +Telefone",
      "Grupo do convite",
      "Local de Hospedagem",
      "Nome dos convidados *",
      "Sexta",
      "Faixa etária",
      "sábado",
    ];
    const lines: string[] = [];
    const esc = (v: string) => `"${String(v || "").replace(/"/g, '""')}"`;
    lines.push(header.map(esc).join(","));
    guests.forEach((g) => {
      const p = splitBRPhone(g.phone);
      lines.push([
        g.inviteName || eventTitle,
        p.ddi,
        p.dddPhone,
        g.group,
        g.accommodation || "",
        g.name,
        g.friday || "",
        g.ageGroup || "",
        g.status,
      ].map(esc).join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventTitle || "convidados"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exportação concluída", description: `Arquivo ${eventTitle || "convidados"}.csv baixado` });
  };

  const clearAll = async () => {
    try {
      let gCount = 0;
      let sCount = 0;
      let aCount = 0;
      try {
        const raw = localStorage.getItem("isola.event");
        const ev = raw ? JSON.parse(raw) : {};
        gCount = Array.isArray(ev.guests) ? ev.guests.length : 0;
        sCount = Array.isArray(ev.stock) ? ev.stock.length : 0;
        aCount = ev.arrivals && typeof ev.arrivals === "object" ? Object.keys(ev.arrivals).length : 0;
        if (raw) {
          localStorage.setItem("isola.event.bak", raw);
          const now = Date.now();
          localStorage.setItem("isola.event.bak.ts", String(now));
          setBackupAt(now);
          try {
            const bak = JSON.parse(raw);
            setBackupTitle(typeof bak.title === "string" ? bak.title : null);
          } catch { /* noop */ }
        }
      } catch { /* noop */ }
      onImport([]);
      onTitleChange("");
      writeEvent({ guests: [], title: "", arrivals: {}, stock: [], image: "" });
      try { localStorage.removeItem("isola.guests"); } catch { void 0; }
      try { localStorage.removeItem("isola.title"); } catch { void 0; }
      try { localStorage.removeItem("isola.eventImage"); } catch { void 0; }
      if (onImageChange) onImageChange("");
      toast({
        title: "Dados limpos",
        description: `Apagados: ${gCount} convidados, ${sCount} itens de estoque, ${aCount} chegadas`,
        action: (
          <ToastAction
            altText="Desfazer"
            onClick={() => {
              try {
                const bakRaw = localStorage.getItem("isola.event.bak");
                if (!bakRaw) return;
                localStorage.setItem("isola.event", bakRaw);
                const bak = JSON.parse(bakRaw);
                onImport(Array.isArray(bak.guests) ? bak.guests : []);
                onTitleChange(typeof bak.title === "string" ? bak.title : "");
                if (onImageChange) onImageChange(typeof bak.image === "string" ? bak.image : "");
                try { window.dispatchEvent(new CustomEvent("isola:event-update")); } catch { /* noop */ }
                toast({ title: "Dados restaurados" });
              } catch { /* noop */ }
            }}
          >
            Desfazer
          </ToastAction>
        ),
      });
    } catch {
      toast({ title: "Falha ao limpar dados", variant: "destructive" });
    }
  };

  const EventSchema = z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    image: z.string().optional(),
    guests: z.array(z.object({
      id: z.string(),
      inviteName: z.string().optional(),
      phone: z.string().optional(),
      group: z.string(),
      accommodation: z.string().optional(),
      name: z.string(),
      friday: z.string().optional(),
      ageGroup: z.string().optional(),
      status: z.string(),
      arrived: z.boolean().optional(),
    })).optional(),
    arrivals: z.record(z.boolean()).optional(),
    stock: z.array(z.object({
      id: z.string(),
      name: z.string(),
      unit: z.string(),
      currentQty: z.number(),
      targetQty: z.number(),
      photos: z.array(z.string()),
      notes: z.string().optional(),
      updatedAt: z.number(),
    })).optional(),
    location: z.string().optional(),
    date: z.string().optional(),
    version: z.string().optional(),
    checksum: z.string().optional(),
  });

  const computeChecksum = async (obj: Record<string, unknown>) => {
    const ordered = {
      title: obj.title || "",
      subtitle: obj.subtitle || "",
      image: obj.image || "",
      guests: Array.isArray(obj.guests) ? obj.guests : [],
      arrivals: obj.arrivals && typeof obj.arrivals === "object" ? obj.arrivals : {},
      stock: Array.isArray(obj.stock) ? obj.stock : [],
      location: obj.location || "",
      date: obj.date || "",
      version: String(obj.version || "1"),
    };
    const data = new TextEncoder().encode(JSON.stringify(ordered));
    const buf = await crypto.subtle.digest("SHA-256", data);
    const bytes = Array.from(new Uint8Array(buf));
    return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const importFromURL = async () => {
    const src = importUrl.trim();
    if (!src) {
      toast({ title: "Informe a URL do JSON", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(src, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const parsed = EventSchema.safeParse(data);
      if (!parsed.success) {
        toast({ title: "JSON inválido", description: "Estrutura inesperada", variant: "destructive" });
        return;
      }
      const ev = parsed.data;
      const base = {
        title: ev.title || "",
        subtitle: ev.subtitle || "",
        image: ev.image || "",
        guests: Array.isArray(ev.guests) ? ev.guests : [],
        arrivals: ev.arrivals || {},
        stock: Array.isArray(ev.stock) ? ev.stock : [],
        location: ev.location || "",
        date: ev.date || "",
        version: ev.version || CURRENT_VERSION,
      };
      if (typeof ev.checksum === "string" && ev.checksum) {
        const sum = await computeChecksum(base);
        if (sum !== ev.checksum) {
          toast({ title: "Checksum inválido", description: "Arquivo pode estar corrompido", variant: "destructive" });
          return;
        }
      }
      const guestsNext = Array.isArray(ev.guests) ? (ev.guests as Guest[]) : [];
      const titleNext = typeof ev.title === "string" ? (ev.title as string) : "";
      const subtitleNext = typeof ev.subtitle === "string" ? (ev.subtitle as string) : "";
      const imageNext = typeof ev.image === "string" ? (ev.image as string) : "";
      const arrivalsNext = ev.arrivals && typeof ev.arrivals === "object" ? (ev.arrivals as Record<string, boolean>) : {};
      const stockNext = Array.isArray(ev.stock) ? (ev.stock as unknown[]) : [];
      const locationNext = typeof ev.location === "string" ? (ev.location as string) : "";
      const dateNext = typeof ev.date === "string" ? (ev.date as string) : "";
      writeEvent({ guests: guestsNext, title: titleNext, subtitle: subtitleNext, image: imageNext, arrivals: arrivalsNext, stock: stockNext, location: locationNext, date: dateNext });
      onImport(guestsNext);
      onTitleChange(titleNext);
      if (onImageChange) onImageChange(imageNext);
      setSubtitle(subtitleNext);
      setLocationText(locationNext);
      setDateText(dateNext);
      try { window.dispatchEvent(new CustomEvent("isola:event-update")); } catch { /* noop */ }
      setImportOk(true);
      try { localStorage.setItem("isola.lastImportUrl", src); } catch { /* noop */ }
      setNeedsUpgrade((ev.version || CURRENT_VERSION) !== CURRENT_VERSION);
      toast({ title: "Dados carregados da URL" });
    } catch {
      toast({ title: "Falha ao carregar da URL", description: "Verifique se o JSON está acessível no GitHub Pages", variant: "destructive" });
    }
  };

  useEffect(() => {
    const handler = () => {
      importFromURL();
    };
    window.addEventListener("isola:auto-import", handler);
    return () => window.removeEventListener("isola:auto-import", handler);
  }, []);

  const upgradeEventStructure = async () => {
    try {
      const ev = readEvent() || {};
      const base = {
        title: typeof ev.title === "string" ? ev.title : "",
        subtitle: typeof ev.subtitle === "string" ? ev.subtitle : "",
        image: typeof ev.image === "string" ? ev.image : "",
        guests: Array.isArray(ev.guests) ? ev.guests : [],
        arrivals: ev.arrivals && typeof ev.arrivals === "object" ? ev.arrivals : {},
        stock: Array.isArray(ev.stock) ? ev.stock : [],
        location: typeof ev.location === "string" ? ev.location : "",
        date: typeof ev.date === "string" ? ev.date : "",
        version: CURRENT_VERSION,
      };
      const checksum = await computeChecksum(base);
      const next = { ...base, checksum };
      writeEvent(next as Record<string, unknown>);
      try { window.dispatchEvent(new CustomEvent("isola:event-update")); } catch { /* noop */ }
      setNeedsUpgrade(false);
      toast({ title: "Estrutura atualizada" });
    } catch {
      toast({ title: "Falha ao atualizar estrutura", variant: "destructive" });
    }
  };

  const splitBRPhone = (raw: string) => {
    const digits = String(raw || "").replace(/\D/g, "");
    const ddi = "55";
    let rest = digits;
    if (digits.startsWith("55")) {
      rest = digits.slice(2);
    }
    const ddd = rest.slice(0, 2);
    const num = rest.slice(2);
    const dddPhone = ddd ? `${ddd} ${formatPhone(num)}` : formatPhone(num);
    return { ddi, dddPhone };
  };

  const formatPhone = (num: string) => {
    if (!num) return "";
    if (num.length >= 9) return `${num.slice(0, 5)}-${num.slice(5)}`;
    if (num.length >= 8) return `${num.slice(0, 4)}-${num.slice(4)}`;
    return num;
  };

  const computeStats = (guests: Guest[]): GuestStats => {
    const confirmed = guests.filter((g) => g.status === "Confirmado").length;
    const notAttending = guests.filter((g) => g.status === "Não comparecerá").length;
    const pending = guests.length - confirmed - notAttending;
    const byGroup: Record<string, number> = {};
    const byAccommodation: Record<string, number> = {};
    const byAgeGroup: Record<string, number> = {};
    let fridayConfirmed = 0;
    guests.forEach((guest) => {
      if (guest.status !== "Confirmado") return;
      byGroup[guest.group] = (byGroup[guest.group] || 0) + 1;
      if (guest.accommodation) {
        byAccommodation[guest.accommodation] = (byAccommodation[guest.accommodation] || 0) + 1;
      }
      const age = guest.ageGroup || "Adulto";
      byAgeGroup[age] = (byAgeGroup[age] || 0) + 1;
      if (guest.friday === "sim" || guest.friday === "Aye") fridayConfirmed++;
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
    };
  };

  const buildSummaryRows = (stats: GuestStats): Array<Record<string, string | number>> => {
    const rows: Array<Record<string, string | number>> = [];
    rows.push({ Métrica: "Total", Valor: stats.total });
    rows.push({ Métrica: "Confirmados", Valor: stats.confirmed });
    rows.push({ Métrica: "Pendentes", Valor: stats.pending });
    rows.push({ Métrica: "Não comparecerão", Valor: stats.notAttending });
    rows.push({ Métrica: "Sexta confirmados", Valor: stats.fridayConfirmed });
    rows.push({ Métrica: "", Valor: "" });
    rows.push({ Métrica: "Por Grupo", Valor: "" });
    Object.entries(stats.byGroup).forEach(([k, v]) => rows.push({ Métrica: k, Valor: v }));
    rows.push({ Métrica: "", Valor: "" });
    rows.push({ Métrica: "Por Hospedagem", Valor: "" });
    Object.entries(stats.byAccommodation).forEach(([k, v]) => rows.push({ Métrica: k, Valor: v }));
    rows.push({ Métrica: "", Valor: "" });
    rows.push({ Métrica: "Por Faixa Etária", Valor: "" });
    Object.entries(stats.byAgeGroup).forEach(([k, v]) => rows.push({ Métrica: k, Valor: v }));
    return rows;
  };

  const buildDuplicateRows = (guests: Guest[]): Array<Record<string, string | number>> => {
    const byName: Record<string, { phones: Set<string>; count: number }> = {};
    guests.forEach((g) => {
      const key = normalizeKey(g.name);
      const clean = String(g.phone || "").replace(/\D/g, "");
      if (!byName[key]) byName[key] = { phones: new Set(), count: 0 };
      if (clean) byName[key].phones.add(clean);
      byName[key].count += 1;
    });
    const rows: Array<Record<string, string | number>> = [{ Nome: "Nome", Telefones: "Telefones", Ocorrências: "Ocorrências" }];
    Object.entries(byName)
      .filter(([_, info]) => info.count > 1 || info.phones.size > 1)
      .forEach(([name, info]) => {
        rows.push({ Nome: name, Telefones: Array.from(info.phones).join(", "), Ocorrências: info.count });
      });
    return rows.length > 1 ? rows : [{ Nome: "Sem duplicidades", Telefones: "", Ocorrências: 0 }];
  };

  const triggerImport = () => {
    if (!logged) {
      toast({ title: "Faça login", description: "Entre para importar dados", variant: "destructive" });
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const ext = (file.name.toLowerCase().split(".").pop() || "");
      const mime = file.type.toLowerCase();
      let imported: Guest[] = [];
      if (ext === "xlsx" || mime.includes("spreadsheet")) {
        const buf = await file.arrayBuffer();
        imported = await parseXLSXGuests(buf);
      } else if (ext === "pdf" || mime === "application/pdf") {
        const buf = await file.arrayBuffer();
        imported = await parsePDFGuests(buf);
      } else if (ext === "csv" || mime === "text/csv") {
        const text = await file.text();
        imported = parseCSVGuests(text);
      } else {
        const text = await file.text();
        imported = parseJSONGuests(text);
      }
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      imported = imported.map((g) => ({ ...g, inviteName: g.inviteName || baseName }));
      const { merged, added, ignored } = mergeUniqueWithReport(guests, imported);
      onImport(merged);
      onTitleChange(baseName);
      writeEvent({ guests: merged, title: baseName });
      setReport({ added, ignored });
      setReportOpen(true);
      toast({ title: "Importação concluída", description: `${added.length} novos convidados adicionados` });
    } catch (err) {
      toast({ title: "Falha na importação", description: "Use um arquivo JSON ou CSV válido", variant: "destructive" });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const parseJSONGuests = (text: string): Guest[] => {
    const data = JSON.parse(text) as Partial<Guest>[];
    if (!Array.isArray(data)) throw new Error("Formato inválido");
    return data.map((g) => ({
      id: g.id ?? (crypto.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2, 10)}`),
      inviteName: String(g.inviteName ?? ""),
      phone: String(g.phone ?? ""),
      group: normalizeGroup(String(g.group ?? "")),
      accommodation: String(g.accommodation ?? ""),
      name: String(g.name ?? ""),
      friday: normalizeFriday(String(g.friday ?? "")),
      ageGroup: normalizeAgeGroup(String(g.ageGroup ?? "")),
      status: normalizeStatus(String(g.status ?? "")),
    }));
  };

  const parseCSVGuests = (text: string): Guest[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];
    const headers = splitCSVLine(lines[0]).map((h) => h.trim());
    const idx = headerIndex(headers);
    const out: Guest[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = splitCSVLine(lines[i]);
      const id = getCol(cols, idx.id);
      const inviteName = getCol(cols, idx.inviteName);
      const ddi = getCol(cols, idx.ddi);
      const dddPhone = getCol(cols, idx.dddPhone);
      const phoneRaw = getCol(cols, idx.phone);
      const phone = phoneRaw || [ddi, dddPhone].filter(Boolean).join(" ");
      const group = normalizeGroup(getCol(cols, idx.group));
      const accommodation = getCol(cols, idx.accommodation);
      const name = getCol(cols, idx.name);
      const friday = normalizeFriday(getCol(cols, idx.friday));
      const ageGroup = normalizeAgeGroup(getCol(cols, idx.ageGroup));
      const status = normalizeStatus(getCol(cols, idx.status));
      out.push({
        id: id || (crypto.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2, 10)}`),
        inviteName,
        phone,
        group,
        accommodation,
        name,
        friday,
        ageGroup,
        status,
      });
    }
    return out;
  };

  const parseXLSXGuests = async (buf: ArrayBuffer): Promise<Guest[]> => {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet, { defval: "" });
    const headers = Object.keys(rows[0] || {}).map((h) => String(h));
    const idx = headerIndex(headers);
    return rows.map((row) => {
      const get = (keyIdx: number, fallbackKey: string) => {
        if (keyIdx >= 0) return String(row[headers[keyIdx]] ?? "");
        return String(row[fallbackKey] ?? "");
      };
      const id = get(idx.id, "id");
      const inviteName = get(idx.inviteName, "inviteName");
      const ddi = get(idx.ddi, "ddi");
      const dddPhone = get(idx.dddPhone, "dddPhone");
      const phoneRaw = get(idx.phone, "phone");
      const phone = phoneRaw || [ddi, dddPhone].filter(Boolean).join(" ");
      const group = normalizeGroup(get(idx.group, "group"));
      const accommodation = get(idx.accommodation, "accommodation");
      const name = get(idx.name, "name");
      const friday = normalizeFriday(get(idx.friday, "friday"));
      const ageGroup = normalizeAgeGroup(get(idx.ageGroup, "ageGroup"));
      const status = normalizeStatus(get(idx.status, "status"));
      return {
        id: id || (crypto.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2, 10)}`),
        inviteName,
        phone,
        group,
        accommodation,
        name,
        friday,
        ageGroup,
        status,
      };
    });
  };

  const parsePDFGuests = async (buf: ArrayBuffer): Promise<Guest[]> => {
    const { GlobalWorkerOptions, getDocument } = await import("pdfjs-dist");
    GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
    const typed = new Uint8Array(buf);
    const doc = await getDocument({ data: typed }).promise;
    const rows: Array<{ x: number; y: number; str: string }> = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const items = (content.items as Array<{ transform: number[]; str: string }>) || [];
      for (const item of items) {
        const tx = item.transform;
        const x = Array.isArray(tx) ? Number(tx[4]) : 0;
        const y = Array.isArray(tx) ? Number(tx[5]) : 0;
        const str = String(item.str || "").trim();
        if (str) rows.push({ x, y, str });
      }
    }
    const groups: Record<string, Array<{ x: number; str: string }>> = {};
    const tol = 2;
    rows.forEach((r) => {
      const key = Math.round(r.y / tol) * tol;
      const k = String(key);
      if (!groups[k]) groups[k] = [];
      groups[k].push({ x: r.x, str: r.str });
    });
    const lines = Object.values(groups)
      .map((arr) => arr.sort((a, b) => a.x - b.x).map((v) => v.str))
      .filter((cols) => cols.length >= 4);
    const out: Guest[] = [];
    for (const cols of lines) {
      const line = cols.join(" ");
      if (/^Nome\s+Convite\s+Grupo\s+Hospedagem\s+Status\s+Chegada/i.test(line)) continue;
      const name = cols[0] || "";
      const inviteName = cols[1] || eventTitle || "";
      const group = normalizeGroup(cols[2] || "");
      const accommodation = cols[3] || "";
      const status = normalizeStatus(cols[4] || "");
      const arrivedTxt = cols[5] || "";
      const arrived = arrivedTxt.toLowerCase().startsWith("sim");
      if (!name) continue;
      out.push({
        id: crypto.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2, 10)}`,
        inviteName,
        phone: "",
        group,
        accommodation,
        name,
        friday: "",
        ageGroup: "",
        status,
        arrived,
      });
    }
    return out;
  };

  const mergeUniqueWithReport = (current: Guest[], incoming: Guest[]) => {
    const keyOf = (g: Guest) => normalizeKey(`${g.name}|${g.phone || ""}`);
    const set = new Set(current.map((g) => keyOf(g)));
    const added: Guest[] = [];
    const ignored: Guest[] = [];
    for (const g of incoming) {
      const key = keyOf(g);
      if (set.has(key)) {
        ignored.push(g);
      } else {
        set.add(key);
        added.push(g);
      }
    }
    return { merged: [...current, ...added], added, ignored };
  };

  const normalizeKey = (s: string) => s.trim().toLowerCase();

  const splitCSVLine = (line: string): string[] => {
    const res: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          const next = line[i + 1];
          if (next === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          cur += ch;
        }
      } else {
        if (ch === ',') {
          res.push(cur);
          cur = "";
        } else if (ch === '"') {
          inQuotes = true;
        } else {
          cur += ch;
        }
      }
    }
    res.push(cur);
    return res.map((v) => v.trim());
  };

  const headerIndex = (headers: string[]) => {
    const map = (name: string) => normalizeHeader(name);
    const norm = headers.map((h) => map(h));
    const findOne = (...keys: string[]) => {
      for (const k of keys) {
        const idx = norm.indexOf(k);
        if (idx >= 0) return idx;
      }
      return -1;
    };
    return {
      id: findOne("id"),
      inviteName: findOne("invitename", "nomedoconvite"),
      phone: findOne("phone", "telefone"),
      ddi: findOne("ddi"),
      dddPhone: findOne("dddtelefone", "dddphone"),
      group: findOne("group", "grupodoconvite", "grupo"),
      accommodation: findOne("accommodation", "localdehospedagem", "hospedagem"),
      name: findOne("name", "nomedosconvidados", "nome"),
      friday: findOne("friday", "sexta"),
      ageGroup: findOne("agegroup", "faixaetaria"),
      status: findOne("status", "sabado"),
    };
  };

  const normalizeHeader = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  const getCol = (cols: string[], i: number) => (i >= 0 && i < cols.length ? cols[i] : "");

  const normalizeGroup = (s: string): GuestGroup => {
    const v = s.toLowerCase();
    if (v === "família" || v === "familia") return "Família";
    return "Amigos";
  };

  const normalizeStatus = (s: string): ConfirmationStatus => {
    const v = s.toLowerCase();
    if (v.startsWith("confirm")) return "Confirmado";
    if (v.startsWith("pend")) return "Pendente";
    return "Não comparecerá";
  };

  const normalizeFriday = (s: string): FridayStatus => {
    const v = s.toLowerCase();
    if (v === "sim" || v === "yes") return "sim";
    if (v === "não" || v === "nao" || v === "no") return "não";
    if (v === "aye") return "Aye";
    return "";
  };

  const normalizeAgeGroup = (s: string): AgeGroup => {
    const v = s.toLowerCase();
    if (v.startsWith("crian")) return "Criança";
    if (v.startsWith("adole")) return "Adolescente";
    if (v.startsWith("adult")) return "Adulto";
    if (v.startsWith("idos")) return "Idoso";
    return "";
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="space-y-1">
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Configurações</h1>
            <p className="text-sm text-muted-foreground">Gerencie seu evento</p>
          </div>
        </div>
      </header>

      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl overflow-hidden border">
            {eventImage ? (
              <img src={eventImage} alt={eventTitle} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary to-accent opacity-80 flex items-center justify-center">
                <PartyPopper className="h-8 w-8 text-primary-foreground" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-display font-bold">{eventTitle}</h2>
              {importOk ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        aria-label={needsUpgrade ? "Versão antiga" : "OK"}
                        className={`inline-block h-2.5 w-2.5 rounded-full ${needsUpgrade ? "bg-amber-500" : "bg-emerald-500"}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      {needsUpgrade ? "Versão antiga — clique em Atualizar estrutura" : "OK — dados atualizados"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label="Opções de imagem">
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => imageInputRef.current?.click()}>Trocar imagem</DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem>
                        <Trash2 className="h-4 w-4 mr-2" /> Remover imagem
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover imagem do evento?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Isso vai limpar a imagem atual do cabeçalho. Você pode trocar novamente depois.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={clearEventImage}>Remover</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label="Editar textos" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            {subtitle ? (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Sobre o Evento
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Local</p>
              <p className="font-medium inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {locationText}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Data</p>
              <p className="font-medium inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" /> {dateText}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
          Ações
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Button variant="outline" className={compactBtn} onClick={exportXLSX}>
            <Download className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Excel</span>
          </Button>
          <Button variant="outline" className={compactBtn} onClick={exportCSV}>
            <Download className="h-4 w-4" />
            <span className="text-xs sm:text-sm">CSV</span>
          </Button>
          <Button variant="outline" className={compactBtn} onClick={exportGuestsJSON}>
            <Download className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Convidados (JSON)</span>
          </Button>
          <Button variant="outline" className={compactBtn} onClick={exportJSON}>
            <Download className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Evento (JSON)</span>
          </Button>
          <Button variant="outline" className={compactBtn} onClick={triggerImport}>
            <Upload className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Importar</span>
          </Button>
          <input ref={fileInputRef} type="file" accept="application/json,.json,text/csv,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx,application/pdf,.pdf" className="hidden" onChange={handleFileChange} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-start">
          <Button variant="outline" className={compactBtn} onClick={exportFullJSON}>
            <Download className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Evento (checksum)</span>
          </Button>
          <Button variant="outline" className={compactBtn} onClick={exportArrivalsJSON}>
            <Download className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Chegadas (JSON)</span>
          </Button>
          <Button variant="outline" className={compactBtn} onClick={exportStockJSON}>
            <Download className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Estoque (JSON)</span>
          </Button>
          <Input className="bg-muted/60" placeholder="URL do JSON" value={importUrl} onChange={(e) => setImportUrl(e.target.value)} />
          <Button variant="outline" className={compactBtn} onClick={importFromURL}>
            <span className="text-xs sm:text-sm">Carregar URL</span>
          </Button>
          <Button variant="outline" className={compactBtn} disabled={!importOk || !importUrl.trim()} onClick={async () => {
            try { await navigator.clipboard.writeText(importUrl.trim()); toast({ title: "URL copiada" }); } catch { toast({ title: "Falha ao copiar URL", variant: "destructive" }); }
          }}>
            <span className="text-xs sm:text-sm">Copiar URL</span>
          </Button>
          <Button variant="outline" className={compactBtn} disabled={!needsUpgrade} onClick={upgradeEventStructure}>
            <span className="text-xs sm:text-sm">Atualizar</span>
          </Button>
          {importOk ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    aria-label={needsUpgrade ? "Versão antiga" : "OK"}
                    className={`inline-block h-2.5 w-2.5 rounded-full ${needsUpgrade ? "bg-amber-500" : "bg-emerald-500"}`}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  {needsUpgrade ? "Versão antiga — atualize" : "OK — dados atualizados"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className={compactBtn}>
                <span className="text-xs sm:text-sm">Limpar dados</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar todos os dados?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso vai apagar convidados, título, imagem, chegadas e estoque. Essa ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={clearAll}>Limpar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            variant="outline"
            className={compactBtn}
            onClick={() => {
              try {
                const bakRaw = localStorage.getItem("isola.event.bak");
                if (!bakRaw) {
                  toast({ title: "Sem backup", description: "Nenhum backup encontrado", variant: "destructive" });
                  return;
                }
                localStorage.setItem("isola.event", bakRaw);
                const bak = JSON.parse(bakRaw);
                onImport(Array.isArray(bak.guests) ? bak.guests : []);
                onTitleChange(typeof bak.title === "string" ? bak.title : "");
                if (onImageChange) onImageChange(typeof bak.image === "string" ? bak.image : "");
                try { window.dispatchEvent(new CustomEvent("isola:event-update")); } catch { /* noop */ }
                toast({ title: "Backup restaurado" });
              } catch {
                toast({ title: "Falha ao restaurar", variant: "destructive" });
              }
            }}
           >
             <span className="text-xs sm:text-sm">Restaurar backup</span> {backupTitle ? <span className="text-xs text-muted-foreground">({backupTitle}{backupAt ? ` · ${formatTS(backupAt)}` : ""})</span> : backupAt ? <span className="text-xs text-muted-foreground">({formatTS(backupAt)})</span> : null}
           </Button>
          <Button
            variant="outline"
            className={compactBtn}
            onClick={() => {
              try {
                const exists = localStorage.getItem("isola.event.bak");
                if (!exists) {
                  toast({ title: "Sem backup", description: "Nenhum backup encontrado", variant: "destructive" });
                  return;
                }
                localStorage.removeItem("isola.event.bak");
                localStorage.removeItem("isola.event.bak.ts");
                setBackupAt(null);
                setBackupTitle(null);
                toast({ title: "Backup apagado" });
              } catch {
                toast({ title: "Falha ao apagar backup", variant: "destructive" });
              }
            }}
           >
             <span className="text-xs sm:text-sm">Apagar backup</span>
           </Button>
        </div>
      </div>


      <div className="flex gap-2">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const reader = new FileReader();
              reader.onload = async () => {
                const dataUrl = String(reader.result || "");
                writeEvent({ image: dataUrl });
                if (onImageChange) onImageChange(dataUrl);
                try {
                  const ev = readEvent() || {};
                  const t = typeof ev.title === "string" ? ev.title : eventTitle;
                  const s = typeof ev.subtitle === "string" ? ev.subtitle : subtitle;
                  const l = typeof ev.location === "string" ? ev.location : locationText;
                  const d = typeof ev.date === "string" ? ev.date : dateText;
                  await setStore("event.meta", { title: t || "", subtitle: s || "", location: l || "", date: d || "", image: dataUrl });
                } catch { /* noop */ }
                toast({ title: "Imagem atualizada" });
                if (imageInputRef.current) imageInputRef.current.value = "";
              };
              reader.readAsDataURL(file);
            } catch {
              toast({ title: "Falha ao atualizar imagem", variant: "destructive" });
            }
          }}
        />
        
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar textos do evento</DialogTitle>
            <DialogDescription>Atualize título, descrição, local e data</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Título do evento" value={tempTitle} onChange={(e) => setTempTitle(e.target.value)} />
            <Input placeholder="Descrição do evento" value={tempSubtitle} onChange={(e) => setTempSubtitle(e.target.value)} />
            <Input placeholder="Local" value={tempLocation} onChange={(e) => setTempLocation(e.target.value)} />
            <Input placeholder="Data" value={tempDate} onChange={(e) => setTempDate(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button onClick={saveTexts}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-muted/50 rounded-xl p-4 flex gap-3">
        <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Dica</p>
          <p>
            Use o filtro na aba de convidados para encontrar rapidamente pessoas
            por hospedagem, grupo ou status de confirmação.
          </p>
        </div>
      </div>



      {/* Relatório pós-importação */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resultado da importação</DialogTitle>
            <DialogDescription>
              {report ? `${report.added.length} adicionados, ${report.ignored.length} ignorados (duplicados).` : ""}
            </DialogDescription>
          </DialogHeader>
          {report && (
            <div className="grid grid-cols-2 gap-4 text-sm max-h-64 overflow-auto">
              <div>
                <p className="font-medium">Adicionados</p>
                <ul className="mt-2 space-y-1">
                  {report.added.map((g) => (
                    <li key={`added-${g.id}`}>{g.name} — {g.phone}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium">Ignorados</p>
                <ul className="mt-2 space-y-1">
                  {report.ignored.map((g, i) => (
                    <li key={`ignored-${i}`}>{g.name} — {g.phone}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
  const clearEventImage = async () => {
    try { /* noop */ } catch { /* noop */ }
    writeEvent({ image: "" });
    if (onImageChange) onImageChange("");
    toast({ title: "Imagem removida" });
  };
  const buildEventBase = () => {
    const ev = readEvent() || {};
    return {
      title: typeof ev.title === "string" ? ev.title : "",
      subtitle: typeof ev.subtitle === "string" ? ev.subtitle : "",
      image: typeof ev.image === "string" ? ev.image : "",
      guests: Array.isArray(ev.guests) ? ev.guests : [],
      arrivals: ev.arrivals && typeof ev.arrivals === "object" ? ev.arrivals : {},
      stock: Array.isArray(ev.stock) ? ev.stock : [],
      location: typeof ev.location === "string" ? ev.location : "",
      date: typeof ev.date === "string" ? ev.date : "",
      version: CURRENT_VERSION,
    };
  };

  const downloadJSON = (filename: string, payload: unknown) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
