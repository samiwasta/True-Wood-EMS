-- Inventory material categories

CREATE TABLE IF NOT EXISTS material_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT material_categories_name_unique UNIQUE (name)
);

COMMENT ON TABLE material_categories IS 'Categories used to group inventory materials';
COMMENT ON COLUMN material_categories.name IS 'Category display name';

ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES material_categories(id) ON DELETE SET NULL;

COMMENT ON COLUMN materials.category_id IS 'Optional category for this material';

CREATE INDEX IF NOT EXISTS idx_material_categories_name ON material_categories (name);
CREATE INDEX IF NOT EXISTS idx_materials_category_id ON materials (category_id);

CREATE OR REPLACE FUNCTION update_material_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_material_categories_updated_at ON material_categories;
CREATE TRIGGER trigger_update_material_categories_updated_at
  BEFORE UPDATE ON material_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_material_categories_updated_at();

ALTER TABLE material_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to material_categories" ON material_categories;
CREATE POLICY "Allow public read access to material_categories"
  ON material_categories FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public insert access to material_categories" ON material_categories;
CREATE POLICY "Allow public insert access to material_categories"
  ON material_categories FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to material_categories" ON material_categories;
CREATE POLICY "Allow public update access to material_categories"
  ON material_categories FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete access to material_categories" ON material_categories;
CREATE POLICY "Allow public delete access to material_categories"
  ON material_categories FOR DELETE TO public USING (true);
