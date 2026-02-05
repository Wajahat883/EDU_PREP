import { EventEmitter } from "events";

export interface MarketplaceProduct {
  productId: string;
  sellerId: string;
  sellerName: string;
  name: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  quantity: number;
  thumbnail: string;
  images: string[];
  rating: number;
  ratingCount: number;
  salesCount: number;
  createdDate: Date;
  status: "active" | "inactive" | "sold-out";
  isPromoted: boolean;
  tags: string[];
}

export interface MarketplaceTransaction {
  transactionId: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  tax: number;
  platformFee: number;
  sellerEarnings: number;
  status: "completed" | "pending" | "refunded";
  transactionDate: Date;
  refundDate?: Date;
  refundReason?: string;
}

export interface MarketplaceReview {
  reviewId: string;
  productId: string;
  buyerId: string;
  buyerName: string;
  rating: number;
  text: string;
  images?: string[];
  helpfulCount: number;
  createdDate: Date;
}

export interface Cart {
  cartId: string;
  userId: string;
  items: CartItem[];
  createdDate: Date;
  updatedDate: Date;
  expiresAt: Date;
}

export interface CartItem {
  itemId: string;
  productId: string;
  quantity: number;
  price: number;
  addedDate: Date;
}

export interface Wishlist {
  wishlistId: string;
  userId: string;
  items: string[]; // productIds
  createdDate: Date;
}

export class MarketplaceService extends EventEmitter {
  private products: Map<string, MarketplaceProduct> = new Map();
  private transactions: Map<string, MarketplaceTransaction[]> = new Map();
  private reviews: Map<string, MarketplaceReview[]> = new Map();
  private carts: Map<string, Cart> = new Map();
  private wishlists: Map<string, Wishlist> = new Map();
  private searchIndex: Map<string, Set<string>> = new Map();

  constructor() {
    super();
    this.initializeCategories();
  }

  private initializeCategories(): void {
    const categories = [
      "Study Materials",
      "Practice Tests",
      "Textbooks",
      "Online Courses",
      "Tutoring Services",
      "Writing Services",
    ];
    categories.forEach((cat) => {
      this.searchIndex.set(cat.toLowerCase(), new Set());
    });
  }

  // List product
  listProduct(
    sellerId: string,
    sellerName: string,
    name: string,
    description: string,
    category: string,
    price: number,
    quantity: number,
  ): MarketplaceProduct {
    const productId = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const product: MarketplaceProduct = {
      productId,
      sellerId,
      sellerName,
      name,
      description,
      category,
      price,
      quantity,
      thumbnail: `https://marketplace.example.com/thumbnails/${productId}`,
      images: [],
      rating: 0,
      ratingCount: 0,
      salesCount: 0,
      createdDate: new Date(),
      status: "active",
      isPromoted: false,
      tags: [],
    };

    this.products.set(productId, product);
    this.reviews.set(productId, []);

    // Index by category
    const catLower = category.toLowerCase();
    const productSet = this.searchIndex.get(catLower) || new Set();
    productSet.add(productId);
    this.searchIndex.set(catLower, productSet);

    this.emit("product:listed", {
      productId,
      name,
      sellerName,
      price,
      category,
    });

    return product;
  }

  // Search products
  searchProducts(
    query: string,
    category?: string,
    maxPrice?: number,
    minRating?: number,
    limit: number = 50,
  ): MarketplaceProduct[] {
    let results: MarketplaceProduct[] = [];

    if (category) {
      const catLower = category.toLowerCase();
      const productIds = this.searchIndex.get(catLower) || new Set();
      results = Array.from(productIds)
        .map((id) => this.products.get(id))
        .filter((p) => p && p.status === "active") as MarketplaceProduct[];
    } else {
      results = Array.from(this.products.values()).filter(
        (p) => p.status === "active",
      );
    }

    // Apply filters
    if (maxPrice) {
      results = results.filter((p) => (p.originalPrice || p.price) <= maxPrice);
    }
    if (minRating) {
      results = results.filter((p) => p.rating >= minRating);
    }

    // Full-text search
    if (query) {
      const queryLower = query.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(queryLower) ||
          p.description.toLowerCase().includes(queryLower) ||
          p.sellerName.toLowerCase().includes(queryLower),
      );
    }

    // Sort by rating and sales
    results.sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      return b.salesCount - a.salesCount;
    });

    return results.slice(0, limit);
  }

  // Add to cart
  addToCart(userId: string, productId: string, quantity: number): void {
    let cart = this.carts.get(userId);

    if (!cart) {
      const cartId = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      cart = {
        cartId,
        userId,
        items: [],
        createdDate: new Date(),
        updatedDate: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      };
      this.carts.set(userId, cart);
    }

    const product = this.products.get(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    if (quantity > product.quantity) {
      throw new Error("Insufficient quantity");
    }

    const existingItem = cart.items.find(
      (item) => item.productId === productId,
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        itemId: `item_${Date.now()}`,
        productId,
        quantity,
        price: product.price,
        addedDate: new Date(),
      });
    }

    cart.updatedDate = new Date();

    this.emit("cart:item-added", {
      userId,
      productId,
      quantity,
      cartTotal: this.calculateCartTotal(cart),
    });
  }

  // Remove from cart
  removeFromCart(userId: string, productId: string): void {
    const cart = this.carts.get(userId);
    if (!cart) return;

    const index = cart.items.findIndex((item) => item.productId === productId);
    if (index > -1) {
      cart.items.splice(index, 1);
      cart.updatedDate = new Date();

      this.emit("cart:item-removed", {
        userId,
        productId,
        cartTotal: this.calculateCartTotal(cart),
      });
    }
  }

  // Get cart
  getCart(userId: string): Cart | undefined {
    return this.carts.get(userId);
  }

  private calculateCartTotal(cart: Cart): number {
    return cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
  }

  // Checkout
  checkout(userId: string): { transactionIds: string[]; totalAmount: number } {
    const cart = this.carts.get(userId);
    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    const transactionIds: string[] = [];
    let totalAmount = 0;

    for (const item of cart.items) {
      const product = this.products.get(item.productId);
      if (!product) continue;

      const unitPrice = product.price;
      const totalPrice = unitPrice * item.quantity;
      const tax = totalPrice * 0.1; // 10% tax
      const platformFee = totalPrice * 0.05; // 5% platform fee
      const sellerEarnings = totalPrice - tax - platformFee;

      const transaction: MarketplaceTransaction = {
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId: item.productId,
        buyerId: userId,
        sellerId: product.sellerId,
        quantity: item.quantity,
        unitPrice,
        totalAmount: totalPrice,
        tax,
        platformFee,
        sellerEarnings,
        status: "completed",
        transactionDate: new Date(),
      };

      transactionIds.push(transaction.transactionId);
      totalAmount += totalPrice;

      // Record transaction
      const transactions = this.transactions.get(product.sellerId) || [];
      transactions.push(transaction);
      this.transactions.set(product.sellerId, transactions);

      // Update product quantity and sales
      product.quantity -= item.quantity;
      product.salesCount++;

      if (product.quantity === 0) {
        product.status = "sold-out";
      }

      this.emit("product:sold", {
        productId: item.productId,
        quantity: item.quantity,
        amount: totalPrice,
      });
    }

    // Clear cart
    this.carts.delete(userId);

    this.emit("checkout:completed", {
      userId,
      transactionCount: transactionIds.length,
      totalAmount,
    });

    return { transactionIds, totalAmount };
  }

  // Add review
  addReview(
    productId: string,
    buyerId: string,
    buyerName: string,
    rating: number,
    text: string,
  ): void {
    const product = this.products.get(productId);
    if (!product) return;

    const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const review: MarketplaceReview = {
      reviewId,
      productId,
      buyerId,
      buyerName,
      rating,
      text,
      helpfulCount: 0,
      createdDate: new Date(),
    };

    const reviews = this.reviews.get(productId) || [];
    reviews.push(review);
    this.reviews.set(productId, reviews);

    // Update product rating
    const totalRating = product.rating * product.ratingCount + rating;
    product.ratingCount++;
    product.rating = totalRating / product.ratingCount;

    this.emit("review:added", {
      reviewId,
      productId,
      rating,
      buyerName,
    });
  }

  // Get product reviews
  getProductReviews(productId: string): MarketplaceReview[] {
    return this.reviews.get(productId) || [];
  }

  // Add to wishlist
  addToWishlist(userId: string, productId: string): void {
    let wishlist = this.wishlists.get(userId);

    if (!wishlist) {
      const wishlistId = `wishlist_${Date.now()}`;
      wishlist = {
        wishlistId,
        userId,
        items: [],
        createdDate: new Date(),
      };
      this.wishlists.set(userId, wishlist);
    }

    if (!wishlist.items.includes(productId)) {
      wishlist.items.push(productId);

      this.emit("wishlist:item-added", {
        userId,
        productId,
        totalItems: wishlist.items.length,
      });
    }
  }

  // Get wishlist
  getWishlist(userId: string): MarketplaceProduct[] {
    const wishlist = this.wishlists.get(userId);
    if (!wishlist) return [];

    return wishlist.items
      .map((id) => this.products.get(id))
      .filter((p) => p !== undefined) as MarketplaceProduct[];
  }

  // Get seller sales
  getSellerSales(sellerId: string): {
    totalSales: number;
    totalEarnings: number;
    transactionCount: number;
  } {
    const transactions = this.transactions.get(sellerId) || [];

    return {
      totalSales: transactions.length,
      totalEarnings: transactions.reduce((sum, t) => sum + t.sellerEarnings, 0),
      transactionCount: transactions.filter((t) => t.status === "completed")
        .length,
    };
  }

  // Get product
  getProduct(productId: string): MarketplaceProduct | undefined {
    return this.products.get(productId);
  }
}

export const marketplaceService = new MarketplaceService();

export default MarketplaceService;
