export interface Product { id: string; title: string; description: string; price: number; category: string; images: string[] }

const productNames = ['Compact Camera', 'Gaming Keyboard', 'Vinyl Record Player', 'Leather Messenger Bag', 'Desk Lamp', 'Wireless Earbuds'];
const productCategories = ['photography', 'electronics', 'electronics', 'fashion', 'art', 'electronics'];

const products: Product[] = productNames.map((title, index) => ({
  id: `prod-${index + 1}`,
  title,
  description: `Local demo catalogue item: ${title}.`,
  price: 29 + index * 24,
  category: productCategories[index],
  images: [`https://picsum.photos/seed/product-${index + 1}/600/600`],
}));

export async function getAllProducts(): Promise<Product[]> {
  return products.map((product) => ({ ...product, images: [...product.images] }));
}
