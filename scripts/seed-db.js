const { PrismaClient, Role, ProductType, InputType, DiscountType } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting e-commerce database seeding via runner script...');

  // 1. Create Admin User
  const adminPasswordHash = await bcrypt.hash('Qasim.11', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'alexabraham587@gmail.com' },
    update: {
      role: Role.ADMIN,
      passwordHash: adminPasswordHash,
      name: 'Alex Abraham',
    },
    create: {
      email: 'alexabraham587@gmail.com',
      username: 'alexadmin',
      name: 'Alex Abraham',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      phone: '+1234567890',
      address: 'Admin Headquarters, Main St',
      city: 'Capital City',
      province: 'Central',
      postalCode: '10001',
    },
  });
  console.log('✅ Admin user ready:', adminUser.email);

  // 2. Create Demo Customer
  const customerPasswordHash = await bcrypt.hash('Customer.123', 10);
  const demoCustomer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      username: 'janedoe',
      name: 'Jane Doe',
      passwordHash: customerPasswordHash,
      role: Role.CUSTOMER,
      phone: '+1987654321',
      address: '456 Shopping Lane',
      city: 'Commerce City',
      province: 'West',
      postalCode: '90001',
    },
  });
  console.log('✅ Customer user ready:', demoCustomer.email);

  // 3. Create Brands
  const brandRoyal = await prisma.brand.upsert({
    where: { slug: 'royal-comfort' },
    update: {},
    create: { name: 'Royal Comfort', slug: 'royal-comfort' },
  });

  const brandSleepWell = await prisma.brand.upsert({
    where: { slug: 'sleepwell' },
    update: {},
    create: { name: 'SleepWell', slug: 'sleepwell' },
  });
  console.log('✅ Brands ready');

  // 4. Create Parent & Subcategories
  const catBeds = await prisma.category.upsert({
    where: { slug: 'beds' },
    update: {},
    create: {
      name: 'Beds',
      slug: 'beds',
      description: 'Luxury upholstered and wooden beds for modern bedrooms',
      heroBannerImageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200',
    },
  });

  const catChesterfield = await prisma.category.upsert({
    where: { slug: 'chesterfield-beds' },
    update: {},
    create: {
      name: 'Chesterfield Beds',
      slug: 'chesterfield-beds',
      description: 'Handcrafted tufted chesterfield beds',
      parentCategoryId: catBeds.id,
    },
  });

  const catMattresses = await prisma.category.upsert({
    where: { slug: 'mattresses' },
    update: {},
    create: {
      name: 'Mattresses',
      slug: 'mattresses',
      description: 'Ergonomic orthopedic and memory foam mattresses',
      heroBannerImageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1200',
    },
  });
  console.log('✅ Categories ready');

  // 5. Create Coupons
  await prisma.coupon.upsert({
    where: { code: 'SAVE10' },
    update: {},
    create: {
      code: 'SAVE10',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      minOrderValue: 10000,
      active: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'FLAT1000' },
    update: {},
    create: {
      code: 'FLAT1000',
      discountType: DiscountType.FIXED,
      discountValue: 1000,
      minOrderValue: 15000,
      active: true,
    },
  });
  console.log('✅ Coupons ready');

  // 6. Create Simple Product
  await prisma.product.upsert({
    where: { slug: 'orthopedic-pocket-sprung-mattress' },
    update: {},
    create: {
      name: 'Orthopedic Pocket Sprung Mattress',
      slug: 'orthopedic-pocket-sprung-mattress',
      description: 'Premium spinal support mattress with 2000 independent pocket springs and breathable memory foam top layer.',
      shortDescription: '2000 Pocket spring orthopedic mattress for ultimate back support.',
      basePrice: 22000,
      originalPrice: 28000,
      productType: ProductType.SIMPLE,
      stock: 25,
      featured: true,
      categoryId: catMattresses.id,
      brandId: brandSleepWell.id,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=800', altText: 'Mattress Layer View', order: 1 },
        ],
      },
    },
  });
  console.log('✅ Simple product ready');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
