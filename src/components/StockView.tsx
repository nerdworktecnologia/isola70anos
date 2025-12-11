import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Wine, Camera, Trash2 } from "lucide-react";
import { StockItem, StockList } from "@/types/stock";
import { getStore, setStore } from "@/lib/api";

export function StockView() {
  const { toast } = useToast();
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
    } catch { /* noop */ }
  };
  const [items, setItems] = useState<StockList>(() => {
    try {
      const ev = readEvent();
      if (ev && Array.isArray(ev.stock)) return ev.stock as StockList;
      const raw = localStorage.getItem("isola.stock");
      return raw ? (JSON.parse(raw) as StockList) : [];
    } catch {
      return [];
    }
  });
  const [name, setName] = useState("");
  const [currentQty, setCurrentQty] = useState<number>(0);
  const [targetQty, setTargetQty] = useState<number>(0);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [uploadForId, setUploadForId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [stockRefreshedAt, setStockRefreshedAt] = useState<number | null>(null);
  const [refreshDisabled, setRefreshDisabled] = useState(false);
  const autoRefreshLockRef = useRef<number>(0);
  const refreshNow = async () => {
    try {
      if (refreshDisabled) return;
      setRefreshDisabled(true);
      const remote = await getStore<StockList>("stock");
      if (Array.isArray(remote)) {
        setItems(remote as StockList);
        setStockRefreshedAt(Date.now());
      }
    } catch { /* noop */ }
    finally {
      setTimeout(() => setRefreshDisabled(false), 3000);
    }
  };


  useEffect(() => {
    try {
      const raw = localStorage.getItem("isola.event");
      const cur = raw ? JSON.parse(raw) : {};
      const next = { ...cur, stock: items };
      localStorage.setItem("isola.event", JSON.stringify(next));
      try { localStorage.setItem("isola.stock", JSON.stringify(items)); } catch { /* noop */ }
      try { window.dispatchEvent(new CustomEvent("isola:event-update")); } catch { /* noop */ }
    } catch { /* noop */ }
    (async () => {
      try { await setStore<StockList>("stock", items); } catch { /* noop */ }
    })();
  }, [items]);

  useEffect(() => {
    (async () => {
      try {
        const remote = await getStore<StockList>("stock");
        if (Array.isArray(remote) && remote.length) {
          setItems(remote as StockList);
          setStockRefreshedAt(Date.now());
        }
      } catch { /* noop */ }
    })();
  }, []);

  useEffect(() => {
    const onUpdate = () => {
      try {
        const raw = localStorage.getItem("isola.event");
        const ev = raw ? JSON.parse(raw) : null;
        if (ev && Array.isArray(ev.stock)) {
          setItems(ev.stock as StockList);
        }
      } catch { /* noop */ }
    };
    window.addEventListener("isola:event-update", onUpdate);
    return () => window.removeEventListener("isola:event-update", onUpdate);
  }, []);

  useEffect(() => {
    const refresh = async () => {
      try {
        const remote = await getStore<StockList>("stock");
        if (Array.isArray(remote)) {
          setItems(remote as StockList);
          setStockRefreshedAt(Date.now());
        }
      } catch { /* noop */ }
    };
    const onFocus = () => {
      const now = Date.now();
      if (now - autoRefreshLockRef.current < 3000) return;
      autoRefreshLockRef.current = now;
      refresh();
    };
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - autoRefreshLockRef.current < 3000) return;
      autoRefreshLockRef.current = now;
      refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const addItem = () => {
    if (!name.trim()) {
      toast({ title: "Informe o nome da bebida", variant: "destructive" });
      return;
    }
    const item: StockItem = {
      id: (crypto.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2, 10)}`),
      name: name.trim(),
      unit: "",
      currentQty: Number.isFinite(currentQty) ? currentQty : 0,
      targetQty: Number.isFinite(targetQty) ? targetQty : 0,
      photos: [],
      notes: "",
      updatedAt: Date.now(),
    };
    setItems((prev) => {
      const next = [item, ...prev];
      try {
        const raw = localStorage.getItem("isola.event");
        const cur = raw ? JSON.parse(raw) : {};
        const evNext = { ...cur, stock: next };
        localStorage.setItem("isola.event", JSON.stringify(evNext));
        try { localStorage.setItem("isola.stock", JSON.stringify(next)); } catch { /* noop */ }
        try { window.dispatchEvent(new CustomEvent("isola:event-update")); } catch { /* noop */ }
        try { void setStore<StockList>("stock", next); } catch { /* noop */ }
      } catch { /* noop */ }
      return next;
    });
    setName("");
    setCurrentQty(0);
    setTargetQty(0);
    setQuery("");
    toast({ title: "Item adicionado" });
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      try {
        const raw = localStorage.getItem("isola.event");
        const cur = raw ? JSON.parse(raw) : {};
        const evNext = { ...cur, stock: next };
        localStorage.setItem("isola.event", JSON.stringify(evNext));
        try { localStorage.setItem("isola.stock", JSON.stringify(next)); } catch { /* noop */ }
        try { window.dispatchEvent(new CustomEvent("isola:event-update")); } catch { /* noop */ }
        try { void setStore<StockList>("stock", next); } catch { /* noop */ }
      } catch { /* noop */ }
      return next;
    });
  };

  const updateItem = (id: string, patch: Partial<StockItem>) => {
    setItems((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, ...patch, updatedAt: Date.now() } : i));
      try {
        const raw = localStorage.getItem("isola.event");
        const cur = raw ? JSON.parse(raw) : {};
        const evNext = { ...cur, stock: next };
        localStorage.setItem("isola.event", JSON.stringify(evNext));
        try { localStorage.setItem("isola.stock", JSON.stringify(next)); } catch { /* noop */ }
        try { window.dispatchEvent(new CustomEvent("isola:event-update")); } catch { /* noop */ }
        try { void setStore<StockList>("stock", next); } catch { /* noop */ }
      } catch { /* noop */ }
      return next;
    });
  };

  const startUploadPhotos = (id: string) => {
    setUploadForId(id);
    photoInputRef.current?.click();
  };

  const onPhotosSelected: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !uploadForId) return;
    try {
      const readers = await Promise.all(
        files.map(
          (f) =>
            new Promise<string>((resolve, reject) => {
              const r = new FileReader();
              r.onload = () => resolve(String(r.result || ""));
              r.onerror = () => reject(new Error("fail"));
              r.readAsDataURL(f);
            })
        )
      );
      updateItem(uploadForId, {
        photos: [
          ...((items.find((i) => i.id === uploadForId)?.photos) || []),
          ...readers,
        ],
      });
      toast({ title: "Fotos anexadas" });
    } catch {
      toast({ title: "Falha ao anexar fotos", variant: "destructive" });
    } finally {
      setUploadForId(null);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const removePhoto = (id: string, index: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const next = [...item.photos];
    next.splice(index, 1);
    updateItem(id, { photos: next });
    toast({ title: "Foto removida" });
  };

  const computeStatus = (item: StockItem) => {
    const need = Math.max(0, item.targetQty - item.currentQty);
    const left = Math.max(0, item.currentQty - item.targetQty);
    if (need > 0) return { label: `Comprar ${need}`, variant: "destructive" as const };
    if (left > 0) return { label: `Sobrou ${left}`, variant: "secondary" as const };
    return { label: "OK", variant: "default" as const };
  };

  const summary = {
    total: items.length,
    need: items.reduce((sum, i) => sum + Math.max(0, i.targetQty - i.currentQty), 0),
    left: items.reduce((sum, i) => sum + Math.max(0, i.currentQty - i.targetQty), 0),
    purchased: items.reduce((sum, i) => sum + (Number.isFinite(i.currentQty) ? i.currentQty : 0), 0),
  };

  const visibleItems = items.filter((i) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return i.name.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 pb-20">
      <header className="space-y-1">
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
            <Wine className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Estoque</h1>
            <p className="text-sm text-muted-foreground">Gerencie seu estoque</p>
          </div>
        </div>
      </header>

      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-background/60 flex items-center justify-center">
            <Wine className="h-5 w-5" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
            <Input className="bg-muted/60" placeholder="Bebida (ex: Vinho Tinto)" value={name} onChange={(e) => setName(e.target.value)} />
            <Input className="bg-muted/60" placeholder="Qtd atual" type="number" value={currentQty} onChange={(e) => setCurrentQty(Number(e.target.value))} />
            <Input className="bg-muted/60" placeholder="Qtd alvo" type="number" value={targetQty} onChange={(e) => setTargetQty(Number(e.target.value))} />
          </div>
          <Button onClick={addItem}>Adicionar</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">Itens</p>
            <p className="text-lg font-semibold">{summary.total}</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">Sobrou</p>
            <p className="text-lg font-semibold text-destructive">{summary.left}</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">Compradas</p>
            <p className="text-lg font-semibold text-primary">{summary.purchased}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Input className="bg-muted/60" placeholder="Filtrar por bebida" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Button variant="outline" onClick={refreshNow} disabled={refreshDisabled}>Atualizar agora</Button>
        </div>

        <div className="text-sm text-muted-foreground">
          {visibleItems.length} item{visibleItems.length !== 1 && "s"}
          {typeof stockRefreshedAt === "number" && stockRefreshedAt > 0 && (
            <span>
              {" "}· Atualizado {(() => {
                const diff = Math.floor((Date.now() - stockRefreshedAt) / 1000);
                if (diff < 60) return `há ${diff}s`;
                const m = Math.floor(diff / 60);
                if (m < 60) return `há ${m}min`;
                const h = Math.floor(m / 60);
                return `há ${h}h`;
              })()}
            </span>
          )}
        </div>

        <Separator />

        <div className="space-y-3">
          {visibleItems.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum item no estoque. Adicione acima.</p>
          )}
          {visibleItems.map((item) => {
            const status = computeStatus(item);
            return (
              <div key={item.id} className="border rounded-lg p-4 bg-background/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.currentQty} atual · alvo {item.targetQty}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => startUploadPhotos(item.id)}>
                      <Camera className="h-4 w-4 mr-1" /> Anexar imagens
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                  {item.photos.map((src, idx) => (
                    <div key={`${item.id}-photo-${idx}`} className="relative group">
                      <img src={src} alt={item.name} className="w-full h-24 object-cover rounded-md border" />
                      <button
                        aria-label="Remover foto"
                        className="absolute top-1 right-1 hidden group-hover:block bg-destructive text-destructive-foreground rounded-md p-1 shadow"
                        onClick={() => removePhoto(item.id, idx)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <Textarea className="bg-muted/60" placeholder="Observações" value={item.notes || ""} onChange={(e) => updateItem(item.id, { notes: e.target.value })} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <input ref={photoInputRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={onPhotosSelected} />
    </div>
  );
}

export default StockView;
