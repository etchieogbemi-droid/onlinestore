import { serverSupabase, jsonError } from "@/lib/server";

type RequestedItem = { product_id: string; quantity: number };

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return jsonError("Invalid order request.");
  const name = String(body.name || "").trim().slice(0, 120);
  const phone = String(body.phone || "").trim().slice(0, 40);
  const location = String(body.location || "").trim().slice(0, 200);
  const address = String(body.address || "").trim().slice(0, 300);
  const notes = String(body.notes || "").trim().slice(0, 1000);
  const items = body.items as RequestedItem[];
  if (!name || !phone || !location) return jsonError("Name, phone number and location are required.");
  if (!Array.isArray(items) || items.length < 1 || items.length > 50) return jsonError("Your order must contain between 1 and 50 product lines.");

  const cleanItems: RequestedItem[] = [];
  const quantities = new Map<string, number>();
  for (const item of items) {
    if (!item || typeof item.product_id !== "string" || !/^[0-9a-f-]{36}$/i.test(item.product_id)) return jsonError("An item in your cart is invalid.");
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return jsonError("Each quantity must be between 1 and 99.");
    quantities.set(item.product_id, (quantities.get(item.product_id) || 0) + quantity);
  }
  
  // FIXED: Use Array.from so Vercel build doesn't fail
  for (const [product_id, quantity] of Array.from(quantities.entries())) {
    if (quantity > 99) return jsonError("Maximum quantity per product is 99.");
    cleanItems.push({ product_id, quantity });
  }

  const db = serverSupabase();
  const ids = cleanItems.map((item) => item.product_id);
  const { data: products, error: productsError } = await db.from("products")
    .select("id,name,code,price,available,published")
    .in("id", ids);
  if (productsError) return jsonError("Could not verify product prices. Please try again.", 500);

  const productMap = new Map((products || []).map((product) => [product.id, product] as const));
  const orderItems = [];
  let total = 0;
  for (const item of cleanItems) {
    const product = productMap.get(item.product_id) as any;
    if (!product || !product.published || !product.available) return jsonError("One or more products are no longer available. Please update your cart.");
    const unitPrice = Number(product.price);
    const subtotal = Math.round(unitPrice * item.quantity * 100) / 100;
    total = Math.round((total + subtotal) * 100) / 100;
    orderItems.push({
      product_id: product.id,
      name: product.name,
      code: product.code,
      quantity: item.quantity,
      unit_price: unitPrice,
      subtotal
    });
  }

  const { data: order, error } = await db.from("orders").insert({
    customer_name: name,
    customer_phone: phone,
    customer_location: location,
    delivery_address: address,
    notes,
    items: orderItems,
    total_amount: total
  }).select("id,order_number,total_amount,items,status,created_at").single();

  if (error) return jsonError("Could not save the order. Please try again.", 500);
  return Response.json({ order });
}