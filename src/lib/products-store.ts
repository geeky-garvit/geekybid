// src/lib/products-store.ts
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
}

let cachedProducts: Product[] | null = null;

export async function getAllProducts(): Promise<Product[]> {
  if (cachedProducts) return cachedProducts;

  try {
    const res = await fetch('https://dummyjson.com/products?limit=100');
    if (res.ok) {
      const data = await res.json();
      cachedProducts = data.products.map(
        (p: { id: number; title: string; description: string; price: number; category: string; images?: string[] }) => ({
          id: `prod-${p.id}`,
          title: p.title,
          description: p.description,
          price: p.price,
          category: p.category,
          images: p.images && p.images.length > 0 ? p.images : [`https://picsum.photos/seed/prod-${p.id}/600/600`],
        })
      );
      return cachedProducts || [];
    }
  } catch (error) {
    console.error('Failed to load products:', error);
  }

  return [];
}