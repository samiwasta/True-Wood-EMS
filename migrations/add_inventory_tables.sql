-- Inventory: materials, vendors, and vendor–material pricing

CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT,
  description TEXT,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT materials_name_unique UNIQUE (name)
);

COMMENT ON TABLE materials IS 'Catalog of inventory materials / items';
COMMENT ON COLUMN materials.name IS 'Material display name';
COMMENT ON COLUMN materials.unit IS 'Unit of measure (e.g. kg, pcs, m)';
COMMENT ON COLUMN materials.photo_url IS 'Public URL of the material photo in storage';
COMMENT ON COLUMN materials.is_active IS 'Whether the material is available for search and mapping';

CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT vendors_name_unique UNIQUE (name)
);

COMMENT ON TABLE vendors IS 'Suppliers / vendors for inventory materials';
COMMENT ON COLUMN vendors.name IS 'Vendor display name';
COMMENT ON COLUMN vendors.is_active IS 'Whether the vendor is available for search and mapping';

CREATE TABLE IF NOT EXISTS vendor_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
  gst_percent NUMERIC DEFAULT 0 CHECK (gst_percent >= 0),
  transportation_cost NUMERIC DEFAULT 0 CHECK (transportation_cost >= 0),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT vendor_materials_vendor_material_unique UNIQUE (vendor_id, material_id)
);

COMMENT ON TABLE vendor_materials IS 'Vendor pricing for each material';
COMMENT ON COLUMN vendor_materials.unit_price IS 'Price per unit before GST';
COMMENT ON COLUMN vendor_materials.gst_percent IS 'GST percentage applied on (unit_price * quantity)';
COMMENT ON COLUMN vendor_materials.transportation_cost IS 'Fixed transportation charge per quote';

CREATE INDEX IF NOT EXISTS idx_materials_name ON materials (name);
CREATE INDEX IF NOT EXISTS idx_materials_is_active ON materials (is_active);
CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors (name);
CREATE INDEX IF NOT EXISTS idx_vendors_is_active ON vendors (is_active);
CREATE INDEX IF NOT EXISTS idx_vendor_materials_vendor_id ON vendor_materials (vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_materials_material_id ON vendor_materials (material_id);
CREATE INDEX IF NOT EXISTS idx_vendor_materials_is_active ON vendor_materials (is_active);

CREATE OR REPLACE FUNCTION update_materials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_materials_updated_at ON materials;
CREATE TRIGGER trigger_update_materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW
  EXECUTE FUNCTION update_materials_updated_at();

CREATE OR REPLACE FUNCTION update_vendors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_vendors_updated_at ON vendors;
CREATE TRIGGER trigger_update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_vendors_updated_at();

CREATE OR REPLACE FUNCTION update_vendor_materials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_vendor_materials_updated_at ON vendor_materials;
CREATE TRIGGER trigger_update_vendor_materials_updated_at
  BEFORE UPDATE ON vendor_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_materials_updated_at();

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to materials" ON materials;
CREATE POLICY "Allow public read access to materials"
  ON materials FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public insert access to materials" ON materials;
CREATE POLICY "Allow public insert access to materials"
  ON materials FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to materials" ON materials;
CREATE POLICY "Allow public update access to materials"
  ON materials FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete access to materials" ON materials;
CREATE POLICY "Allow public delete access to materials"
  ON materials FOR DELETE TO public USING (true);

DROP POLICY IF EXISTS "Allow public read access to vendors" ON vendors;
CREATE POLICY "Allow public read access to vendors"
  ON vendors FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public insert access to vendors" ON vendors;
CREATE POLICY "Allow public insert access to vendors"
  ON vendors FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to vendors" ON vendors;
CREATE POLICY "Allow public update access to vendors"
  ON vendors FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete access to vendors" ON vendors;
CREATE POLICY "Allow public delete access to vendors"
  ON vendors FOR DELETE TO public USING (true);

DROP POLICY IF EXISTS "Allow public read access to vendor_materials" ON vendor_materials;
CREATE POLICY "Allow public read access to vendor_materials"
  ON vendor_materials FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public insert access to vendor_materials" ON vendor_materials;
CREATE POLICY "Allow public insert access to vendor_materials"
  ON vendor_materials FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to vendor_materials" ON vendor_materials;
CREATE POLICY "Allow public update access to vendor_materials"
  ON vendor_materials FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete access to vendor_materials" ON vendor_materials;
CREATE POLICY "Allow public delete access to vendor_materials"
  ON vendor_materials FOR DELETE TO public USING (true);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'material-photos',
  'material-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Allow public read material photos" ON storage.objects;
CREATE POLICY "Allow public read material photos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'material-photos');

DROP POLICY IF EXISTS "Allow public upload material photos" ON storage.objects;
CREATE POLICY "Allow public upload material photos"
  ON storage.objects FOR INSERT TO public
  WITH CHECK (bucket_id = 'material-photos');

DROP POLICY IF EXISTS "Allow public update material photos" ON storage.objects;
CREATE POLICY "Allow public update material photos"
  ON storage.objects FOR UPDATE TO public
  USING (bucket_id = 'material-photos')
  WITH CHECK (bucket_id = 'material-photos');

DROP POLICY IF EXISTS "Allow public delete material photos" ON storage.objects;
CREATE POLICY "Allow public delete material photos"
  ON storage.objects FOR DELETE TO public
  USING (bucket_id = 'material-photos');
