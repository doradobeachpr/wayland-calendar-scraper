import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'populate') {
      await supabaseDb.populateDemo();

      return NextResponse.json({
        success: true,
        message: 'Demo data has been populated successfully to Supabase database',
        note: 'The calendar scraper is now in production mode with real database storage and full scraping capabilities.'
      });
    }

    if (action === 'clear') {
      await supabaseDb.clearAllEntries();

      return NextResponse.json({
        success: true,
        message: 'All calendar entries have been cleared from the database'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "populate" or "clear".' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Demo API error:', error);
    return NextResponse.json(
      { error: 'Failed to execute demo action: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
