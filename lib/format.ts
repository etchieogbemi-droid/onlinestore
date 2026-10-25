export function money(value: number | string) {
  return Number(value).toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2
  });
}

export function safeImage(images?: string[] | null) {
  return images?.[0] || "";
}
