-- Function to seed default products for a new business
-- This will be called after business creation

CREATE OR REPLACE FUNCTION public.seed_default_products(p_business_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ac_id UUID;
  v_heat_pump_id UUID;
  v_furnace_id UUID;
  v_ac_coil_id UUID;
  v_mini_split_id UUID;
  v_dual_fuel_id UUID;
  v_water_heater_id UUID;
  v_package_unit_id UUID;
  v_tune_up_id UUID;
BEGIN
  -- Insert default HVAC products
  INSERT INTO public.products (business_id, name, slug, category, description, icon, capacity_unit, sort_order)
  VALUES 
    (p_business_id, 'Air Conditioner', 'air-conditioner', 'hvac', 'Central air conditioning system', 'Snowflake', 'ton', 1)
  RETURNING id INTO v_ac_id;
  
  INSERT INTO public.products (business_id, name, slug, category, description, icon, capacity_unit, sort_order)
  VALUES 
    (p_business_id, 'Heat Pump', 'heat-pump', 'hvac', 'Heating and cooling heat pump system', 'ThermometerSun', 'ton', 2)
  RETURNING id INTO v_heat_pump_id;
  
  INSERT INTO public.products (business_id, name, slug, category, description, icon, capacity_unit, sort_order)
  VALUES 
    (p_business_id, 'Furnace', 'furnace', 'hvac', 'Gas or electric furnace', 'Flame', 'btu', 3)
  RETURNING id INTO v_furnace_id;
  
  INSERT INTO public.products (business_id, name, slug, category, description, icon, capacity_unit, sort_order)
  VALUES 
    (p_business_id, 'AC + Coil', 'ac-coil', 'hvac', 'Air conditioner with evaporator coil', 'AirVent', 'ton', 4)
  RETURNING id INTO v_ac_coil_id;
  
  INSERT INTO public.products (business_id, name, slug, category, description, icon, capacity_unit, sort_order)
  VALUES 
    (p_business_id, 'Mini Split', 'mini-split', 'hvac', 'Ductless mini split system', 'Wind', 'ton', 5)
  RETURNING id INTO v_mini_split_id;
  
  INSERT INTO public.products (business_id, name, slug, category, description, icon, capacity_unit, sort_order)
  VALUES 
    (p_business_id, 'Dual Fuel', 'dual-fuel', 'hvac', 'Heat pump with gas furnace backup', 'Zap', 'ton', 6)
  RETURNING id INTO v_dual_fuel_id;
  
  INSERT INTO public.products (business_id, name, slug, category, description, icon, capacity_unit, sort_order)
  VALUES 
    (p_business_id, 'Water Heater', 'water-heater', 'hvac', 'Tank or tankless water heater', 'Droplets', 'none', 7)
  RETURNING id INTO v_water_heater_id;
  
  INSERT INTO public.products (business_id, name, slug, category, description, icon, capacity_unit, sort_order)
  VALUES 
    (p_business_id, 'Package Unit', 'package-unit', 'hvac', 'All-in-one rooftop package unit', 'Package', 'ton', 8)
  RETURNING id INTO v_package_unit_id;
  
  INSERT INTO public.products (business_id, name, slug, category, description, icon, capacity_unit, sort_order)
  VALUES 
    (p_business_id, 'Tune-Up', 'tune-up', 'service', 'HVAC maintenance and tune-up service', 'Wrench', 'none', 9)
  RETURNING id INTO v_tune_up_id;

  -- Seed sample pricing tiers for Air Conditioner
  INSERT INTO public.pricing_tiers (product_id, tier, capacity_value, price, brand, warranty_years, warranty_description)
  VALUES
    (v_ac_id, 'good', 2, 4500, 'Goodman', 5, '5-year parts warranty'),
    (v_ac_id, 'good', 2.5, 4800, 'Goodman', 5, '5-year parts warranty'),
    (v_ac_id, 'good', 3, 5200, 'Goodman', 5, '5-year parts warranty'),
    (v_ac_id, 'good', 3.5, 5600, 'Goodman', 5, '5-year parts warranty'),
    (v_ac_id, 'good', 4, 6000, 'Goodman', 5, '5-year parts warranty'),
    (v_ac_id, 'good', 5, 6800, 'Goodman', 5, '5-year parts warranty'),
    (v_ac_id, 'better', 2, 5500, 'Carrier', 10, '10-year parts & labor warranty'),
    (v_ac_id, 'better', 2.5, 5900, 'Carrier', 10, '10-year parts & labor warranty'),
    (v_ac_id, 'better', 3, 6400, 'Carrier', 10, '10-year parts & labor warranty'),
    (v_ac_id, 'better', 3.5, 6900, 'Carrier', 10, '10-year parts & labor warranty'),
    (v_ac_id, 'better', 4, 7400, 'Carrier', 10, '10-year parts & labor warranty'),
    (v_ac_id, 'better', 5, 8400, 'Carrier', 10, '10-year parts & labor warranty'),
    (v_ac_id, 'best', 2, 7000, 'Trane', 12, '12-year comprehensive warranty'),
    (v_ac_id, 'best', 2.5, 7500, 'Trane', 12, '12-year comprehensive warranty'),
    (v_ac_id, 'best', 3, 8200, 'Trane', 12, '12-year comprehensive warranty'),
    (v_ac_id, 'best', 3.5, 8900, 'Trane', 12, '12-year comprehensive warranty'),
    (v_ac_id, 'best', 4, 9600, 'Trane', 12, '12-year comprehensive warranty'),
    (v_ac_id, 'best', 5, 11000, 'Trane', 12, '12-year comprehensive warranty');

  -- Seed sample pricing for Tune-Up (no capacity)
  INSERT INTO public.pricing_tiers (product_id, tier, capacity_value, price, warranty_description)
  VALUES
    (v_tune_up_id, 'good', NULL, 89, 'Basic inspection and cleaning'),
    (v_tune_up_id, 'better', NULL, 149, 'Full tune-up with filter replacement'),
    (v_tune_up_id, 'best', NULL, 249, 'Premium service with duct inspection');

END;
$$;
