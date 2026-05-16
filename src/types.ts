export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  unit: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  note?: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
}

export interface Order {
  id: string;
  items: OrderItem[];
  status: 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  type: 'dine-in' | 'takeaway' | 'delivery';
  tableNumber?: number;
  createdAt: string;
  total: number;
}

export interface Ingredient {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  bestBefore: string;
}

export interface WasteEntry {
  id: string;
  ingredientId: string;
  amount: number;
  reason: string;
  createdAt: string;
}
