import { NextRequest } from 'next/server';
import { createAPIClient } from '@/lib/supabase-server';

// Unified search for both products and categories
export async function GET(request: NextRequest) {
  try {
    const supabase = await createAPIClient(request);

    // Extract search parameter from URL
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || searchParams.get('search');
    
    if (!search) {
      return Response.json({ products: [], categories: [] });
    }

    // Search for products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        category:categories!inner(id, name)
      `)
      .ilike('name', `%${search}%`)
      .limit(5)
      .order('name', { ascending: true });

    if (productsError) {
      console.error('Error searching products:', productsError);
    }

    // Search for categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .ilike('name', `%${search}%`)
      .limit(5)
      .order('name', { ascending: true });

    if (categoriesError) {
      console.error('Error searching categories:', categoriesError);
    }

    return Response.json({
      products: products || [],
      categories: categories || []
    });
  } catch (error: any) {
    console.error('Unified search error:', error);
    return Response.json({ 
      products: [], 
      categories: [],
      error: error.message 
    }, { status: 500 });
  }
}