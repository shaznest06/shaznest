-- Sample catalogue so the storefront and checkout work on day one.
-- Replace or edit these in the admin portal once it is running.
INSERT OR IGNORE INTO products (id, title, slug, price, compare_at_price, category, stock, images_json, variants_json, description, active) VALUES
('shaz-01','Midnight Onyx Pure Silk Hijab','midnight-onyx-pure-silk-hijab',1299,1699,'hijabs',15,
 '[{"src":"/assets/img/products/midnight-onyx-silk-hijab.svg","alt":"Illustrated Midnight Onyx Pure Silk Hijab","colour":"Midnight Onyx"}]',
 '[{"color":"Midnight Onyx","fabricType":"Pure silk","size":"One size"}]',
 'Luxurious lightweight pure silk hijab in deep midnight onyx.',1),
('shaz-02','Emerald Velvet Occasion Hijab','emerald-velvet-occasion-hijab',1499,1899,'hijabs',12,
 '[{"src":"/assets/img/products/emerald-velvet-occasion-hijab.svg","alt":"Illustrated Emerald Velvet Occasion Hijab","colour":"Emerald Velvet"}]',
 '[{"color":"Emerald Velvet","fabricType":"Velvet","size":"One size"}]',
 'Rich emerald velvet finish, perfect for evening wear and special occasions.',1),
('shaz-03','Champagne Silk Shimmer Hijab','champagne-silk-shimmer-hijab',1399,1799,'hijabs',10,
 '[{"src":"/assets/img/products/champagne-silk-shimmer-hijab.svg","alt":"Illustrated Champagne Silk Shimmer Hijab","colour":"Champagne"}]',
 '[{"color":"Champagne","fabricType":"Pure silk","size":"One size"}]',
 'Subtle shimmering champagne pure silk hijab designed for refined elegance.',1);
