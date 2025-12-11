function containsPhone(x: unknown): boolean {
  try {
    if (!x) return false;
    if (Array.isArray(x)) return x.some((i) => containsPhone(i));
    if (typeof x === "object" && x !== null) {
      const obj = x as Record<string, unknown>;
      if (Object.prototype.hasOwnProperty.call(obj, "phone") && obj.phone) return true;
      for (const k of Object.keys(obj)) {
        if (containsPhone(obj[k])) return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

function shouldBlock(args: unknown[]): boolean {
  try {
    return args.some((a) => containsPhone(a));
  } catch {
    return false;
  }
}

if (import.meta.env.PROD) {
  const originalLog = console.log;
  const originalTable = console.table;
  const originalDir = console.dir;
  console.log = ((...args: Parameters<typeof console.log>) => {
    if (shouldBlock(args)) return;
    originalLog(...args);
  }) as typeof console.log;
  console.table = ((...args: Parameters<typeof console.table>) => {
    if (shouldBlock(args)) return;
    originalTable(...args);
  }) as typeof console.table;
  console.dir = ((...args: Parameters<typeof console.dir>) => {
    if (shouldBlock(args)) return;
    originalDir(...args);
  }) as typeof console.dir;
}
