'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, PencilLine, ShieldAlert, Trash2 } from 'lucide-react';
import { useTenant } from '@/context/TenantContext';

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
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [productFeedback, setProductFeedback] = useState('');

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
    if (activeTenant?._id) {
      fetchProducts(activeTenant._id);
    } else {
      setProducts([]);
    }
  }, [activeTenant?._id]);

  const updateProductForm = (field: keyof ProductFormState, value: string) => {
    setProductForm((prev) => ({ ...prev, [field]: value }));
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
  };

  const resetProductForm = () => {
    setProductForm(emptyProductForm);
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
      <div className="p-8 mx-auto w-full grid grid-cols-1 xl:grid-cols-12 gap-8">
        <section className="xl:col-span-4 bg-surface-container p-6 rounded-xl border border-outline-variant space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-on-surface">{productForm.id ? 'Edit Product' : 'Add Product'}</h2>
            <span className="text-[10px] uppercase font-black tracking-wider text-on-surface-variant">
              {activeTenant.name}
            </span>
          </div>

          <form onSubmit={handleSubmitProduct} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-on-surface-variant">Product Name</label>
              <input
                type="text"
                value={productForm.name}
                onChange={(e) => updateProductForm('name', e.target.value)}
                placeholder="e.g. Butter Croissant"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-on-surface-variant">Category</label>
                <input
                  type="text"
                  value={productForm.category}
                  onChange={(e) => updateProductForm('category', e.target.value)}
                  placeholder="Pastries"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-on-surface-variant">Unit</label>
                <input
                  type="text"
                  value={productForm.unit}
                  onChange={(e) => updateProductForm('unit', e.target.value)}
                  placeholder="each"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-on-surface-variant">Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) => updateProductForm('price', e.target.value)}
                  placeholder="450.00"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-on-surface-variant">Image URL</label>
                <input
                  type="text"
                  value={productForm.image}
                  onChange={(e) => updateProductForm('image', e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {productFeedback && <p className="text-xs text-on-surface-variant">{productFeedback}</p>}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={productSubmitting}
                className="flex-1 bg-primary text-on-primary py-3 rounded-lg font-black text-sm uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {productSubmitting ? 'Saving...' : productForm.id ? 'Update Product' : 'Create Product'}
              </button>
              {productForm.id && (
                <button
                  type="button"
                  onClick={resetProductForm}
                  className="px-4 py-3 rounded-lg border border-outline-variant text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="xl:col-span-8 bg-surface-container p-6 rounded-xl border border-outline-variant space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-on-surface">Catalog Products</h2>
            <span className="text-[10px] font-bold uppercase text-on-surface-variant">
              {products.length} items
            </span>
          </div>

          <div className="space-y-3 max-h-[70vh] overflow-y-auto scrollbar-hide">
            {productsLoading && (
              <p className="text-xs text-on-surface-variant">Loading product catalog...</p>
            )}

            {!productsLoading &&
              products.map((product) => (
                <div
                  key={product._id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-outline-variant bg-surface-container-low"
                >
                  <img src={product.image} alt={product.name} className="size-14 rounded-lg object-cover bg-surface" />
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
                      className="size-9 rounded-lg border border-outline-variant text-on-surface-variant hover:text-primary hover:bg-surface-container-high flex items-center justify-center"
                    >
                      <PencilLine size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product._id)}
                      className="size-9 rounded-lg border border-outline-variant text-on-surface-variant hover:text-error hover:bg-error/10 flex items-center justify-center"
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
    </div>
  );
}
