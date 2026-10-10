// Central configuration. When the backend is ready, point the endpoints at the
// real API and switch the feature flags on — no component code needs to change.
export const CONFIG = {
  siteUrl: "https://shaznest.com",
  brand: "ShaZ Nest",
  tagline: "From Our Nest To Yours",
  instagram: { handle: "@shaz.nest", url: "https://www.instagram.com/shaz.nest/" },

  api: {
    // Public catalogue from the database (falls back to the bundled list if unreachable).
    products: "/api/v1/products",
    createOrder: "/api/v1/orders",
    orderTracking: (orderNumber) => `/api/v1/orders/${encodeURIComponent(orderNumber)}/tracking`,
  },

  features: {
    // Needs RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET set on the server.
    onlinePayment: true,
    orderTracking: true,
  },
};

export const CATEGORIES = [
  { slug: "hijabs", name: "Hijabs" },
  { slug: "accessories", name: "Accessories" },
];

export const categoryName = (slug) => CATEGORIES.find((c) => c.slug === slug)?.name || "";
