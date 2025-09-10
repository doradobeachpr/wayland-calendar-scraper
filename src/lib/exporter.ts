import * as createCsvWriter from 'csv-writer';
import { format } from 'date-fns';
import { database, CalendarEntry } from './database';
import path from 'path';

export interface ExportOptions {
  startDate?: string;
  endDate?: string;
  outputPath?: string;
  includeDescription?: boolean;
}

class CalendarExporter {
  async exportToCSV(options: ExportOptions = {}): Promise<string> {
    const {
      startDate,
      endDate,
      outputPath = path.join(process.cwd(), 'public', 'calendar_export.csv'),
      includeDescription = true
    } = options;

    // Get entries from database
    let entries: CalendarEntry[];
    if (startDate && endDate) {
      entries = await database.getEntriesByDateRange(startDate, endDate);
    } else {
      entries = await database.getAllEntries();
    }

    // Define CSV headers
    const headers = [
      { id: 'title', title: 'Event Title' },
      { id: 'date', title: 'Date' },
      { id: 'time', title: 'Time' },
      { id: 'department', title: 'Department' },
      { id: 'committee', title: 'Committee' },
      { id: 'event_type', title: 'Event Type' },
      ...(includeDescription ? [{ id: 'description', title: 'Description' }] : []),
      { id: 'source_url', title: 'Source Link' },
      { id: 'formatted_date', title: 'Formatted Date' },
      { id: 'scraped_at', title: 'Scraped At' }
    ];

    // Create CSV writer
    const csvWriter = createCsvWriter.createObjectCsvWriter({
      path: outputPath,
      header: headers
    });

    // Transform entries for CSV format
    const csvData = entries.map(entry => {
      const formattedDate = this.formatDate(entry.date);

      return {
        title: entry.title || '',
        date: entry.date || '',
        time: entry.time || '',
        department: entry.department || '',
        committee: entry.committee || '',
        event_type: entry.event_type || '',
        ...(includeDescription ? { description: this.cleanDescription(entry.description || '') } : {}),
        source_url: entry.source_url || '',
        formatted_date: formattedDate,
        scraped_at: entry.scraped_at || ''
      };
    });

    // Write CSV file
    await csvWriter.writeRecords(csvData);

    console.log(`Exported ${entries.length} calendar entries to ${outputPath}`);
    return outputPath;
  }

  async exportToCSVWithHyperlinks(options: ExportOptions = {}): Promise<string> {
    const {
      startDate,
      endDate,
      outputPath = path.join(process.cwd(), 'public', 'calendar_export_with_links.csv'),
      includeDescription = true
    } = options;

    // Get entries from database
    let entries: CalendarEntry[];
    if (startDate && endDate) {
      entries = await database.getEntriesByDateRange(startDate, endDate);
    } else {
      entries = await database.getAllEntries();
    }

    // Create CSV content manually to include Excel hyperlink formulas
    let csvContent = this.createCSVHeader(includeDescription);

    for (const entry of entries) {
      const row = this.createCSVRow(entry, includeDescription);
      csvContent += row + '\n';
    }

    // Write to file
    const fs = require('fs').promises;
    await fs.writeFile(outputPath, csvContent, 'utf8');

    console.log(`Exported ${entries.length} calendar entries with hyperlinks to ${outputPath}`);
    return outputPath;
  }

  private createCSVHeader(includeDescription: boolean): string {
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

    return headers.map(header => `"${header}"`).join(',') + '\n';
  }

  private createCSVRow(entry: CalendarEntry, includeDescription: boolean): string {
    const formattedDate = this.formatDate(entry.date);
    const cleanTitle = this.escapeCsvValue(entry.title || '');
    const cleanDescription = includeDescription ? this.escapeCsvValue(this.cleanDescription(entry.description || '')) : '';
    const sourceUrl = entry.source_url || '';

    // Create Excel hyperlink formula
    const hyperlinkFormula = sourceUrl ? `=HYPERLINK("${sourceUrl}","View Event")` : '';

    const values = [
      cleanTitle,
      entry.date || '',
      entry.time || '',
      this.escapeCsvValue(entry.department || ''),
      this.escapeCsvValue(entry.committee || ''),
      this.escapeCsvValue(entry.event_type || ''),
      ...(includeDescription ? [cleanDescription] : []),
      sourceUrl,
      hyperlinkFormula,
      formattedDate,
      entry.scraped_at || ''
    ];

    return values.join(',');
  }

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return format(date, 'EEEE, MMMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  }

  private cleanDescription(description: string): string {
    return description
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n/g, ' ') // Replace newlines with space
      .replace(/\r/g, '') // Remove carriage returns
      .trim()
      .substring(0, 500); // Limit length
  }

  private escapeCsvValue(value: string): string {
    if (!value) return '""';

    // Escape quotes and wrap in quotes
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  async getExportSummary(): Promise<{
    totalEntries: number;
    dateRange: { start: string; end: string } | null;
    departments: string[];
    lastScraped: string | null;
  }> {
    const entries = await database.getAllEntries();

    if (entries.length === 0) {
      return {
        totalEntries: 0,
        dateRange: null,
        departments: [],
        lastScraped: null
      };
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

    return {
      totalEntries: entries.length,
      dateRange,
      departments,
      lastScraped
    };
  }
}

export const calendarExporter = new CalendarExporter();
