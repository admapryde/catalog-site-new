import { NextRequest } from 'next/server';
import { createAPIClient, supabaseWithRetry } from '@/lib/supabase-server';

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
    const productsResult = await supabaseWithRetry(supabase, (client) =>
      client
        .from('products')
        .select(`
          id,
          name,
          price,
          category:categories!inner(id, name)
        `)
        .ilike('name', `%${search}%`)
        .limit(5)
        .order('name', { ascending: true })
    );

    const { data: products, error: productsError } = productsResult as { data: any; error: any };

    if (productsError) {
      console.error('Error searching products:', productsError);
    }

    // Search for categories
    const categoriesResult = await supabaseWithRetry(supabase, (client) =>
      client
        .from('categories')
        .select('id, name')
        .ilike('name', `%${search}%`)
        .limit(5)
        .order('name', { ascending: true })
    );

    const { data: categories, error: categoriesError } = categoriesResult as { data: any; error: any };

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