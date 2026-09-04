import { PrismaClient, Role, ProductType, InputType, DiscountType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting e-commerce database seeding...');

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
  console.log('✅ Admin user created:', adminUser.email);

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
  console.log('✅ Customer user created:', demoCustomer.email);

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
  console.log('✅ Brands created');

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
  console.log('✅ Categories created');

  // 5. Create Reusable Global Form Options
  const globalBedForm = await prisma.globalForm.upsert({
    where: { id: 'global-bed-options-form' },
    update: {},
    create: {
      id: 'global-bed-options-form',
      name: 'Standard Bed Specification Form',
      description: 'Reusable Size, Fabric, and Color options for all bed products',
      active: true,
    },
  });

  // Global Option: Size
  const optionSize = await prisma.productOption.create({
    data: {
      name: 'Size',
      inputType: InputType.BUTTON_GROUP,
      globalFormId: globalBedForm.id,
      values: {
        create: [
          { value: '3ft Single', priceAdjustment: 0 },
          { value: '4ft Double', priceAdjustment: 5000 },
          { value: '5ft King Size', priceAdjustment: 10000 },
          { value: '6ft Super King', priceAdjustment: 15000 },
        ],
      },
    },
    include: { values: true },
  });

  // Global Option: Fabric
  const optionFabric = await prisma.productOption.create({
    data: {
      name: 'Fabric',
      inputType: InputType.RADIO,
      globalFormId: globalBedForm.id,
      values: {
        create: [
          { value: 'Plush Velvet', priceAdjustment: 2000 },
          { value: 'Naples Fabric', priceAdjustment: 0 },
          { value: 'Linen', priceAdjustment: 1000 },
        ],
      },
    },
    include: { values: true },
  });

  // Global Option: Color
  const optionColor = await prisma.productOption.create({
    data: {
      name: 'Color',
      inputType: InputType.COLOR_PICKER,
      globalFormId: globalBedForm.id,
      values: {
        create: [
          { value: 'Midnight Black', priceAdjustment: 0 },
          { value: 'Champagne Beige', priceAdjustment: 0 },
          { value: 'Silver Grey', priceAdjustment: 0 },
        ],
      },
    },
    include: { values: true },
  });

  console.log('✅ Global Form and Options created');

  // 6. Create Variable Product (Luxury Chesterfield Bed)
  const productBed = await prisma.product.upsert({
    where: { slug: 'luxury-chesterfield-upholstered-bed' },
    update: {},
    create: {
      name: 'Luxury Chesterfield Upholstered Bed',
      slug: 'luxury-chesterfield-upholstered-bed',
      description: 'Experience regal elegance with our handcrafted Chesterfield upholstered bed frame featuring deep button tufting and solid hardwood slats.',
      shortDescription: 'Handcrafted luxury upholstered bed frame with deep button tufting.',
      basePrice: 35000,
      originalPrice: 45000,
      productType: ProductType.VARIABLE,
      featured: true,
      categoryId: catChesterfield.id,
      brandId: brandRoyal.id,
      globalFormId: globalBedForm.id,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=800', altText: 'Front View', order: 1 },
          { url: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=800', altText: 'Side Detail', order: 2 },
        ],
      },
    },
  });

  // Generate Cartesian Product Variations for Bed
  const sizeValues = optionSize.values;
  const fabricValues = optionFabric.values;
  const colorValues = optionColor.values;

  for (const s of sizeValues) {
    for (const f of fabricValues) {
      for (const c of colorValues) {
        const calculatedPrice = 35000 + Number(s.priceAdjustment) + Number(f.priceAdjustment) + Number(c.priceAdjustment);
        const sku = `BED-${s.value.substring(0, 3)}-${f.value.substring(0, 3)}-${c.value.substring(0, 3)}`.toUpperCase().replace(/\s+/g, '');
        
        await prisma.productVariation.create({
          data: {
            productId: productBed.id,
            sku: sku,
            price: calculatedPrice,
            stock: 10,
            values: {
              create: [
                { optionValueId: s.id },
                { optionValueId: f.id },
                { optionValueId: c.id },
              ],
            },
          },
        });
      }
    }
  }
  console.log('✅ Generated 36 Product Variations for Luxury Bed');

  // 7. Create Simple Product (Orthopedic Mattress)
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
  console.log('✅ Simple Product created');

  // 8. Create Coupons
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
  console.log('✅ Coupons created');

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
