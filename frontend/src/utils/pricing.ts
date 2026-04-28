export const DEFAULT_PRICES: Record<string, string> = {
  Standard: "165",
  Growth: "240",
  Enterprise: "410",
  Platinum: "750",
};

export async function fetchPrices(): Promise<Record<string, string>> {
  try {
    const res = await fetch("/api/prices", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch prices");
    return await res.json();
  } catch (err) {
    console.error("Pricing fetch error:", err);
    return DEFAULT_PRICES;
  }
}
