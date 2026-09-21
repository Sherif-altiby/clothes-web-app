import { PrismaClient, Role, OrderStatus, DiscountType } from "@prisma/client";
import type { Category, Coupon, Product, User } from "@prisma/client";
import bcrypt from "bcrypt"; // use "bcryptjs" if that's what your app uses

const prisma = new PrismaClient();

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const round2 = (n: number) => Math.round(n * 100) / 100;

const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);
const daysFromNow = (d: number) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);

// Assumes `discount` is a percentage (e.g. 15 = 15% off)
const finalPrice = (p: Pick<Product, "baseSalary" | "profit" | "discount">) =>
  round2((p.baseSalary + p.profit) * (1 - (p.discount ?? 0) / 100));

const applyCoupon = (subtotal: number, coupon: Coupon) => {
  const discount =
    coupon.discountType === DiscountType.PERCENTAGE
      ? (subtotal * coupon.discountValue) / 100
      : coupon.discountValue;
  return round2(Math.max(subtotal - discount, 0));
};

const img = (seed: string) => [
  `https://picsum.photos/seed/${seed}-1/800/1000`,
  `https://picsum.photos/seed/${seed}-2/800/1000`,
  `https://picsum.photos/seed/${seed}-3/800/1000`,
];

/* -------------------------------------------------------------------------- */
/*                                    Data                                    */
/* -------------------------------------------------------------------------- */

const usersData = [
  {
    name: "Admin",
    email: "admin@example.com",
    password: process.env.SEED_ADMIN_PASSWORD || "Admin@12345",
    role: Role.ADMIN,
    phone: "+201000000001",
    address: "Cairo, Egypt",
  },
  {
    name: "Moderator",
    email: "moderator@example.com",
    password: process.env.SEED_MODERATOR_PASSWORD || "Moderator@12345",
    role: Role.MODERATOR,
    phone: "+201000000002",
    address: "Alexandria, Egypt",
  },
  {
    name: "Ahmed Hassan",
    email: "user@example.com",
    password: process.env.SEED_USER_PASSWORD || "User@12345",
    role: Role.USER,
    phone: "+201000000003",
    address: "12 Tahrir St, Cairo",
  },
  {
    name: "Sara Ali",
    email: "sara@example.com",
    password: process.env.SEED_USER_PASSWORD || "User@12345",
    role: Role.USER,
    phone: "+201000000004",
    address: "5 Corniche Rd, Alexandria",
  },
  {
    name: "Omar Khaled",
    email: "omar@example.com",
    password: process.env.SEED_USER_PASSWORD || "User@12345",
    role: Role.USER,
    phone: "+201000000005",
    address: "20 El-Mansoura St, Dakahlia",
  },
];

const categoriesData = [
  { key: "shirts", titleAr: "قمصان", titleEn: "Shirts" },
  { key: "tshirts", titleAr: "تيشيرتات", titleEn: "T-Shirts" },
  { key: "pants", titleAr: "بناطيل", titleEn: "Pants" },
  { key: "jackets", titleAr: "جاكيتات", titleEn: "Jackets" },
  { key: "shoes", titleAr: "أحذية", titleEn: "Shoes" },
  { key: "accessories", titleAr: "إكسسوارات", titleEn: "Accessories" },
];

const productsData = [
  {
    key: "cotton-shirt",
    category: "shirts",
    titleAr: "قميص قطني",
    titleEn: "Cotton Shirt",
    descriptionAr: "قميص مريح من القطن الخالص مناسب للاستخدام اليومي.",
    descriptionEn: "Comfortable shirt made of pure cotton, ideal for everyday wear.",
    baseSalary: 200,
    profit: 60,
    discount: 0,
    counts: 25,
  },
  {
    key: "linen-shirt",
    category: "shirts",
    titleAr: "قميص كتان",
    titleEn: "Linen Shirt",
    descriptionAr: "قميص كتان خفيف ومثالي لأيام الصيف الحارة.",
    descriptionEn: "Lightweight linen shirt, perfect for hot summer days.",
    baseSalary: 250,
    profit: 70,
    discount: 10,
    counts: 18,
  },
  {
    key: "white-tshirt",
    category: "tshirts",
    titleAr: "تيشيرت أبيض كلاسيكي",
    titleEn: "Classic White T-Shirt",
    descriptionAr: "تيشيرت أبيض أساسي بقصة مريحة وقماش ناعم.",
    descriptionEn: "Essential white t-shirt with a relaxed fit and soft fabric.",
    baseSalary: 120,
    profit: 40,
    discount: 0,
    counts: 60,
  },
  {
    key: "graphic-tshirt",
    category: "tshirts",
    titleAr: "تيشيرت مطبوع",
    titleEn: "Graphic T-Shirt",
    descriptionAr: "تيشيرت بطبعة عصرية مصنوع من القطن عالي الجودة.",
    descriptionEn: "Trendy graphic t-shirt made from high-quality cotton.",
    baseSalary: 130,
    profit: 45,
    discount: 15,
    counts: 40,
  },
  {
    key: "slim-jeans",
    category: "pants",
    titleAr: "بنطلون جينز ضيق",
    titleEn: "Slim Fit Jeans",
    descriptionAr: "بنطلون جينز بقصة ضيقة وقماش مرن يدوم طويلاً.",
    descriptionEn: "Slim fit jeans with durable stretch denim.",
    baseSalary: 350,
    profit: 100,
    discount: 0,
    counts: 30,
  },
  {
    key: "chino-pants",
    category: "pants",
    titleAr: "بنطلون شينو",
    titleEn: "Chino Pants",
    descriptionAr: "بنطلون شينو أنيق يناسب العمل والخروجات.",
    descriptionEn: "Smart chino pants suitable for both work and casual outings.",
    baseSalary: 300,
    profit: 90,
    discount: 20,
    counts: 22,
  },
  {
    key: "leather-jacket",
    category: "jackets",
    titleAr: "جاكيت جلد",
    titleEn: "Leather Jacket",
    descriptionAr: "جاكيت من الجلد الطبيعي بتصميم كلاسيكي.",
    descriptionEn: "Genuine leather jacket with a classic design.",
    baseSalary: 900,
    profit: 300,
    discount: 10,
    counts: 8,
  },
  {
    key: "denim-jacket",
    category: "jackets",
    titleAr: "جاكيت جينز",
    titleEn: "Denim Jacket",
    descriptionAr: "جاكيت جينز عصري يناسب جميع الفصول.",
    descriptionEn: "Modern denim jacket that works in every season.",
    baseSalary: 500,
    profit: 150,
    discount: 0,
    counts: 14,
  },
  {
    key: "running-sneakers",
    category: "shoes",
    titleAr: "حذاء رياضي للجري",
    titleEn: "Running Sneakers",
    descriptionAr: "حذاء رياضي خفيف بنعل مريح ومتين.",
    descriptionEn: "Lightweight running sneakers with a comfortable, durable sole.",
    baseSalary: 600,
    profit: 180,
    discount: 25,
    counts: 35,
  },
  {
    key: "leather-belt",
    category: "accessories",
    titleAr: "حزام جلد",
    titleEn: "Leather Belt",
    descriptionAr: "حزام جلد طبيعي بإبزيم معدني أنيق.",
    descriptionEn: "Genuine leather belt with a stylish metal buckle.",
    baseSalary: 150,
    profit: 50,
    discount: 0,
    counts: 50,
  },
];

const couponsData = [
  {
    code: "WELCOME10",
    description: "10% off for new customers",
    discountType: DiscountType.PERCENTAGE,
    discountValue: 10,
    minOrderValue: null,
    maxUses: 1000,
    userLimit: 1,
    expiresAt: daysFromNow(90),
    isActive: true,
  },
  {
    code: "SAVE50",
    description: "50 EGP off orders above 500 EGP",
    discountType: DiscountType.FIXED,
    discountValue: 50,
    minOrderValue: 500,
    maxUses: 100,
    userLimit: 2,
    expiresAt: daysFromNow(60),
    isActive: true,
  },
  {
    code: "FLASH25",
    description: "Limited flash sale: 25% off",
    discountType: DiscountType.PERCENTAGE,
    discountValue: 25,
    minOrderValue: 300,
    maxUses: 5,
    userLimit: 1,
    expiresAt: daysFromNow(7),
    isActive: true,
  },
  {
    code: "EXPIRED20",
    description: "Expired promotion",
    discountType: DiscountType.PERCENTAGE,
    discountValue: 20,
    minOrderValue: null,
    maxUses: null,
    userLimit: null,
    expiresAt: daysAgo(30),
    isActive: false,
  },
];

const cartsData: Record<string, { product: string; quantity: number }[]> = {
  "user@example.com": [
    { product: "white-tshirt", quantity: 2 },
    { product: "slim-jeans", quantity: 1 },
  ],
  "sara@example.com": [{ product: "denim-jacket", quantity: 1 }],
  "omar@example.com": [
    { product: "running-sneakers", quantity: 1 },
    { product: "leather-belt", quantity: 1 },
    { product: "linen-shirt", quantity: 2 },
  ],
};

const favoritesData: Record<string, string[]> = {
  "user@example.com": ["leather-jacket", "running-sneakers", "chino-pants"],
  "sara@example.com": ["denim-jacket", "linen-shirt"],
  "omar@example.com": ["slim-jeans", "graphic-tshirt", "leather-belt"],
};

const ordersData = [
  {
    user: "user@example.com",
    status: OrderStatus.DELIVERING,
    daysAgo: 30,
    coupon: "WELCOME10",
    items: [
      { product: "cotton-shirt", quantity: 2 },
      { product: "slim-jeans", quantity: 1 },
    ],
  },
  {
    user: "user@example.com",
    status: OrderStatus.PENDING,
    daysAgo: 3,
    coupon: "SAVE50",
    items: [{ product: "running-sneakers", quantity: 1 }],
  },
  {
    user: "sara@example.com",
    status: OrderStatus.SUCCESSED,
    daysAgo: 5,
    coupon: "WELCOME10",
    items: [
      { product: "white-tshirt", quantity: 3 },
      { product: "leather-belt", quantity: 1 },
    ],
  },
  {
    user: "sara@example.com",
    status: OrderStatus.PENDING,
    daysAgo: 1,
    coupon: null,
    items: [{ product: "leather-jacket", quantity: 1 }],
  },
  {
    user: "omar@example.com",
    status: OrderStatus.CANCELLED,
    daysAgo: 20,
    coupon: "SAVE50",
    items: [{ product: "chino-pants", quantity: 2 }],
  },
  {
    user: "omar@example.com",
    status: OrderStatus.CANCELLED,
    daysAgo: 10,
    coupon: null,
    items: [{ product: "graphic-tshirt", quantity: 1 }],
  },
];

// One review per (user, product) pair: the schema enforces this
const reviewsData = [
  { user: "user@example.com", product: "cotton-shirt", rating: 5, comment: "Great quality and very comfortable." },
  { user: "user@example.com", product: "slim-jeans", rating: 4, comment: "Nice fit, slightly long." },
  { user: "sara@example.com", product: "white-tshirt", rating: 5, comment: "Soft fabric, exactly as described." },
  { user: "sara@example.com", product: "leather-belt", rating: 4, comment: "Looks premium." },
  { user: "omar@example.com", product: "chino-pants", rating: 5, comment: "Perfect for work, will buy again." },
  { user: "omar@example.com", product: "running-sneakers", rating: 3, comment: null },
  { user: "user@example.com", product: "leather-jacket", rating: 5, comment: "Worth every pound." },
  { user: "sara@example.com", product: "denim-jacket", rating: 4, comment: "Good stitching and color." },
];

/* -------------------------------------------------------------------------- */
/*                                    Seed                                    */
/* -------------------------------------------------------------------------- */

async function clearDatabase() {
  // Reverse dependency order
  await prisma.couponUsage.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.SEED_FORCE !== "true") {
    throw new Error(
      "Refusing to seed in production (this wipes all data). Set SEED_FORCE=true to override."
    );
  }

  console.log("Clearing existing data...");
  await clearDatabase();

  /* ------------------------------- Users ---------------------------------- */
  const usersByEmail: Record<string, User> = {};
  for (const u of usersData) {
    usersByEmail[u.email] = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        password: await bcrypt.hash(u.password, 10),
        role: u.role,
        phone: u.phone,
        address: u.address,
        cart: { create: {} }, // every user gets a cart
      },
    });
  }
  console.log(`✔ Users: ${usersData.length}`);

  /* ----------------------------- Categories ------------------------------- */
  const categoriesByKey: Record<string, Category> = {};
  for (const c of categoriesData) {
    categoriesByKey[c.key] = await prisma.category.create({
      data: { titleAr: c.titleAr, titleEn: c.titleEn },
    });
  }
  console.log(`✔ Categories: ${categoriesData.length}`);

  /* ------------------------------ Products -------------------------------- */
  const productsByKey: Record<string, Product> = {};
  for (const p of productsData) {
    productsByKey[p.key] = await prisma.product.create({
      data: {
        titleAr: p.titleAr,
        titleEn: p.titleEn,
        descriptionAr: p.descriptionAr,
        descriptionEn: p.descriptionEn,
        baseSalary: p.baseSalary,
        profit: p.profit,
        discount: p.discount,
        counts: p.counts,
        images: img(p.key),
        categoryId: categoriesByKey[p.category].id,
      },
    });
  }
  console.log(`✔ Products: ${productsData.length}`);

  /* ------------------------------- Coupons -------------------------------- */
  const couponsByCode: Record<string, Coupon> = {};
  for (const c of couponsData) {
    couponsByCode[c.code] = await prisma.coupon.create({ data: c });
  }
  console.log(`✔ Coupons: ${couponsData.length}`);

  /* ----------------------------- Cart items ------------------------------- */
  let cartItemsCount = 0;
  for (const [email, items] of Object.entries(cartsData)) {
    const cart = await prisma.cart.findUniqueOrThrow({
      where: { userId: usersByEmail[email].id },
    });

    for (const item of items) {
      const product = productsByKey[item.product];
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          quantity: item.quantity,
          unitPrice: finalPrice(product),
        },
      });
      cartItemsCount++;
    }
  }
  console.log(`✔ Cart items: ${cartItemsCount}`);

  /* ----------------------------- Favorites -------------------------------- */
  let favoritesCount = 0;
  for (const [email, productKeys] of Object.entries(favoritesData)) {
    for (const key of productKeys) {
      await prisma.favorite.create({
        data: {
          userId: usersByEmail[email].id,
          productId: productsByKey[key].id,
        },
      });
      favoritesCount++;
    }
  }
  console.log(`✔ Favorites: ${favoritesCount}`);

  /* ------------------------ Orders + items + usages ----------------------- */
  let orderItemsCount = 0;
  let couponUsagesCount = 0;

  for (const o of ordersData) {
    const user = usersByEmail[o.user];

    const items = o.items.map((i) => {
      const product = productsByKey[i.product];
      return {
        productId: product.id,
        quantity: i.quantity,
        unitPrice: finalPrice(product),
      };
    });

    const subtotal = round2(items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0));
    const coupon = o.coupon ? couponsByCode[o.coupon] : undefined;
    const total = coupon ? applyCoupon(subtotal, coupon) : subtotal;

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        status: o.status,
        total,
        createdAt: daysAgo(o.daysAgo),
        items: { create: items },
      },
    });
    orderItemsCount += items.length;

    if (coupon) {
      await prisma.couponUsage.create({
        data: {
          couponId: coupon.id,
          userId: user.id,
          orderId: order.id,
          usedAt: order.createdAt,
        },
      });
      couponUsagesCount++;
    }
  }
  console.log(`✔ Orders: ${ordersData.length} (items: ${orderItemsCount})`);
  console.log(`✔ Coupon usages: ${couponUsagesCount}`);

  // Keep Coupon.usedCount in sync with the usages we just created
  for (const coupon of Object.values(couponsByCode)) {
    const usedCount = await prisma.couponUsage.count({ where: { couponId: coupon.id } });
    await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount } });
  }

  /* ------------------------------- Reviews -------------------------------- */
  for (const r of reviewsData) {
    await prisma.review.create({
      data: {
        userId: usersByEmail[r.user].id,
        productId: productsByKey[r.product].id,
        rating: r.rating,
        comment: r.comment,
      },
    });
  }
  console.log(`✔ Reviews: ${reviewsData.length}`);

  console.log("\nSeed completed.");
  console.log("Logins: admin@example.com | moderator@example.com | user@example.com | sara@example.com | omar@example.com");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });