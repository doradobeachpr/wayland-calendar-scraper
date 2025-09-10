import { NextRequest, NextResponse } from 'next/server';
import { calendarScraper } from '@/lib/scraper';
import { supabaseDb } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { startDate, endDate } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (start > end) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    // Start scraping (this will run in background)
    const scrapePromise = calendarScraper.scrapeCalendar(start, end);

    // Don't await - let it run in background
    scrapePromise.catch(error => {
      console.error('Scraping error:', error);
    });

    return NextResponse.json({
      success: true,
      message: 'Scraping started successfully',
      startDate: startDate,
      endDate: endDate,
      note: 'Scraping is running in the background. Refresh to see results.'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await supabaseDb.init();
    const totalEntries = await supabaseDb.getEntryCount();
    const entries = await supabaseDb.getAllEntries();

    const summary = {
      totalEntries,
      hasData: totalEntries > 0,
      sampleEntries: entries.slice(0, 5) // Get first 5 entries as sample
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
