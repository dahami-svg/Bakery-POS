'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FileSpreadsheet, Package, PencilLine, Plus, ShieldAlert, Trash2, Upload, X } from 'lucide-react';
import { useTenant } from '@/context/TenantContext';
import * as XLSX from 'xlsx';
import { mapProductImportRows } from '@/lib/excel-import';

type ProductFormState = {
  id: string | null;
  name: string;
  category: string;
  price: string;
  unit: string;
  image: string;
};

const emptyProductForm: ProductFormState = {
  id: null,
  name: '',
  category: '',
  price: '',
  unit: '',
  image: '',
};

export default function CatalogPage() {
  const { activeTenant, loading: tenantLoading } = useTenant();
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [importingProducts, setImportingProducts] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productModalMode, setProductModalMode] = useState<'form' | 'import'>('form');
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [productFeedback, setProductFeedback] = useState('');
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const fetchProducts = async (tenantId: string) => {
    setProductsLoading(true);
    try {
      const res = await fetch(`/api/products?tenantId=${tenantId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setProducts(data.data);
      } else {
        setProducts([]);
      }
    } catch {
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    setProductFeedback('');
    setProductForm(emptyProductForm);
    setIsProductModalOpen(false);
    if (activeTenant?._id) {
      fetchProducts(activeTenant._id);
    } else {
      setProducts([]);
    }
  }, [activeTenant?._id]);

  const updateProductForm = (field: keyof ProductFormState, value: string) => {
    setProductForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetProductForm = () => {
    setProductForm(emptyProductForm);
  };

  const openCreateProductModal = () => {
    setProductFeedback('');
    resetProductForm();
    setProductModalMode('form');
    setIsProductModalOpen(true);
  };

  const openImportProductsModal = () => {
    setProductFeedback('');
    setProductModalMode('import');
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (product: any) => {
    setProductFeedback('');
    setProductForm({
      id: product._id,
      name: product.name,
      category: product.category,
      price: String(product.price),
      unit: product.unit,
      image: product.image,
    });
    setProductModalMode('form');
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    if (productSubmitting || importingProducts) return;
    setIsProductModalOpen(false);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeTenant?._id) {
      setProductFeedback('Select a shop before managing products.');
      return;
    }

    if (
      !productForm.name.trim() ||
      !productForm.category.trim() ||
      !productForm.unit.trim() ||
      !productForm.image.trim() ||
      productForm.price === ''
    ) {
      setProductFeedback('Complete all product fields before saving.');
      return;
    }

    setProductSubmitting(true);
    setProductFeedback('');

    try {
      const payload = {
        tenantId: activeTenant._id,
        name: productForm.name.trim(),
        category: productForm.category.trim(),
        unit: productForm.unit.trim(),
        image: productForm.image.trim(),
        price: Number(productForm.price),
      };

      const res = await fetch('/api/products', {
        method: productForm.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm.id ? { ...payload, id: productForm.id } : payload),
      });

      const data = await res.json();
      if (data.success) {
        await fetchProducts(activeTenant._id);
        setProductFeedback(productForm.id ? 'Product updated successfully.' : 'Product created successfully.');
        resetProductForm();
        setIsProductModalOpen(false);
      } else {
        setProductFeedback(data.message || 'Could not save product.');
      }
    } catch {
      setProductFeedback('Network error while saving product.');
    } finally {
      setProductSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!activeTenant?._id) return;
    if (!confirm('Delete this product from the catalog?')) {
      return;
    }

    try {
      const res = await fetch(`/api/products?id=${productId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await fetchProducts(activeTenant._id);
        if (productForm.id === productId) {
          resetProductForm();
        }
        setProductFeedback('Product deleted successfully.');
      } else {
        setProductFeedback(data.message || 'Could not delete product.');
      }
    } catch {
      setProductFeedback('Network error while deleting product.');
    }
  };

  const handleImportProducts = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeTenant?._id) return;

    setImportingProducts(true);
    setProductFeedback('');

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });
      const rows = mapProductImportRows(rawRows);

      if (rows.length === 0) {
        throw new Error('No valid product rows were found in the Excel sheet.');
      }

      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenant._id,
          rows,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setProductFeedback(data.message || 'Products imported successfully.');
        await fetchProducts(activeTenant._id);
        setIsProductModalOpen(false);
      } else {
        setProductFeedback(data.message || 'Could not import products.');
      }
    } catch (error: any) {
      setProductFeedback(error.message || 'Failed to import the Excel file.');
    } finally {
      e.target.value = '';
      setImportingProducts(false);
    }
  };

  if (tenantLoading || (activeTenant && productsLoading)) {
    return (
      <div className="flex items-center justify-center h-full bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Loading Catalog...</p>
        </div>
      </div>
    );
  }

  if (!activeTenant) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-surface text-center p-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
          <Package size={36} />
        </div>
        <h1 className="text-2xl font-black text-on-surface">No Shop Selected</h1>
        <p className="text-on-surface-variant text-sm mt-2 max-w-md">
          Please select or provision a shop environment first.
        </p>
        <Link href="/super-admin" className="mt-6 px-5 py-2.5 bg-primary text-on-primary rounded-lg text-xs font-bold active:scale-95 transition-all">
          Super Admin Console
        </Link>
      </div>
    );
  }

  if (!activeTenant.enabledModules.includes('pos')) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-surface text-center p-8">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center text-error mb-4">
          <ShieldAlert size={36} />
        </div>
        <h1 className="text-2xl font-black text-on-surface">POS Module Disabled</h1>
        <p className="text-on-surface-variant text-sm mt-2 max-w-md">
          The product catalog is currently tied to POS, and POS is not enabled for{' '}
          <span className="font-bold text-on-surface">{activeTenant.name}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface overflow-y-auto scrollbar-hide">
      <div className="p-4 lg:p-8 mx-auto w-full space-y-4 lg:space-y-6">
        {productFeedback && (
          <div className="rounded-xl border border-outline-variant bg-surface-container px-4 py-3 text-sm text-on-surface-variant">
            {productFeedback}
          </div>
        )}

        <section className="bg-surface-container p-4 lg:p-6 rounded-xl border border-outline-variant space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <h1 className="text-lg font-bold text-on-surface">Catalog Products</h1>
              <p className="text-sm text-on-surface-variant">
                Manage what appears in POS while keeping create and import actions tucked into popup flows.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={openImportProductsModal}
                className="inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-xs font-bold text-on-surface hover:bg-surface-container-high"
              >
                <Upload size={14} />
                Import Excel
              </button>
              <button
                type="button"
                onClick={openCreateProductModal}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black tracking-wider text-on-primary hover:opacity-90 active:scale-95 transition-all"
              >
                <Plus size={14} />
                Add Product
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">All products available for checkout and item selection.</span>
            <span className="text-[10px] font-bold uppercase text-on-surface-variant">{products.length} items</span>
          </div>

          <div className="space-y-3 max-h-[50vh] lg:max-h-[70vh] overflow-y-auto scrollbar-hide">
            {productsLoading && (
              <p className="text-xs text-on-surface-variant">Loading product catalog...</p>
            )}

            {!productsLoading &&
              products.map((product) => (
                <div
                  key={product._id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-outline-variant bg-surface-container-low"
                >
                  <img src={product.image} alt={product.name} className="size-12 lg:size-14 rounded-lg object-cover bg-surface shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">{product.name}</p>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant">
                      {product.category} · {product.unit}
                    </p>
                    <p className="text-xs font-semibold text-primary mt-1">Rs. {Number(product.price).toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="size-9 rounded-lg border border-outline-variant text-on-surface-variant hover:text-primary hover:bg-surface-container-high flex items-center justify-center cursor-pointer"
                    >
                      <PencilLine size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product._id)}
                      className="size-9 rounded-lg border border-outline-variant text-on-surface-variant hover:text-error hover:bg-error/10 flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}

            {!productsLoading && products.length === 0 && (
              <div className="text-center py-8 rounded-lg border border-dashed border-outline-variant text-xs text-on-surface-variant">
                No products yet for this tenant. Add a few so the POS has something to sell.
              </div>
            )}
          </div>
        </section>
      </div>

      {isProductModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl border border-outline-variant bg-surface-container shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 rounded-t-3xl border-b border-outline-variant bg-surface-container px-6 py-5">
              <div>
                <div className="flex items-center gap-3 text-primary">
                  {productModalMode === 'form' ? <Package size={20} /> : <FileSpreadsheet size={20} />}
                  <h3 className="text-xl font-bold text-on-surface">
                    {productModalMode === 'form'
                      ? productForm.id
                        ? 'Edit Product'
                        : 'Add Product'
                      : 'Import Products from Excel'}
                  </h3>
                </div>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {productModalMode === 'form'
                    ? 'Add the product details once and it becomes available in the POS immediately.'
                    : 'Upload one Excel sheet and bulk-create products for this shop.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeProductModal}
                disabled={productSubmitting || importingProducts}
                className="rounded-xl border border-outline-variant p-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setProductModalMode('form')}
                  className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors ${
                    productModalMode === 'form'
                      ? 'bg-primary text-on-primary'
                      : 'border border-outline-variant bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Add Product
                </button>
                <button
                  type="button"
                  onClick={() => setProductModalMode('import')}
                  className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors ${
                    productModalMode === 'import'
                      ? 'bg-primary text-on-primary'
                      : 'border border-outline-variant bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Import Excel
                </button>
              </div>

              {productModalMode === 'import' ? (
                <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5 space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <FileSpreadsheet size={16} />
                    <p className="text-xs font-black uppercase tracking-wider text-on-surface">Excel Import</p>
                  </div>
                  <p className="text-sm leading-relaxed text-on-surface-variant">
                    First sheet columns: <strong>name</strong>, <strong>category</strong>, <strong>price</strong>, <strong>unit</strong>, optional <strong>image</strong>.
                  </p>
                  <input
                    ref={importInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImportProducts}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => importInputRef.current?.click()}
                    disabled={importingProducts}
                    className="inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-surface px-4 py-3 text-sm font-bold text-on-surface hover:bg-surface-container-high disabled:opacity-50"
                  >
                    <Upload size={16} />
                    {importingProducts ? 'Importing...' : 'Choose Excel File'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitProduct} className="space-y-5">
                  <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.3fr)_320px] gap-5">
                    <div className="space-y-5">
                      <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4 lg:p-5 space-y-4">
                        <div className="space-y-1">
                          <p className="text-xs font-black uppercase tracking-widest text-on-surface">Basic Details</p>
                          <p className="text-xs text-on-surface-variant">Use simple names and categories so staff can find items quickly at the counter.</p>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-on-surface-variant">Product Name</label>
                          <input
                            type="text"
                            value={productForm.name}
                            onChange={(e) => updateProductForm('name', e.target.value)}
                            placeholder="e.g. Butter Croissant"
                            className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-on-surface-variant">Category</label>
                            <input
                              type="text"
                              value={productForm.category}
                              onChange={(e) => updateProductForm('category', e.target.value)}
                              placeholder="Pastries"
                              className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-on-surface-variant">Unit</label>
                            <input
                              type="text"
                              value={productForm.unit}
                              onChange={(e) => updateProductForm('unit', e.target.value)}
                              placeholder="each"
                              className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4 lg:p-5 space-y-4">
                        <div className="space-y-1">
                          <p className="text-xs font-black uppercase tracking-widest text-on-surface">Selling Details</p>
                          <p className="text-xs text-on-surface-variant">Add a price and image so the product looks complete in the POS product grid.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-on-surface-variant">Price</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={productForm.price}
                              onChange={(e) => updateProductForm('price', e.target.value)}
                              placeholder="450.00"
                              className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-on-surface-variant">Image URL</label>
                            <input
                              type="text"
                              value={productForm.image}
                              onChange={(e) => updateProductForm('image', e.target.value)}
                              placeholder="https://..."
                              className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4 lg:p-5 space-y-4 h-fit">
                      <div className="flex items-center gap-3">
                        <div className="size-11 rounded-2xl bg-primary/12 flex items-center justify-center text-primary shrink-0">
                          <Package size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-on-surface">Live Preview</p>
                          <p className="text-xs text-on-surface-variant">This is how the item reads at a glance.</p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-outline-variant bg-surface p-4 space-y-4">
                        {productForm.image.trim() ? (
                          <img
                            src={productForm.image}
                            alt={productForm.name || 'Product preview'}
                            className="h-36 w-full rounded-xl object-cover bg-surface-container-low"
                          />
                        ) : (
                          <div className="h-36 w-full rounded-xl border border-dashed border-outline-variant bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                            <Package size={24} />
                          </div>
                        )}

                        <div className="space-y-1">
                          <p className="text-base font-bold text-on-surface truncate">
                            {productForm.name.trim() || 'Product name preview'}
                          </p>
                          <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">
                            {(productForm.category.trim() || 'Category')} · {(productForm.unit.trim() || 'Unit')}
                          </p>
                          <p className="text-sm font-black text-primary">
                            Rs. {productForm.price !== '' ? Number(productForm.price || 0).toFixed(2) : '0.00'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    <button
                      type="submit"
                      disabled={productSubmitting}
                      className="bg-primary text-on-primary px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {productSubmitting ? 'Saving...' : productForm.id ? 'Update Product' : 'Create Product'}
                    </button>
                    {productForm.id && (
                      <button
                        type="button"
                        onClick={() => {
                          resetProductForm();
                          setProductModalMode('form');
                        }}
                        className="px-5 py-3 rounded-xl border border-outline-variant text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                      >
                        Cancel Editing
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
