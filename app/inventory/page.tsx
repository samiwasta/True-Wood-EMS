'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InventorySearch } from '@/components/inventory/inventory-search'
import { MaterialsTab } from '@/components/inventory/materials-tab'
import { VendorsTab } from '@/components/inventory/vendors-tab'
import { VendorMaterialsTab } from '@/components/inventory/vendor-materials-tab'
import { Search, Package, Building2, Link2 } from 'lucide-react'

export default function InventoryPage() {
  return (
    <div className="flex flex-col gap-6 min-w-0">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
        <p className="text-gray-500">
          Compare vendor prices and manage materials, vendors, and mappings
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <Tabs defaultValue="search" className="w-full">
          <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4">
            <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span>Search</span>
              </TabsTrigger>
              <TabsTrigger value="items" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>Items</span>
              </TabsTrigger>
              <TabsTrigger value="vendors" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>Vendors</span>
              </TabsTrigger>
              <TabsTrigger value="mapping" className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                <span>Vendor Mapping</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="search" className="mt-0">
              <InventorySearch />
            </TabsContent>
            <TabsContent value="items" className="mt-0">
              <MaterialsTab />
            </TabsContent>
            <TabsContent value="vendors" className="mt-0">
              <VendorsTab />
            </TabsContent>
            <TabsContent value="mapping" className="mt-0">
              <VendorMaterialsTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
