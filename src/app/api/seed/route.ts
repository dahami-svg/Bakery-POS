import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seed';

export async function POST() {
  try {
    const result = await seedDatabase();
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      tenants: {
        bakery: result.bakeryTenant._id,
        hardware: result.hardwareTenant._id,
        restaurant: result.restaurantTenant._id,
        cake: result.cakeTenant._id,
      },
    });
  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to seed database',
        error: error.message || error,
      },
      { status: 500 }
    );
  }
}

// Support GET for easy browser-based triggering
export async function GET() {
  return POST();
}
