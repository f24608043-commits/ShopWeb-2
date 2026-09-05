-- Create Order RPC Function for Atomic Transaction
CREATE OR REPLACE FUNCTION create_order(
  p_user_id UUID,
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_phone TEXT,
  p_address TEXT,
  p_city TEXT,
  p_province TEXT,
  p_postal_code TEXT,
  p_coupon_code TEXT,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_id UUID;
  v_subtotal DECIMAL;
  v_discount DECIMAL := 0;
  v_applied_coupon_id UUID;
  v_final_total DECIMAL;
  v_order_item RECORD;
  v_product RECORD;
  v_variation RECORD;
  v_unit_price DECIMAL;
  v_current_stock INTEGER;
  v_variation_sku TEXT;
  v_selected_options JSONB;
  v_total_price DECIMAL;
  v_item_index INTEGER := 0;
  v_coupon RECORD;
BEGIN
  -- Initialize subtotal
  v_subtotal := 0;
  
  -- Validate and process each item
  FOR v_order_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_item_index := v_item_index + 1;
    
    -- Get product
    SELECT * INTO v_product 
    FROM products 
    WHERE id = (v_order_item->>'productId')::UUID;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % is no longer available.', (v_order_item->>'productId');
    END IF;
    
    -- Set default values
    v_unit_price := v_product.base_price;
    v_current_stock := COALESCE(v_product.stock, 0);
    v_variation_sku := NULL;
    v_selected_options := NULL;
    
    -- Handle variable products
    IF v_product.product_type = 'VARIABLE' AND (v_order_item->>'variationId') IS NOT NULL THEN
      SELECT * INTO v_variation
      FROM product_variations pv
      JOIN product_variation_values pvv ON pv.id = pvv.variation_id
      JOIN product_option_values pov ON pvv.option_value_id = pov.id
      JOIN product_options po ON pov.option_id = po.id
      WHERE pv.id = (v_order_item->>'variationId')::UUID;
      
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Selected variation for product % is unavailable.', v_product.name;
      END IF;
      
      v_unit_price := v_variation.price;
      v_current_stock := v_variation.stock;
      v_variation_sku := v_variation.sku;
      
      -- Build selected options JSON
      SELECT jsonb_agg(jsonb_build_object(
        'option', po.name,
        'value', pov.value
      )) INTO v_selected_options
      FROM product_variations pv
      JOIN product_variation_values pvv ON pv.id = pvv.variation_id
      JOIN product_option_values pov ON pvv.option_value_id = pov.id
      JOIN product_options po ON pov.option_id = po.id
      WHERE pv.id = (v_order_item->>'variationId')::UUID;
      
      -- Check stock
      IF v_current_stock < (v_order_item->>'quantity')::INTEGER THEN
        RAISE EXCEPTION 'Insufficient stock for %. Available: %, Requested: %',
          v_product.name, v_current_stock, (v_order_item->>'quantity')::INTEGER;
      END IF;
      
      -- Decrease variation stock
      UPDATE product_variations
      SET stock = stock - (v_order_item->>'quantity')::INTEGER
      WHERE id = (v_order_item->>'variationId')::UUID;
    ELSE
      -- Check stock for simple product
      IF v_current_stock < (v_order_item->>'quantity')::INTEGER THEN
        RAISE EXCEPTION 'Insufficient stock for %. Available: %, Requested: %',
          v_product.name, v_current_stock, (v_order_item->>'quantity')::INTEGER;
      END IF;
      
      -- Decrease product stock
      UPDATE products
      SET stock = stock - (v_order_item->>'quantity')::INTEGER
      WHERE id = v_product.id;
    END IF;
    
    -- Calculate item total
    v_total_price := v_unit_price * (v_order_item->>'quantity')::INTEGER;
    v_subtotal := v_subtotal + v_total_price;
  END LOOP;
  
  -- Validate coupon if provided
  IF p_coupon_code IS NOT NULL THEN
    SELECT * INTO v_coupon
    FROM coupons
    WHERE code = UPPER(p_coupon_code)
      AND active = true;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid or inactive coupon code.';
    END IF;
    
    IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN
      RAISE EXCEPTION 'Coupon has expired.';
    END IF;
    
    IF v_coupon.usage_limit IS NOT NULL AND v_coupon.used_count >= v_coupon.usage_limit THEN
      RAISE EXCEPTION 'Coupon usage limit reached.';
    END IF;
    
    IF v_subtotal < COALESCE(v_coupon.min_order_value, 0) THEN
      RAISE EXCEPTION 'Minimum order value of % required for coupon.', v_coupon.min_order_value;
    END IF;
    
    -- Calculate discount
    IF v_coupon.discount_type = 'PERCENTAGE' THEN
      v_discount := (v_subtotal * v_coupon.discount_value) / 100;
    ELSE
      v_discount := LEAST(v_coupon.discount_value, v_subtotal);
    END IF;
    
    v_applied_coupon_id := v_coupon.id;
    
    -- Increment coupon usage
    UPDATE coupons
    SET used_count = used_count + 1
    WHERE id = v_coupon.id;
  END IF;
  
  -- Calculate final total
  v_final_total := GREATEST(0, v_subtotal - v_discount);
  
  -- Create order
  INSERT INTO orders (
    user_id, status, subtotal, discount, total,
    customer_name, customer_email, phone, address,
    city, province, postal_code, coupon_id
  ) VALUES (
    p_user_id, 'PENDING', v_subtotal, v_discount, v_final_total,
    p_customer_name, p_customer_email, p_phone, p_address,
    p_city, p_province, p_postal_code, v_applied_coupon_id
  ) RETURNING id INTO v_order_id;
  
  -- Create order items
  v_item_index := 0;
  FOR v_order_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_item_index := v_item_index + 1;
    
    -- Get product details again for the item
    SELECT * INTO v_product 
    FROM products 
    WHERE id = (v_order_item->>'productId')::UUID;
    
    -- Get variation details if applicable
    IF v_product.product_type = 'VARIABLE' AND (v_order_item->>'variationId') IS NOT NULL THEN
      SELECT sku INTO v_variation_sku
      FROM product_variations
      WHERE id = (v_order_item->>'variationId')::UUID;
      
      -- Get selected options
      SELECT jsonb_agg(jsonb_build_object(
        'option', po.name,
        'value', pov.value
      )) INTO v_selected_options
      FROM product_variations pv
      JOIN product_variation_values pvv ON pv.id = pvv.variation_id
      JOIN product_option_values pov ON pvv.option_value_id = pov.id
      JOIN product_options po ON pov.option_id = po.id
      WHERE pv.id = (v_order_item->>'variationId')::UUID;
      
      v_unit_price := (SELECT price FROM product_variations WHERE id = (v_order_item->>'variationId')::UUID);
    ELSE
      v_unit_price := v_product.base_price;
    END IF;
    
    v_total_price := v_unit_price * (v_order_item->>'quantity')::INTEGER;
    
    INSERT INTO order_items (
      order_id, product_id, product_name, product_slug,
      variation_id, variation_sku, quantity, unit_price,
      total_price, selected_options
    ) VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.slug,
      (v_order_item->>'variationId')::UUID,
      v_variation_sku,
      (v_order_item->>'quantity')::INTEGER,
      v_unit_price,
      v_total_price,
      v_selected_options
    );
  END LOOP;
  
  -- Return the complete order
  RETURN (
    SELECT jsonb_build_object(
      'id', o.id,
      'user_id', o.user_id,
      'status', o.status,
      'subtotal', o.subtotal,
      'discount', o.discount,
      'total', o.total,
      'customer_name', o.customer_name,
      'customer_email', o.customer_email,
      'phone', o.phone,
      'address', o.address,
      'city', o.city,
      'province', o.province,
      'postal_code', o.postal_code,
      'coupon_id', o.coupon_id,
      'created_at', o.created_at,
      'updated_at', o.updated_at,
      'items', (
        SELECT jsonb_agg(jsonb_build_object(
          'id', oi.id,
          'product_id', oi.product_id,
          'product_name', oi.product_name,
          'product_slug', oi.product_slug,
          'variation_id', oi.variation_id,
          'variation_sku', oi.variation_sku,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'total_price', oi.total_price,
          'selected_options', oi.selected_options
        ))
        FROM order_items oi
        WHERE oi.order_id = o.id
      )
    )
    FROM orders o
    WHERE o.id = v_order_id
  );
END;
$$;
