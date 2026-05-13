import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function seed() {
  console.log("Seeding database...");

  const hash = await bcrypt.hash("password123", 10);

  // Users
  const usersResult = await pool.query<{ id: number; email: string }>(
    `INSERT INTO users (name, email, password, role) VALUES
      ('Ahmad Al-Mansouri', 'admin@example.com', $1, 'admin'),
      ('Sara Al-Khalidi', 'buyer@example.com', $1, 'buyer')
    ON CONFLICT (email) DO NOTHING
    RETURNING id, email`,
    [hash]
  );

  let adminId: number | null = null;

  // Get admin user id
  const adminRow = await pool.query<{ id: number }>("SELECT id FROM users WHERE email = 'admin@example.com'");
  if (adminRow.rows.length > 0) {
    adminId = adminRow.rows[0].id;
  }

  if (!adminId) {
    console.log("Admin user not found, skipping store/product seeding");
    await pool.end();
    return;
  }

  // Check if store already exists
  const existingStore = await pool.query<{ id: number }>("SELECT id FROM stores WHERE user_id = $1", [adminId]);
  let storeId: number;

  if (existingStore.rows.length > 0) {
    storeId = existingStore.rows[0].id;
    console.log("Store already exists:", storeId);
  } else {
    const storeResult = await pool.query<{ id: number }>(
      `INSERT INTO stores (user_id, store_name, description, location, rural_area, contact_info, logo)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        adminId,
        "Al-Baraka Natural Products",
        "Authentic organic produce and traditional crafts from the Badia region of Jordan. We work with local families to bring the finest natural products to your doorstep.",
        "Azraq",
        "Badia",
        "+962 7 8765 4321",
        "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop",
      ]
    );
    storeId = storeResult.rows[0].id;
    console.log("Created store:", storeId);

    // Update admin user storeId
    await pool.query("UPDATE users SET store_id = $1 WHERE id = $2", [storeId, adminId]);
  }

  // Products
  const existingProducts = await pool.query<{ count: string }>("SELECT COUNT(*) FROM products WHERE store_id = $1", [storeId]);
  if (parseInt(existingProducts.rows[0].count) > 0) {
    console.log("Products already exist, skipping.");
    await pool.end();
    return;
  }

  await pool.query(
    `INSERT INTO products (store_id, name, description, price, stock, category, images) VALUES
    ($1, 'Organic Medjool Dates (1kg)', 'Premium quality Medjool dates grown in the Jordan Valley. Sweet, soft and nutrient-rich. Harvested fresh and packed with care.', 12.50, 120, 'Agriculture', 'https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?w=600&fit=crop'),
    ($1, 'Hand-Woven Bedouin Rug (Small)', 'Traditional Bedouin rug woven by local artisans using natural wool. Each piece is unique. Dimensions: 100cm × 60cm.', 45.00, 15, 'Handicrafts', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&fit=crop'),
    ($1, 'Wild Thyme & Sumac Zaatar Mix (500g)', 'Authentic wild zaatar harvested from the hills of Ajloun. Mixed with sumac, sesame seeds, and sea salt. Perfect for manaqeesh.', 8.00, 80, 'Traditional Food', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&fit=crop'),
    ($1, 'Dead Sea Black Mud Soap (3-pack)', 'Handmade soap using authentic Dead Sea black mud. Rich in minerals. Great for skin conditions and natural detox.', 18.00, 50, 'Natural Products', 'https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=600&fit=crop'),
    ($1, 'Traditional Embroidered Tablecloth', 'Beautifully embroidered tablecloth in traditional Palestinian-Jordanian style. 140cm × 180cm. Made by women cooperative in Mafraq.', 35.00, 20, 'Textiles', 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&fit=crop'),
    ($1, 'Cold-Pressed Olive Oil (1 Liter)', 'Extra-virgin olive oil from centuries-old olive trees in Jerash. First cold press, unfiltered. Certified organic.', 22.00, 60, 'Agriculture', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&fit=crop'),
    ($1, 'Dried Chamomile Flowers (200g)', 'Wild-harvested chamomile from the highlands of Karak. Sun-dried naturally. Perfect for herbal tea and medicinal use.', 6.50, 90, 'Natural Products', 'https://images.unsplash.com/photo-1558618047-f3ed1e0b7b28?w=600&fit=crop'),
    ($1, 'Handmade Ceramic Serving Bowl', 'Hand-painted ceramic bowl made by artisans in Ghor Al-Safi. Traditional patterns in terracotta and cobalt. Dishwasher safe.', 28.00, 25, 'Handicrafts', 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&fit=crop')
    `,
    [storeId]
  );

  console.log("Seeded 8 products");
  console.log("✅ Seeding complete!");
  console.log("  Admin: admin@example.com / password123");
  console.log("  Buyer: buyer@example.com / password123");

  await pool.end();
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
