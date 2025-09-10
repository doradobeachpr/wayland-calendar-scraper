import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/supabase';
import { format } from 'date-fns';

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return format(date, 'EEEE, MMMM d, yyyy');
  } catch (error) {
    return dateString;
  }
}

function createCSVContent(entries: any[], includeDescription: boolean): string {
  const headers = [
    'Event Title',
    'Date',
    'Time',
    'Department',
    'Committee',
    'Event Type',
    ...(includeDescription ? ['Description'] : []),
    'Source Link',
    'Formatted Date',
    'Scraped At'
  ];

  let csvContent = headers.map(header => `"${header}"`).join(',') + '\n';

  for (const entry of entries) {
    const formattedDate = formatDate(entry.date);
    const values = [
      `"${(entry.title || '').replace(/"/g, '""')}"`,
      `"${entry.date || ''}"`,
      `"${entry.time || ''}"`,
      `"${(entry.department || '').replace(/"/g, '""')}"`,
      `"${(entry.committee || '').replace(/"/g, '""')}"`,
      `"${(entry.event_type || '').replace(/"/g, '""')}"`,
      ...(includeDescription ? [`"${(entry.description || '').replace(/"/g, '""').substring(0, 500)}"`] : []),
      `"${entry.source_url || ''}"`,
      `"${formattedDate}"`,
      `"${entry.scraped_at || ''}"`
    ];

    csvContent += values.join(',') + '\n';
  }

  return csvContent;
}

function createCSVWithHyperlinks(entries: any[], includeDescription: boolean): string {
  const headers = [
    'Event Title',
    'Date',
    'Time',
    'Department',
    'Committee',
    'Event Type',
    ...(includeDescription ? ['Description'] : []),
    'Source Link',
    'Clickable Link',
    'Formatted Date',
    'Scraped At'
  ];

  let csvContent = headers.map(header => `"${header}"`).join(',') + '\n';

  for (const entry of entries) {
    const formattedDate = formatDate(entry.date);
    const sourceUrl = entry.source_url || '';
    const hyperlinkFormula = sourceUrl ? `=HYPERLINK("${sourceUrl}","View Event")` : '';

    const values = [
      `"${(entry.title || '').replace(/"/g, '""')}"`,
      `"${entry.date || ''}"`,
      `"${entry.time || ''}"`,
      `"${(entry.department || '').replace(/"/g, '""')}"`,
      `"${(entry.committee || '').replace(/"/g, '""')}"`,
      `"${(entry.event_type || '').replace(/"/g, '""')}"`,
      ...(includeDescription ? [`"${(entry.description || '').replace(/"/g, '""').substring(0, 500)}"`] : []),
      `"${sourceUrl}"`,
      hyperlinkFormula,
      `"${formattedDate}"`,
      `"${entry.scraped_at || ''}"`
    ];

    csvContent += values.join(',') + '\n';
  }

  return csvContent;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      startDate,
      endDate,
      includeDescription = true,
      format: exportFormat = 'csv'
    } = body;

    // Get entries from Supabase database
    let entries: any[];
    if (startDate && endDate) {
      entries = await supabaseDb.getEntriesByDateRange(startDate, endDate);
    } else {
      entries = await supabaseDb.getAllEntries();
    }

    let csvContent: string;
    let fileName: string;

    if (exportFormat === 'csv-with-links') {
      csvContent = createCSVWithHyperlinks(entries, includeDescription);
      fileName = 'wayland_calendar_with_hyperlinks.csv';
    } else {
      csvContent = createCSVContent(entries, includeDescription);
      fileName = 'wayland_calendar_export.csv';
    }

    // Return CSV content directly
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json(
      { error: 'Export failed: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const entries = await supabaseDb.getAllEntries();

    if (entries.length === 0) {
      return NextResponse.json({
        totalEntries: 0,
        dateRange: null,
        departments: [],
        lastScraped: null
      });
    }

    // Get date range
    const dates = entries.map(e => e.date).sort();
    const dateRange = {
      start: dates[0],
      end: dates[dates.length - 1]
    };

    // Get unique departments
    const departments = [...new Set(entries
      .map(e => e.department)
      .filter((d): d is string => d !== undefined && d !== null && d.trim() !== '')
    )].sort();

    // Get last scraped date
    const scrapedDates = entries.map(e => e.scraped_at).sort();
    const lastScraped = scrapedDates[scrapedDates.length - 1];

    return NextResponse.json({
      totalEntries: entries.length,
      dateRange,
      departments,
      lastScraped
    });
  } catch (error) {
    console.error('Export summary API error:', error);
    return NextResponse.json(
      { error: 'Failed to get export summary' },
      { status: 500 }
    );
  }
}
