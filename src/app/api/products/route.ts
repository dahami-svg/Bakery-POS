import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Product from '@/models/Product';
import ProductDiscount from '@/models/ProductDiscount';
import { resolveEntityCodes } from '@/lib/barcodes';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: 'tenantId query parameter is required' },
        { status: 400 }
      );
    }

    const [products, discounts] = await Promise.all([
      Product.find({ tenantId }),
      ProductDiscount.find({
        tenantId,
        startsAt: { $lte: new Date() },
        endsAt: { $gte: new Date() },
      }),
    ]);

    const decoratedProducts = products.map((product) => {
      const productDoc = product.toObject();
      const matchingDiscounts = discounts.filter((discount) =>
        discount.productIds.some((productId) => productId.toString() === product._id.toString())
      );

      const bestDiscount = matchingDiscounts.reduce<any | null>((best, discount) => {
        const discountedValue = discount.mode === 'percentage'
          ? Number(product.price) * (1 - Number(discount.value || 0) / 100)
          : Number(discount.value || 0);

        if (discountedValue < 0 || discountedValue >= Number(product.price)) {
          return best;
        }

        if (!best || discountedValue < best.effectivePrice) {
          return {
            _id: discount._id,
            title: discount.title,
            mode: discount.mode,
            value: discount.value,
            startsAt: discount.startsAt,
            endsAt: discount.endsAt,
            effectivePrice: discountedValue,
          };
        }

        return best;
      }, null);

      return {
        ...productDoc,
        effectivePrice: bestDiscount ? bestDiscount.effectivePrice : Number(product.price),
        activeDiscount: bestDiscount,
      };
    });

    return NextResponse.json({ success: true, data: decoratedProducts });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch products', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const discountedPrice =
      body.discountedPrice === undefined || body.discountedPrice === null || body.discountedPrice === ''
        ? null
        : Number(body.discountedPrice);

    if (
      !body.tenantId ||
      !body.name ||
      !body.category ||
      body.price === undefined ||
      !body.image ||
      !body.unit
    ) {
      return NextResponse.json(
        { success: false, message: 'Missing required product fields' },
        { status: 400 }
      );
    }

    const product = await Product.create({
      tenantId: body.tenantId,
      name: body.name,
      category: body.category,
      price: body.price,
      discountedPrice,
      ...(await resolveEntityCodes({
        model: Product,
        tenantId: String(body.tenantId),
        name: String(body.name),
        prefix: 'PRD',
        sku: body.sku,
        barcode: body.barcode,
      })),
      image: body.image,
      unit: body.unit,
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error: any) {
    const duplicateField = error?.code === 11000 ? Object.keys(error?.keyPattern || {})[0] : null;
    return NextResponse.json(
      {
        success: false,
        message: duplicateField ? `That ${duplicateField} is already used in this shop.` : 'Failed to create product',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id, name, category, price, discountedPrice, image, unit, sku, barcode } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Product ID is required' },
        { status: 400 }
      );
    }

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    if (name !== undefined) product.name = name;
    if (category !== undefined) product.category = category;
    if (price !== undefined) product.price = price;
    if (discountedPrice !== undefined) {
      product.discountedPrice =
        discountedPrice === null || discountedPrice === '' ? null : Number(discountedPrice);
    }
    if (image !== undefined) product.image = image;
    if (unit !== undefined) product.unit = unit;
    if (sku !== undefined || barcode !== undefined) {
      const resolvedCodes = await resolveEntityCodes({
        model: Product,
        tenantId: String(product.tenantId),
        name: String(name ?? product.name),
        prefix: 'PRD',
        sku: sku ?? product.sku,
        barcode: barcode ?? product.barcode,
        excludeId: String(product._id),
      });
      product.sku = resolvedCodes.sku;
      product.barcode = resolvedCodes.barcode;
      product.barcodeType = resolvedCodes.barcodeType;
    }

    await product.save();

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    const duplicateField = error?.code === 11000 ? Object.keys(error?.keyPattern || {})[0] : null;
    return NextResponse.json(
      {
        success: false,
        message: duplicateField ? `That ${duplicateField} is already used in this shop.` : 'Failed to update product',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Product ID is required' },
        { status: 400 }
      );
    }

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to delete product', error: error.message },
      { status: 500 }
    );
  }
}
