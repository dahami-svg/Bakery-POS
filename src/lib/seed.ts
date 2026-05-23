import dbConnect from './dbConnect';
import Tenant from '../models/Tenant';
import Product from '../models/Product';
import Order from '../models/Order';
import InventoryItem from '../models/InventoryItem';
import WasteEntry from '../models/WasteEntry';

export async function seedDatabase() {
  await dbConnect();

  // Clear existing data
  await Tenant.deleteMany({});
  await Product.deleteMany({});
  await Order.deleteMany({});
  await InventoryItem.deleteMany({});
  await WasteEntry.deleteMany({});

  // 1. Seed Tenants
  const bakeryTenant = await Tenant.create({
    name: 'Lumina Organic Bakery',
    type: 'bakery',
    enabledModules: ['analytics', 'pos', 'kds', 'inventory'],
    logoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&h=100&fit=crop',
  });

  const hardwareTenant = await Tenant.create({
    name: 'Apex Hardware Store',
    type: 'hardware',
    enabledModules: ['analytics', 'pos', 'inventory'], // No Kitchen/KDS
    logoUrl: 'https://images.unsplash.com/photo-1530124566582-ab37850759ce?w=100&h=100&fit=crop',
  });

  const restaurantTenant = await Tenant.create({
    name: 'Tasty Bistro & Grill',
    type: 'restaurant',
    enabledModules: ['analytics', 'pos', 'kds', 'inventory'],
    logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=100&fit=crop',
  });

  const cakeTenant = await Tenant.create({
    name: 'Sweet Delights Cake Shop',
    type: 'cake_shop',
    enabledModules: ['analytics', 'pos', 'inventory'], // No Kitchen/KDS
    logoUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100&h=100&fit=crop',
  });

  // 2. Seed Products
  // Bakery products
  const bakeryProducts = await Product.create([
    {
      tenantId: bakeryTenant._id,
      name: 'Chocolate Fudge',
      category: 'Cakes',
      price: 25.00,
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop',
      unit: 'Whole Cake',
    },
    {
      tenantId: bakeryTenant._id,
      name: 'Sourdough Loaf',
      category: 'Breads',
      price: 8.50,
      image: 'https://images.unsplash.com/photo-1585478259715-876a6a81b69c?w=400&h=400&fit=crop',
      unit: 'Loaf',
    },
    {
      tenantId: bakeryTenant._id,
      name: 'Butter Croissant',
      category: 'Pastries',
      price: 3.75,
      image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=400&fit=crop',
      unit: 'Individual',
    },
    {
      tenantId: bakeryTenant._id,
      name: 'Baguette',
      category: 'Breads',
      price: 5.00,
      image: 'https://images.unsplash.com/photo-1586444248902-2f64eddf13cf?w=400&h=400&fit=crop',
      unit: 'Loaf',
    },
    {
      tenantId: bakeryTenant._id,
      name: 'Sea Salt Cookie',
      category: 'Pastries',
      price: 2.50,
      image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=400&fit=crop',
      unit: 'Individual',
    },
    {
      tenantId: bakeryTenant._id,
      name: 'Matcha Cupcake',
      category: 'Cakes',
      price: 4.50,
      image: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400&h=400&fit=crop',
      unit: 'Individual',
    },
  ]);

  // Hardware products
  const hardwareProducts = await Product.create([
    {
      tenantId: hardwareTenant._id,
      name: 'Claw Hammer (16oz)',
      category: 'Hand Tools',
      price: 12.99,
      image: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400&h=400&fit=crop',
      unit: 'Unit',
    },
    {
      tenantId: hardwareTenant._id,
      name: 'Screwdriver Set (10-pc)',
      category: 'Hand Tools',
      price: 18.50,
      image: 'https://images.unsplash.com/photo-1534224039826-c7a0eda0e6b3?w=400&h=400&fit=crop',
      unit: 'Set',
    },
    {
      tenantId: hardwareTenant._id,
      name: 'Philips LED Bulb 9W',
      category: 'Electrical',
      price: 4.25,
      image: 'https://images.unsplash.com/photo-1550985616-10810253b84d?w=400&h=400&fit=crop',
      unit: 'Unit',
    },
    {
      tenantId: hardwareTenant._id,
      name: 'Steel Tape Measure 5m',
      category: 'Measuring',
      price: 6.99,
      image: 'https://images.unsplash.com/photo-1588600878108-57c6118d8c6d?w=400&h=400&fit=crop',
      unit: 'Unit',
    },
    {
      tenantId: hardwareTenant._id,
      name: 'WD-40 Multi-Use Can',
      category: 'Chemicals',
      price: 5.50,
      image: 'https://images.unsplash.com/photo-1627389908612-43f2109cf9bb?w=400&h=400&fit=crop',
      unit: 'Can',
    },
    {
      tenantId: hardwareTenant._id,
      name: 'Matte Spray Paint Red',
      category: 'Paint',
      price: 7.99,
      image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&h=400&fit=crop',
      unit: 'Can',
    },
  ]);

  // Bistro products
  const bistroProducts = await Product.create([
    {
      tenantId: restaurantTenant._id,
      name: 'Gourmet Cheeseburger',
      category: 'Mains',
      price: 14.50,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
      unit: 'Plate',
    },
    {
      tenantId: restaurantTenant._id,
      name: 'Wood-fired Pizza Margherita',
      category: 'Mains',
      price: 16.99,
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop',
      unit: 'Pizza',
    },
    {
      tenantId: restaurantTenant._id,
      name: 'Classic Caesar Salad',
      category: 'Appetizers',
      price: 11.00,
      image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&h=400&fit=crop',
      unit: 'Bowl',
    },
    {
      tenantId: restaurantTenant._id,
      name: 'Garlic Bread Roll',
      category: 'Appetizers',
      price: 5.50,
      image: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=400&h=400&fit=crop',
      unit: 'Serving',
    },
    {
      tenantId: restaurantTenant._id,
      name: 'Chocolate Lava Cake',
      category: 'Desserts',
      price: 8.00,
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=400&fit=crop',
      unit: 'Serving',
    },
  ]);

  // Cake Shop products
  const cakeProducts = await Product.create([
    {
      tenantId: cakeTenant._id,
      name: 'Luxury Chocolate Fudge Cake',
      category: 'Signature Cakes',
      price: 32.00,
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop',
      unit: 'Whole Cake',
    },
    {
      tenantId: cakeTenant._id,
      name: 'Strawberry Shortcake',
      category: 'Signature Cakes',
      price: 36.00,
      image: 'https://images.unsplash.com/photo-1464349110296-4d53f47e3557?w=400&h=400&fit=crop',
      unit: 'Whole Cake',
    },
    {
      tenantId: cakeTenant._id,
      name: 'Velvet Dream Cupcake',
      category: 'Cupcakes',
      price: 3.50,
      image: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400&h=400&fit=crop',
      unit: 'Individual',
    },
    {
      tenantId: cakeTenant._id,
      name: 'Rainbow Sprinkles Blast',
      category: 'Custom Cakes',
      price: 42.00,
      image: 'https://images.unsplash.com/photo-1535141192574-5d4897c13636?w=400&h=400&fit=crop',
      unit: 'Whole Cake',
    },
  ]);

  // 3. Seed Inventory/Ingredients
  // Bakery inventory
  const bakeryInventory = await InventoryItem.create([
    { tenantId: bakeryTenant._id, name: 'Bread Flour', category: 'Pantry / Dry', currentStock: 85, unit: 'kg', bestBefore: 'Oct 24, 2026' },
    { tenantId: bakeryTenant._id, name: 'Organic Eggs', category: 'Fridge / Dairy', currentStock: 12, unit: 'dozen', bestBefore: 'Jun 12, 2026' },
    { tenantId: bakeryTenant._id, name: 'Caster Sugar', category: 'Pantry / Dry', currentStock: 40, unit: 'kg', bestBefore: 'Dec 05, 2026' },
    { tenantId: bakeryTenant._id, name: 'Unsalted Butter', category: 'Fridge / Dairy', currentStock: 18, unit: 'kg', bestBefore: 'Jul 30, 2026' },
  ]);

  // Hardware inventory (as generic stock items)
  await InventoryItem.create([
    { tenantId: hardwareTenant._id, name: 'Claw Hammers 16oz', category: 'Hand Tools', currentStock: 10, unit: 'units', bestBefore: 'N/A' },
    { tenantId: hardwareTenant._id, name: 'Screwdriver Sets', category: 'Hand Tools', currentStock: 25, unit: 'sets', bestBefore: 'N/A' },
    { tenantId: hardwareTenant._id, name: 'LED Bulbs 9W', category: 'Electrical', currentStock: 75, unit: 'units', bestBefore: 'N/A' },
    { tenantId: hardwareTenant._id, name: 'WD-40 Cans 400ml', category: 'Chemicals', currentStock: 5, unit: 'units', bestBefore: 'N/A' }, // Low stock!
  ]);

  // Bistro inventory
  await InventoryItem.create([
    { tenantId: restaurantTenant._id, name: 'Burger Buns', category: 'Breads', currentStock: 50, unit: 'units', bestBefore: 'May 30, 2026' },
    { tenantId: restaurantTenant._id, name: 'Premium Beef Patties', category: 'Meat', currentStock: 8, unit: 'units', bestBefore: 'May 28, 2026' }, // Low stock!
    { tenantId: restaurantTenant._id, name: 'Wood-fired Pizza Dough', category: 'Dough', currentStock: 30, unit: 'units', bestBefore: 'May 26, 2026' },
    { tenantId: restaurantTenant._id, name: 'Mozzarella Cheese', category: 'Dairy', currentStock: 15, unit: 'kg', bestBefore: 'Jun 15, 2026' },
  ]);

  // Cake Shop inventory
  await InventoryItem.create([
    { tenantId: cakeTenant._id, name: 'Cake Flour', category: 'Pantry / Dry', currentStock: 50, unit: 'kg', bestBefore: 'Dec 01, 2026' },
    { tenantId: cakeTenant._id, name: 'Buttercream Frosting', category: 'Dairy / Cream', currentStock: 20, unit: 'kg', bestBefore: 'Jul 04, 2026' },
    { tenantId: cakeTenant._id, name: 'Fresh Strawberries', category: 'Produce', currentStock: 6, unit: 'kg', bestBefore: 'May 28, 2026' },
    { tenantId: cakeTenant._id, name: 'Rainbow Sprinkles', category: 'Dry Toppings', currentStock: 15, unit: 'kg', bestBefore: 'Jan 01, 2027' },
  ]);

  // 4. Seed Waste
  await WasteEntry.create({
    tenantId: bakeryTenant._id,
    ingredientId: bakeryInventory[1]._id, // eggs
    amount: 1.5,
    reason: 'Spilled / Damaged',
  });

  // 5. Seed Orders
  // Bakery orders
  await Order.create([
    {
      tenantId: bakeryTenant._id,
      status: 'completed',
      type: 'takeaway',
      total: 20.75,
      items: [
        { productId: bakeryProducts[2]._id, quantity: 2, note: 'Warm it up please', status: 'delivered' }, // Butter Croissant
        { productId: bakeryProducts[1]._id, quantity: 1, note: 'Slice it', status: 'delivered' }, // Sourdough Loaf
        { productId: bakeryProducts[4]._id, quantity: 1, note: '', status: 'delivered' }, // Sea Salt Cookie
      ],
      createdAt: new Date(Date.now() - 3600000 * 3), // 3 hours ago
    },
    {
      tenantId: bakeryTenant._id,
      status: 'preparing',
      type: 'dine-in',
      tableNumber: 12,
      total: 12.25,
      items: [
        { productId: bakeryProducts[3]._id, quantity: 1, note: 'Baguette extra crispy', status: 'preparing' }, // Baguette
        { productId: bakeryProducts[2]._id, quantity: 1, note: '', status: 'ready' }, // Butter Croissant
        { productId: bakeryProducts[4]._id, quantity: 1, note: '', status: 'pending' }, // Sea Salt Cookie
      ],
      createdAt: new Date(Date.now() - 1800000), // 30 mins ago
    },
    {
      tenantId: bakeryTenant._id,
      status: 'new',
      type: 'delivery',
      total: 13.00,
      items: [
        { productId: bakeryProducts[3]._id, quantity: 1, note: '', status: 'pending' }, // Baguette
        { productId: bakeryProducts[5]._id, quantity: 1, note: 'Matcha Cupcake', status: 'pending' }, // Matcha Cupcake
        { productId: bakeryProducts[4]._id, quantity: 1, note: '', status: 'pending' }, // Sea Salt Cookie
      ],
      createdAt: new Date(Date.now() - 600000), // 10 mins ago
    },
  ]);

  // Hardware orders
  await Order.create([
    {
      tenantId: hardwareTenant._id,
      status: 'completed',
      type: 'quick-sale',
      total: 31.49,
      items: [
        { productId: hardwareProducts[0]._id, quantity: 1, note: '', status: 'delivered' }, // Claw Hammer
        { productId: hardwareProducts[1]._id, quantity: 1, note: '', status: 'delivered' }, // Screwdriver Set
      ],
      createdAt: new Date(Date.now() - 3600000 * 4), // 4 hours ago
    },
    {
      tenantId: hardwareTenant._id,
      status: 'completed',
      type: 'quick-sale',
      total: 9.75,
      items: [
        { productId: hardwareProducts[2]._id, quantity: 1, note: '', status: 'delivered' }, // LED Bulb
        { productId: hardwareProducts[4]._id, quantity: 1, note: '', status: 'delivered' }, // WD-40
      ],
      createdAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
    },
  ]);

  // Bistro orders
  await Order.create([
    {
      tenantId: restaurantTenant._id,
      status: 'preparing',
      type: 'dine-in',
      tableNumber: 4,
      total: 25.50,
      items: [
        { productId: bistroProducts[0]._id, quantity: 1, note: 'Medium rare', status: 'preparing' }, // Burger
        { productId: bistroProducts[2]._id, quantity: 1, note: 'Dressing on side', status: 'pending' }, // Caesar Salad
      ],
      createdAt: new Date(Date.now() - 1200000), // 20 mins ago
    },
    {
      tenantId: restaurantTenant._id,
      status: 'ready',
      type: 'dine-in',
      tableNumber: 8,
      total: 22.49,
      items: [
        { productId: bistroProducts[1]._id, quantity: 1, note: 'Extra cheese', status: 'ready' }, // Pizza Margherita
        { productId: bistroProducts[3]._id, quantity: 1, note: '', status: 'ready' }, // Garlic Bread
      ],
      createdAt: new Date(Date.now() - 2400000), // 40 mins ago
    },
  ]);

  // Cake Shop orders
  await Order.create([
    {
      tenantId: cakeTenant._id,
      status: 'completed',
      type: 'quick-sale',
      total: 43.00,
      items: [
        { productId: cakeProducts[1]._id, quantity: 1, note: 'Happy Birthday script', status: 'delivered' }, // Strawberry Shortcake
        { productId: cakeProducts[2]._id, quantity: 2, note: '', status: 'delivered' }, // Cupcake
      ],
      createdAt: new Date(Date.now() - 3600000 * 5), // 5 hours ago
    },
  ]);

  console.log('Database seeded successfully!');
  return {
    bakeryTenant,
    hardwareTenant,
    restaurantTenant,
    cakeTenant,
  };
}
