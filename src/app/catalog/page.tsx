'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ChevronLeft, ChevronRight, FileSpreadsheet, Package, PencilLine, Plus, Search, ShieldAlert, Tags, Trash2, Upload, X } from 'lucide-react';
import { useTenant } from '@/context/TenantContext';
import * as XLSX from 'xlsx';
import { mapProductImportRows } from '@/lib/excel-import';

type ProductFormState = {
  id: string | null;
  name: string;
  category: string;
  price: string;
  sku: string;
  barcode: string;
  unit: string;
  image: string;
};

type DiscountFormState = {
  id: string | null;
  title: string;
  mode: 'percentage' | 'fixed_price';
  value: string;
  startsAt: string;
  endsAt: string;
  productIds: string[];
};

const emptyProductForm: ProductFormState = {
  id: null,
  name: '',
  category: '',
  price: '',
  sku: '',
  barcode: '',
  unit: '',
  image: '',
};

const emptyDiscountForm: DiscountFormState = {
  id: null,
  title: '',
  mode: 'percentage',
  value: '',
  startsAt: '',
  endsAt: '',
  productIds: [],
};

export default function CatalogPage() {
  const { activeTenant, loading: tenantLoading } = useTenant();
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [importingProducts, setImportingProducts] = useState(false);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [discountsLoading, setDiscountsLoading] = useState(false);
  const [discountSubmitting, setDiscountSubmitting] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [productModalMode, setProductModalMode] = useState<'form' | 'import'>('form');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productSortKey, setProductSortKey] = useState<'name' | 'category' | 'price'>('name');
  const [productSortDirection, setProductSortDirection] = useState<'asc' | 'desc'>('asc');
  const [productPage, setProductPage] = useState(1);
  const [productPageSize, setProductPageSize] = useState(8);
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [discountForm, setDiscountForm] = useState<DiscountFormState>(emptyDiscountForm);
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

  const fetchDiscounts = async (tenantId: string) => {
    setDiscountsLoading(true);
    try {
      const res = await fetch(`/api/product-discounts?tenantId=${tenantId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setDiscounts(data.data);
      } else {
        setDiscounts([]);
      }
    } catch {
      setDiscounts([]);
    } finally {
      setDiscountsLoading(false);
    }
  };

  useEffect(() => {
    setProductFeedback('');
    setProductForm(emptyProductForm);
    setDiscountForm(emptyDiscountForm);
    setIsProductModalOpen(false);
    setIsDiscountModalOpen(false);
    if (activeTenant?._id) {
      fetchProducts(activeTenant._id);
      fetchDiscounts(activeTenant._id);
    } else {
      setProducts([]);
      setDiscounts([]);
    }
  }, [activeTenant?._id]);

  useEffect(() => {
    setProductPage(1);
  }, [productSearchQuery, productSortKey, productSortDirection, productPageSize]);

  const updateProductForm = (field: keyof ProductFormState, value: string) => {
    setProductForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateDiscountForm = (field: keyof DiscountFormState, value: string | string[]) => {
    setDiscountForm((prev) => ({ ...prev, [field]: value as never }));
  };

  const resetProductForm = () => {
    setProductForm(emptyProductForm);
  };

  const resetDiscountForm = () => {
    setDiscountForm(emptyDiscountForm);
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

  const openCreateDiscountModal = () => {
    setProductFeedback('');
    resetDiscountForm();
    setIsDiscountModalOpen(true);
  };

  const handleEditProduct = (product: any) => {
    setProductFeedback('');
    setProductForm({
      id: product._id,
      name: product.name,
      category: product.category,
      price: String(product.price),
      sku: product.sku || '',
      barcode: product.barcode || '',
      unit: product.unit,
      image: product.image,
    });
    setProductModalMode('form');
    setIsProductModalOpen(true);
  };

  const handleEditDiscount = (discount: any) => {
    setProductFeedback('');
    setDiscountForm({
      id: discount._id,
      title: discount.title,
      mode: discount.mode,
      value: String(discount.value),
      startsAt: new Date(discount.startsAt).toISOString().slice(0, 10),
      endsAt: new Date(discount.endsAt).toISOString().slice(0, 10),
      productIds: Array.isArray(discount.productIds) ? discount.productIds.map((id: any) => String(id)) : [],
    });
    setIsDiscountModalOpen(true);
  };

  const closeProductModal = () => {
    if (productSubmitting || importingProducts) return;
    setIsProductModalOpen(false);
  };

  const closeDiscountModal = () => {
    if (discountSubmitting) return;
    setIsDiscountModalOpen(false);
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
        sku: productForm.sku.trim(),
        barcode: productForm.barcode.trim(),
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

  const handleDiscountProductToggle = (productId: string) => {
    setDiscountForm((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(productId)
        ? prev.productIds.filter((id) => id !== productId)
        : [...prev.productIds, productId],
    }));
  };

  const handleSubmitDiscount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeTenant?._id) {
      setProductFeedback('Select a shop before managing discounts.');
      return;
    }

    if (
      !discountForm.title.trim() ||
      discountForm.value === '' ||
      discountForm.productIds.length === 0 ||
      !discountForm.startsAt ||
      !discountForm.endsAt
    ) {
      setProductFeedback('Complete all discount details before saving.');
      return;
    }

    setDiscountSubmitting(true);
    setProductFeedback('');

    try {
      const payload = {
        tenantId: activeTenant._id,
        title: discountForm.title.trim(),
        mode: discountForm.mode,
        value: Number(discountForm.value),
        startsAt: discountForm.startsAt,
        endsAt: discountForm.endsAt,
        productIds: discountForm.productIds,
      };

      const res = await fetch('/api/product-discounts', {
        method: discountForm.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discountForm.id ? { ...payload, id: discountForm.id } : payload),
      });

      const data = await res.json();
      if (data.success) {
        await Promise.all([fetchProducts(activeTenant._id), fetchDiscounts(activeTenant._id)]);
        setProductFeedback(discountForm.id ? 'Discount updated successfully.' : 'Discount created successfully.');
        resetDiscountForm();
        setIsDiscountModalOpen(false);
      } else {
        setProductFeedback(data.message || 'Could not save discount.');
      }
    } catch {
      setProductFeedback('Network error while saving discount.');
    } finally {
      setDiscountSubmitting(false);
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

  const handleDeleteDiscount = async (discountId: string) => {
    if (!activeTenant?._id) return;
    if (!confirm('Delete this discount?')) {
      return;
    }

    try {
      const res = await fetch(`/api/product-discounts?id=${discountId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await Promise.all([fetchProducts(activeTenant._id), fetchDiscounts(activeTenant._id)]);
        if (discountForm.id === discountId) {
          resetDiscountForm();
        }
        setProductFeedback('Discount deleted successfully.');
      } else {
        setProductFeedback(data.message || 'Could not delete discount.');
      }
    } catch {
      setProductFeedback('Network error while deleting discount.');
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
          <p className="text-on-surface-variant text-sm font-black tracking-widest">Loading Catalog...</p>
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

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
    product.unit.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
    String(product.sku || '').toLowerCase().includes(productSearchQuery.toLowerCase()) ||
    String(product.barcode || '').toLowerCase().includes(productSearchQuery.toLowerCase())
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (productSortKey === 'price') {
      const valueA = Number(a.effectivePrice ?? a.price ?? 0);
      const valueB = Number(b.effectivePrice ?? b.price ?? 0);
      return productSortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    }

    const valueA = String(a[productSortKey] || '');
    const valueB = String(b[productSortKey] || '');
    return productSortDirection === 'asc'
      ? valueA.localeCompare(valueB)
      : valueB.localeCompare(valueA);
  });

  const productTotalPages = Math.max(1, Math.ceil(sortedProducts.length / productPageSize));
  const paginatedProducts = sortedProducts.slice(
    (productPage - 1) * productPageSize,
    productPage * productPageSize
  );

  return (
    <div className="flex flex-col h-full bg-surface overflow-y-auto scrollbar-hide">
      <div className="p-4 lg:p-8 mx-auto w-full space-y-4 lg:space-y-6">
        {productFeedback && (
          <div className="rounded-xl border border-outline-variant bg-surface-container px-4 py-3 text-sm text-on-surface-variant">
            {productFeedback}
          </div>
        )}

        <section className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:flex lg:flex-wrap lg:items-center">
              <button
                type="button"
                onClick={openCreateDiscountModal}
                className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-outline-variant bg-surface px-2 py-2.5 text-[11px] font-bold text-on-surface hover:bg-surface-container-high lg:gap-2 lg:px-4 lg:text-xs"
              >
                <Tags size={14} />
                <span className="truncate">Manage Discounts</span>
              </button>
              <button
                type="button"
                onClick={openImportProductsModal}
                className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-outline-variant bg-surface px-2 py-2.5 text-[11px] font-bold text-on-surface hover:bg-surface-container-high lg:gap-2 lg:px-4 lg:text-xs"
              >
                <Upload size={14} />
                <span className="truncate">Import Excel</span>
              </button>
              <button
                type="button"
                onClick={openCreateProductModal}
                className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-2 py-2.5 text-[11px] font-black tracking-wide text-on-primary hover:opacity-90 active:scale-95 transition-all lg:gap-2 lg:px-4 lg:text-xs lg:tracking-wider"
              >
                <Plus size={14} />
                <span className="truncate">Add Product</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px] flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                <input
                  type="text"
                  placeholder="Search name, SKU, or barcode..."
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="h-10 w-full sm:w-64 rounded-lg border border-outline-variant bg-surface pl-10 text-sm text-on-surface placeholder:text-on-surface-variant focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-bold text-on-surface-variant">
                Sort by
                <select
                  value={`${productSortKey}:${productSortDirection}`}
                  onChange={(e) => {
                    const [key, direction] = e.target.value.split(':') as [
                      'name' | 'category' | 'price',
                      'asc' | 'desc'
                    ];
                    setProductSortKey(key);
                    setProductSortDirection(direction);
                  }}
                  className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs text-on-surface outline-none"
                >
                  <option value="name:asc">Name A-Z</option>
                  <option value="name:desc">Name Z-A</option>
                  <option value="category:asc">Category A-Z</option>
                  <option value="category:desc">Category Z-A</option>
                  <option value="price:asc">Price Low-High</option>
                  <option value="price:desc">Price High-Low</option>
                </select>
              </label>

              <label className="inline-flex items-center gap-2 text-xs font-bold text-on-surface-variant">
                Rows
                <select
                  value={productPageSize}
                  onChange={(e) => setProductPageSize(Number(e.target.value))}
                  className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs text-on-surface outline-none"
                >
                  {[8, 12, 16, 24].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 max-h-[50vh] lg:max-h-[70vh] overflow-y-auto scrollbar-hide">
            {productsLoading && (
              <p className="text-xs text-on-surface-variant col-span-full">Loading product catalog...</p>
            )}

            {!productsLoading &&
              paginatedProducts.map((product) => (
                <div
                  key={product._id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-outline-variant bg-surface-container-low min-w-0"
                >
                  <img src={product.image} alt={product.name} className="size-12 lg:size-14 rounded-lg object-cover bg-surface shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">{product.name}</p>
                    <p className="text-[10px] font-bold tracking-wider text-on-surface-variant">
                      {product.category} · {product.unit}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full border border-outline-variant bg-surface px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">
                        SKU {product.sku || 'Auto'}
                      </span>
                      <span className="rounded-full border border-outline-variant bg-surface px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">
                        {product.barcode || 'Barcode pending'}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      {product.activeDiscount && Number(product.effectivePrice) < Number(product.price) ? (
                        <>
                          <p className="text-xs font-semibold text-on-surface-variant line-through">Rs. {Number(product.price).toFixed(2)}</p>
                          <p className="text-xs font-black text-primary">Rs. {Number(product.effectivePrice).toFixed(2)}</p>
                        </>
                      ) : (
                        <p className="text-xs font-semibold text-primary">Rs. {Number(product.price).toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
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

            {!productsLoading && sortedProducts.length === 0 && (
              <div className="col-span-full text-center py-8 rounded-lg border border-dashed border-outline-variant text-xs text-on-surface-variant">
                No products yet for this tenant. Add a few so the POS has something to sell.
              </div>
            )}
          </div>

          {sortedProducts.length > 0 && (
            <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
              <p className="shrink-0 text-xs text-on-surface-variant whitespace-nowrap">
                Showing {(productPage - 1) * productPageSize + 1}-{Math.min(productPage * productPageSize, sortedProducts.length)} of {sortedProducts.length}
              </p>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setProductPage((prev) => Math.max(1, prev - 1))}
                  disabled={productPage === 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-high disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                  Prev
                </button>
                <span className="rounded-lg bg-surface-container px-3 py-2 text-xs font-bold text-on-surface">
                  Page {productPage} / {productTotalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setProductPage((prev) => Math.min(productTotalPages, prev + 1))}
                  disabled={productPage === productTotalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-high disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="bg-surface-container p-4 lg:p-6 rounded-xl border border-outline-variant space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-on-surface">Scheduled Discounts</h2>
            </div>
            <button
              type="button"
              onClick={openCreateDiscountModal}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black tracking-wider text-on-primary hover:opacity-90 active:scale-95 transition-all"
            >
              <Plus size={14} />
              New Discount
            </button>
          </div>

          <div className="space-y-3">
            {discountsLoading && (
              <p className="text-xs text-on-surface-variant">Loading discounts...</p>
            )}

            {!discountsLoading && discounts.map((discount) => {
              const matchingProducts = products.filter((product) =>
                discount.productIds?.some((id: any) => String(id) === String(product._id))
              );
              return (
                <div
                  key={discount._id}
                  className="flex flex-col gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-on-surface">{discount.title}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mt-1">
                        {discount.mode === 'percentage' ? `${Number(discount.value).toFixed(2)}% off` : `Fixed price Rs. ${Number(discount.value).toFixed(2)}`}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditDiscount(discount)}
                        className="size-9 rounded-lg border border-outline-variant text-on-surface-variant hover:text-primary hover:bg-surface-container-high flex items-center justify-center cursor-pointer"
                      >
                        <PencilLine size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDiscount(discount._id)}
                        className="size-9 rounded-lg border border-outline-variant text-on-surface-variant hover:text-error hover:bg-error/10 flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={13} />
                      {new Date(discount.startsAt).toLocaleDateString()} - {new Date(discount.endsAt).toLocaleDateString()}
                    </span>
                    <span>{matchingProducts.length} item{matchingProducts.length !== 1 ? 's' : ''}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {matchingProducts.map((product) => (
                      <span
                        key={product._id}
                        className="rounded-full border border-outline-variant bg-surface px-3 py-1 text-[11px] font-bold text-on-surface-variant"
                      >
                        {product.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}

            {!discountsLoading && discounts.length === 0 && (
              <div className="text-center py-8 rounded-lg border border-dashed border-outline-variant text-xs text-on-surface-variant">
                No discounts yet. Create one to schedule special pricing for selected items.
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
                    : 'Upload one Excel sheet and bulk create products for this shop.'}
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
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                    productModalMode === 'form'
                      ? 'bg-primary text-on-primary'
                      : 'border border-outline-variant bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Plus size={14} />
                  Add Product
                </button>
                <button
                  type="button"
                  onClick={() => setProductModalMode('import')}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                    productModalMode === 'import'
                      ? 'bg-primary text-on-primary'
                      : 'border border-outline-variant bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Upload size={14} />
                  Import Excel
                </button>
              </div>

              {productModalMode === 'import' ? (
                <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5 space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <p className="text-xs font-black uppercase tracking-wider text-on-surface">Excel Import</p>
                  </div>
                  <p className="text-sm leading-relaxed text-on-surface-variant">
                    First sheet columns: <strong>name</strong>, <strong>category</strong>, <strong>price</strong>, <strong>unit</strong>, optional <strong>sku</strong>, optional <strong>barcode</strong>, optional <strong>image</strong>.
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
                          <label className="text-xs font-bold text-on-surface-variant">Product Name</label>
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
                            <label className="text-xs font-bold text-on-surface-variant">Category</label>
                            <input
                              type="text"
                              value={productForm.category}
                              onChange={(e) => updateProductForm('category', e.target.value)}
                              placeholder="Pastries"
                              className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-on-surface-variant">Unit</label>
                            <input
                              type="text"
                              value={productForm.unit}
                              onChange={(e) => updateProductForm('unit', e.target.value)}
                              placeholder="each"
                              className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-on-surface-variant">SKU</label>
                            <input
                              type="text"
                              value={productForm.sku}
                              onChange={(e) => updateProductForm('sku', e.target.value)}
                              placeholder="Leave blank to auto-generate"
                              className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-on-surface-variant">Barcode</label>
                            <input
                              type="text"
                              value={productForm.barcode}
                              onChange={(e) => updateProductForm('barcode', e.target.value)}
                              placeholder="Leave blank to auto-generate"
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
                            <label className="text-xs font-bold text-on-surface-variant">Price</label>
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
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-on-surface-variant">Image URL</label>
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
                          <p className="text-[10px] font-bold tracking-wide text-on-surface-variant">
                            SKU: {productForm.sku.trim() || 'Auto-generated'}
                          </p>
                          <p className="text-[10px] font-bold tracking-wide text-on-surface-variant break-all">
                            Barcode: {productForm.barcode.trim() || 'Auto-generated'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    <button
                      type="submit"
                      disabled={productSubmitting}
                      className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold text-sm tracking-widest hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
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

      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-outline-variant bg-surface-container shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 rounded-t-3xl border-b border-outline-variant bg-surface-container px-6 py-5">
              <div>
                <div className="flex items-center gap-3 text-primary">
                  <Tags size={20} />
                  <h3 className="text-xl font-bold text-on-surface">
                    {discountForm.id ? 'Edit Discount' : 'Create Discount'}
                  </h3>
                </div>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Select one or many items, choose a date range, and define the discount as a percentage or fixed sale price.
                </p>
              </div>

              <button
                type="button"
                onClick={closeDiscountModal}
                disabled={discountSubmitting}
                className="rounded-xl border border-outline-variant p-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitDiscount} className="space-y-5 p-6">
              <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5 space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-widest text-on-surface">Discount Setup</p>
                  <p className="text-xs text-on-surface-variant">Create seasonal offers, campaign pricing, or fixed special prices for selected products.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-on-surface-variant">Discount Name</label>
                  <input
                    type="text"
                    value={discountForm.title}
                    onChange={(e) => updateDiscountForm('title', e.target.value)}
                    placeholder="e.g. Weekend Cake Offer"
                    className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-on-surface-variant">Start Date</label>
                    <input
                      type="date"
                      value={discountForm.startsAt}
                      onChange={(e) => updateDiscountForm('startsAt', e.target.value)}
                      className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-on-surface-variant">End Date</label>
                    <input
                      type="date"
                      value={discountForm.endsAt}
                      onChange={(e) => updateDiscountForm('endsAt', e.target.value)}
                      className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-on-surface-variant">Discount Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => updateDiscountForm('mode', 'percentage')}
                        className={`rounded-xl border px-4 py-3 text-sm font-bold transition-colors ${
                          discountForm.mode === 'percentage'
                            ? 'border-primary bg-primary text-on-primary'
                            : 'border-outline-variant bg-surface text-on-surface'
                        }`}
                      >
                        Percentage
                      </button>
                      <button
                        type="button"
                        onClick={() => updateDiscountForm('mode', 'fixed_price')}
                        className={`rounded-xl border px-4 py-3 text-sm font-bold transition-colors ${
                          discountForm.mode === 'fixed_price'
                            ? 'border-primary bg-primary text-on-primary'
                            : 'border-outline-variant bg-surface text-on-surface'
                        }`}
                      >
                        Fixed Price
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-on-surface-variant">
                      {discountForm.mode === 'percentage' ? 'Discount Percentage' : 'Sale Price'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discountForm.value}
                      onChange={(e) => updateDiscountForm('value', e.target.value)}
                      placeholder={discountForm.mode === 'percentage' ? '10' : '450.00'}
                      className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-5 space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-widest text-on-surface">Apply To Products</p>
                  <p className="text-xs text-on-surface-variant">Choose one item or many items for the same discount campaign.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1 scrollbar-hide">
                  {products.map((product) => (
                    <label
                      key={product._id}
                      className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface px-3 py-3 text-sm text-on-surface cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={discountForm.productIds.includes(product._id)}
                        onChange={() => handleDiscountProductToggle(product._id)}
                        className="size-4 accent-primary"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{product.name}</p>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">
                          {product.category} · Rs. {Number(product.price).toFixed(2)}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 flex-wrap">
                <button
                  type="submit"
                  disabled={discountSubmitting}
                  className="bg-primary text-on-primary px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {discountSubmitting ? 'Saving...' : discountForm.id ? 'Update Discount' : 'Save Discount'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetDiscountForm();
                    setIsDiscountModalOpen(false);
                  }}
                  className="px-5 py-3 rounded-xl border border-outline-variant text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
