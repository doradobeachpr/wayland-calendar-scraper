'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ScrapingSummary {
  totalEntries: number;
  hasData: boolean;
  sampleEntries: any[];
}

interface ExportSummary {
  totalEntries: number;
  dateRange: { start: string; end: string } | null;
  departments: string[];
  lastScraped: string | null;
}

export default function Home() {
  const [startDate, setStartDate] = useState('2025-09-01');
  const [endDate, setEndDate] = useState('2025-12-31');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [scrapingSummary, setScrapingSummary] = useState<ScrapingSummary | null>(null);
  const [exportSummary, setExportSummary] = useState<ExportSummary | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);

  useEffect(() => {
    fetchScrapingSummary();
    fetchExportSummary();
  }, []);

  const fetchScrapingSummary = async () => {
    try {
      const response = await fetch('/api/scrape');
      const data = await response.json();
      setScrapingSummary(data);
    } catch (error) {
      console.error('Error fetching scraping summary:', error);
    }
  };

  const fetchExportSummary = async () => {
    try {
      const response = await fetch('/api/export');
      const data = await response.json();
      setExportSummary(data);
    } catch (error) {
      console.error('Error fetching export summary:', error);
    }
  };

  const handleScrape = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Scraping started successfully! Date range: ${startDate} to ${endDate}. ${data.note || ''}`);
        // Refresh summary after a delay to see new data
        setTimeout(() => {
          fetchScrapingSummary();
          fetchExportSummary();
        }, 5000);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'csv-with-links') => {
    setIsExporting(true);
    setMessage('');

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: exportSummary?.dateRange?.start,
          endDate: exportSummary?.dateRange?.end,
          includeDescription: true,
          format,
        }),
      });

      if (response.ok) {
        // Create blob from response and download
        const blob = await response.blob();
        const fileName = format === 'csv-with-links' ? 'wayland_calendar_with_hyperlinks.csv' : 'wayland_calendar_export.csv';
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        setMessage(`Export completed! File: ${fileName}`);
      } else {
        const data = await response.json();
        setMessage(`Export error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Export error: ${(error as Error).message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDemoData = async () => {
    setIsLoadingDemo(true);
    setMessage('');

    try {
      const response = await fetch('/api/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'populate',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message + (data.note ? ` ${data.note}` : ''));
        // Refresh summaries
        setTimeout(() => {
          fetchScrapingSummary();
          fetchExportSummary();
        }, 1000);
      } else {
        setMessage(`Demo error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Demo error: ${(error as Error).message}`);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm('Are you sure you want to clear all calendar entries from the database? This action cannot be undone.')) {
      return;
    }

    setIsClearingData(true);
    setMessage('');

    try {
      const response = await fetch('/api/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'clear',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        // Refresh summaries
        setTimeout(() => {
          fetchScrapingSummary();
          fetchExportSummary();
        }, 1000);
      } else {
        setMessage(`Clear error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Clear error: ${(error as Error).message}`);
    } finally {
      setIsClearingData(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">Wayland Calendar Scraper</h1>
        <p className="text-lg text-muted-foreground">
          Production-ready calendar scraping tool with Supabase database
        </p>
        <div className="mt-2">
          <Badge variant="default" className="mr-2">Production Mode</Badge>
          <Badge variant="outline">Supabase Powered</Badge>
        </div>
      </div>

      {/* Scraping Section */}
      <Card>
        <CardHeader>
          <CardTitle>📅 Scrape Calendar Events</CardTitle>
          <CardDescription>
            Extract calendar events from wayland.ma.us and store in Supabase database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleScrape}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Scraping in Progress...' : 'Start Scraping'}
          </Button>
        </CardContent>
      </Card>

      {/* Production Notice */}
      <Alert>
        <AlertDescription>
          <strong>🚀 Production Mode:</strong> This application now uses Supabase database for persistent storage.
          Calendar events are scraped from wayland.ma.us and stored permanently. You can clear data, populate demo events,
          or scrape live data from the town website.
        </AlertDescription>
      </Alert>

      {/* Demo Data Section */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Database Management</CardTitle>
          <CardDescription>
            Populate demo data or clear existing calendar entries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Button
              onClick={handleDemoData}
              disabled={isLoadingDemo}
              variant="outline"
            >
              {isLoadingDemo ? 'Loading Demo Data...' : 'Populate Demo Data'}
            </Button>

            <Button
              onClick={handleClearData}
              disabled={isClearingData}
              variant="destructive"
            >
              {isClearingData ? 'Clearing Data...' : 'Clear All Data'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Data Summary */}
      {scrapingSummary && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Database Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {scrapingSummary.totalEntries}
                </div>
                <div className="text-sm text-muted-foreground">Total Events</div>
              </div>

              <div className="text-center">
                <Badge variant={scrapingSummary.hasData ? "default" : "secondary"}>
                  {scrapingSummary.hasData ? "Data Available" : "No Data"}
                </Badge>
              </div>

              <div className="text-center">
                <div className="text-sm text-muted-foreground">
                  Sample Events: {scrapingSummary.sampleEntries.length}
                </div>
              </div>
            </div>

            {scrapingSummary.sampleEntries.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Recent Events:</h4>
                <div className="space-y-2">
                  {scrapingSummary.sampleEntries.slice(0, 3).map((event, index) => (
                    <div key={index} className="text-sm border-l-2 border-blue-200 pl-3">
                      <div className="font-medium">{event.title}</div>
                      <div className="text-muted-foreground">
                        {formatDate(event.date)} {event.time && `at ${event.time}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {event.department} • {event.event_type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Export Section */}
      {exportSummary && exportSummary.totalEntries > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📤 Export Calendar Data</CardTitle>
            <CardDescription>
              Export calendar events from Supabase database to CSV format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium">Total Events</div>
                <div className="text-2xl font-bold">{exportSummary.totalEntries}</div>
              </div>

              {exportSummary.dateRange && (
                <div>
                  <div className="text-sm font-medium">Date Range</div>
                  <div className="text-sm">
                    {formatDate(exportSummary.dateRange.start)} - {formatDate(exportSummary.dateRange.end)}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Departments ({exportSummary.departments.length})</div>
              <div className="flex flex-wrap gap-1">
                {exportSummary.departments.slice(0, 10).map((dept, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {dept}
                  </Badge>
                ))}
                {exportSummary.departments.length > 10 && (
                  <Badge variant="outline" className="text-xs">
                    +{exportSummary.departments.length - 10} more
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Button
                onClick={() => handleExport('csv')}
                disabled={isExporting}
                variant="outline"
              >
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </Button>

              <Button
                onClick={() => handleExport('csv-with-links')}
                disabled={isExporting}
              >
                {isExporting ? 'Exporting...' : 'Export CSV with Hyperlinks'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Messages */}
      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>ℹ️ Production Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>1. Setup:</strong> Configure Supabase credentials in your environment variables</p>
          <p><strong>2. Demo Data:</strong> Use "Populate Demo Data" to add 15 sample Wayland town events</p>
          <p><strong>3. Live Scraping:</strong> Set date range and click "Start Scraping" to extract real events</p>
          <p><strong>4. Export:</strong> Download CSV files with event data and hyperlinks to source pages</p>
          <p><strong>5. Database:</strong> All data is persistently stored in Supabase PostgreSQL</p>
          <p><strong>Technical:</strong> Cloudflare bypass may be needed for production scraping - consider Puppeteer integration</p>
        </CardContent>
      </Card>
    </div>
  );
}
