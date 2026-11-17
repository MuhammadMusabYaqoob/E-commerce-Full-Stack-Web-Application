import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { postgresPool } from "../db/postgres.js";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function shapeOrder(row) {
  const items = Array.isArray(row.items) ? row.items : [];
  return {
    _id: row.id,
    id: row.id,
    user: row.user_id ? { _id: row.user_id, id: row.user_id, name: row.user_name, email: row.user_email, phone: row.user_phone } : undefined,
    items: items.map((item) => ({
      product: item.product_id,
      name: item.product_name,
      slug: item.product_slug || "",
      imageUrl: item.image_url || "",
      unitPrice: Number(item.unit_price),
      quantity: Number(item.quantity),
      lineTotal: Number(item.line_total),
    })),
    shippingAddress: {
      name: row.recipient_name,
      email: row.recipient_email,
      phone: row.recipient_phone,
      address: row.delivery_address,
    },
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    orderStatus: row.order_status,
    paymentStatus: row.payment_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const orderSelect = `
  SELECT o.id, o.user_id, o.recipient_name, o.recipient_email, o.recipient_phone,
         o.delivery_address, o.subtotal, o.total, o.order_status, o.payment_status,
         o.created_at, o.updated_at,
         u.name AS user_name, u.email AS user_email, u.phone AS user_phone,
         COALESCE(
           json_agg(json_build_object(
             'product_id', oi.product_id,
             'product_name', oi.product_name,
             'product_slug', p.slug,
             'image_url', oi.image_url,
             'unit_price', oi.unit_price,
             'quantity', oi.quantity,
             'line_total', oi.line_total
           ) ORDER BY oi.created_at) FILTER (WHERE oi.id IS NOT NULL),
           '[]'::json
         ) AS items
  FROM orders o
  LEFT JOIN users u ON u.id = o.user_id
  LEFT JOIN order_items oi ON oi.order_id = o.id
  LEFT JOIN products p ON p.id = oi.product_id
`;

async function findOrderById(id, client = postgresPool) {
  const result = await client.query(`${orderSelect} WHERE o.id = $1 GROUP BY o.id, u.id`, [id]);
  return result.rows[0] ? shapeOrder(result.rows[0]) : null;
}

const placeOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress } = req.body;
  if (!Array.isArray(items) || items.length === 0) throw new ApiError(400, "Your cart is empty");
  if (items.length > 50) throw new ApiError(400, "An order cannot contain more than 50 different products");

  const cleanItems = items.map((item) => ({ productId: String(item?.productId || ""), quantity: Number(item?.quantity) }));
  if (cleanItems.some((item) => !uuidPattern.test(item.productId) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99)) {
    throw new ApiError(400, "Each cart item must have a valid product and quantity from 1 to 99");
  }
  if (new Set(cleanItems.map((item) => item.productId)).size !== cleanItems.length) throw new ApiError(400, "The cart contains a duplicate product");

  const { name, email, phone, address } = shippingAddress || {};
  if ([name, email, phone, address].some((value) => typeof value !== "string" || !value.trim())) {
    throw new ApiError(400, "Name, email, phone, and delivery address are required");
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new ApiError(400, "Enter a valid email address");

  const client = await postgresPool.connect();
  try {
    await client.query("BEGIN");
    const ids = cleanItems.map((item) => item.productId);
    const productsResult = await client.query(
      `SELECT p.id, p.name, p.slug, p.price,
              COALESCE((SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.image_order LIMIT 1), '') AS image_url
       FROM products p WHERE p.id = ANY($1::uuid[]) FOR SHARE`,
      [ids]
    );
    if (productsResult.rows.length !== cleanItems.length) throw new ApiError(404, "One or more products are no longer available");
    const byId = new Map(productsResult.rows.map((product) => [product.id, product]));

    const preparedItems = cleanItems.map(({ productId, quantity }) => {
      const product = byId.get(productId);
      const unitPriceCents = Math.round(Number(product.price) * 100);
      const lineTotalCents = unitPriceCents * quantity;
      return { productId, name: product.name, imageUrl: product.image_url, unitPrice: unitPriceCents / 100, quantity, lineTotal: lineTotalCents / 100, lineTotalCents };
    });
    const subtotalCents = preparedItems.reduce((sum, item) => sum + item.lineTotalCents, 0);
    const subtotal = subtotalCents / 100;

    const inserted = await client.query(
      `INSERT INTO orders (user_id, recipient_name, recipient_email, recipient_phone, delivery_address, subtotal, total, order_status, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $6, 'pending', 'unpaid') RETURNING id`,
      [req.user.id, name.trim(), normalizedEmail, phone.trim(), address.trim(), subtotal]
    );
    const orderId = inserted.rows[0].id;
    for (const item of preparedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, image_url, unit_price, quantity, line_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [orderId, item.productId, item.name, item.imageUrl, item.unitPrice, item.quantity, item.lineTotal]
      );
    }
    await client.query("COMMIT");
    const order = await findOrderById(orderId);
    return res.status(201).json(new ApiResponse(201, { order }, "Order placed. Payment is not collected yet."));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    if (error.code === "22P02") throw new ApiError(400, "Invalid product ID in cart");
    throw error;
  } finally {
    client.release();
  }
});

const getMyOrders = asyncHandler(async (req, res) => {
  const result = await postgresPool.query(`${orderSelect} WHERE o.user_id = $1 GROUP BY o.id, u.id ORDER BY o.created_at DESC`, [req.user.id]);
  return res.status(200).json(new ApiResponse(200, { orders: result.rows.map(shapeOrder) }, "Orders retrieved successfully"));
});

const getAllOrdersForAdmin = asyncHandler(async (req, res) => {
  const requestedPage = Number.parseInt(String(req.query.page ?? "1"), 10);
  if (!Number.isSafeInteger(requestedPage) || requestedPage < 1) throw new ApiError(400, "Page must be a positive whole number");
  const perPage = 10;
  const countResult = await postgresPool.query("SELECT COUNT(*)::int AS total FROM orders");
  const totalOrders = countResult.rows[0].total;
  const totalPages = Math.max(1, Math.ceil(totalOrders / perPage));
  const currentPage = Math.min(requestedPage, totalPages);
  const result = await postgresPool.query(
    `${orderSelect} GROUP BY o.id, u.id ORDER BY o.created_at DESC LIMIT $1 OFFSET $2`,
    [perPage, (currentPage - 1) * perPage]
  );
  return res.status(200).json(new ApiResponse(200, {
    orders: result.rows.map(shapeOrder),
    pagination: { currentPage, perPage, totalOrders, totalPages },
  }, "All orders retrieved successfully"));
});

export { placeOrder, getMyOrders, getAllOrdersForAdmin };
