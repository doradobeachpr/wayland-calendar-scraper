import axios from 'axios';
import * as cheerio from 'cheerio';
import { format, addMonths, isBefore, isAfter } from 'date-fns';
import { supabaseDb, CalendarEntry } from './supabase';

export interface ScrapingProgress {
  currentMonth: string;
  totalEntries: number;
  currentEntries: number;
  isComplete: boolean;
  error?: string;
}

class CalendarScraper {
  private baseUrl = 'https://www.wayland.ma.us';
  private calendarUrl = 'https://www.wayland.ma.us/calendar/month/';
  private delay = 1000; // 1 second delay between requests

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchPage(url: string, retries = 3): Promise<string> {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`Fetching: ${url} (attempt ${i + 1}/${retries})`);
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
          },
          timeout: 15000,
          maxRedirects: 5,
          validateStatus: (status) => status >= 200 && status < 300
        });
        await this.sleep(this.delay);
        return response.data;
      } catch (error: any) {
        console.error(`Error fetching ${url} (attempt ${i + 1}):`, error.message);
        if (i === retries - 1) {
          throw error;
        }
        // Wait longer between retries
        await this.sleep(this.delay * (i + 2));
      }
    }
    throw new Error('All retry attempts failed');
  }

  private parseEventFromLink(linkElement: cheerio.Cheerio<any>, $: cheerio.CheerioAPI): Partial<CalendarEntry> {
    const href = linkElement.attr('href');
    const text = linkElement.text().trim();

    if (!href || !text) return {};

    // Extract time from text (e.g., "6:00pm", "2:00pm")
    const timeMatch = text.match(/(\d{1,2}:\d{2}[ap]m)/i);
    const time = timeMatch ? timeMatch[1] : undefined;

    // Extract title (remove time from text)
    const title = time ? text.replace(timeMatch![0], '').trim() : text;

    // Extract department/committee from href
    const pathParts = href.split('/');
    const department = pathParts.length > 1 ? pathParts[1] : undefined;

    return {
      title,
      time,
      department,
      source_url: href.startsWith('http') ? href : `${this.baseUrl}${href}`
    };
  }

  private async scrapeMonthEvents(year: number, month: number): Promise<CalendarEntry[]> {
    const monthUrl = `${this.calendarUrl}${year}-${month.toString().padStart(2, '0')}`;
    const html = await this.fetchPage(monthUrl);
    const $ = cheerio.load(html);

    const events: CalendarEntry[] = [];

    // Find calendar days with events
    $('.calendar-month .date-box').each((_, dayElement) => {
      const $day = $(dayElement);
      const dayNumber = $day.find('.day-number').text().trim();

      if (!dayNumber) return;

      const date = `${year}-${month.toString().padStart(2, '0')}-${dayNumber.padStart(2, '0')}`;

      // Find all event links for this day
      $day.find('a').each((_, linkElement) => {
        const $link = $(linkElement);
        const eventData = this.parseEventFromLink($link, $);

        if (eventData.title) {
          events.push({
            ...eventData,
            date,
            scraped_at: new Date().toISOString()
          } as CalendarEntry);
        }
      });
    });

    // Alternative parsing - look for calendar table structure
    if (events.length === 0) {
      $('.calendar td').each((_, cell) => {
        const $cell = $(cell);
        const dayMatch = $cell.text().match(/^\s*(\d{1,2})\s/);

        if (dayMatch) {
          const dayNumber = dayMatch[1];
          const date = `${year}-${month.toString().padStart(2, '0')}-${dayNumber.padStart(2, '0')}`;

          $cell.find('a').each((_, linkElement) => {
            const $link = $(linkElement);
            const eventData = this.parseEventFromLink($link, $);

            if (eventData.title) {
              events.push({
                ...eventData,
                date,
                scraped_at: new Date().toISOString()
              } as CalendarEntry);
            }
          });
        }
      });
    }

    console.log(`Found ${events.length} events for ${year}-${month}`);
    return events;
  }

  async scrapeEventDetails(event: CalendarEntry): Promise<CalendarEntry> {
    try {
      if (!event.source_url) return event;

      const html = await this.fetchPage(event.source_url);
      const $ = cheerio.load(html);

      // Try to extract more detailed information
      const description = $('.field-name-body .field-item').text().trim() ||
                         $('.event-description').text().trim() ||
                         $('.content').text().trim();

      const eventType = $('.field-name-field-event-type .field-item').text().trim() ||
                       $('.event-type').text().trim();

      return {
        ...event,
        description: description ? description.substring(0, 500) : undefined, // Limit description length
        event_type: eventType || undefined
      };
    } catch (error) {
      console.error(`Error fetching event details for ${event.source_url}:`, error);
      return event; // Return original event if details fetch fails
    }
  }

  async scrapeCalendar(startDate: Date, endDate: Date, progressCallback?: (progress: ScrapingProgress) => void): Promise<void> {
    await supabaseDb.init();

    let currentDate = new Date(startDate);
    let totalEntries = 0;

    while (!isAfter(currentDate, endDate)) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const monthString = format(currentDate, 'MMMM yyyy');

      try {
        if (progressCallback) {
          progressCallback({
            currentMonth: monthString,
            totalEntries,
            currentEntries: 0,
            isComplete: false
          });
        }

        const events = await this.scrapeMonthEvents(year, month);

        for (let i = 0; i < events.length; i++) {
          const event = events[i];

          // Get detailed information for each event
          const detailedEvent = await this.scrapeEventDetails(event);

          try {
            await supabaseDb.insertEntry(detailedEvent);
            totalEntries++;

            if (progressCallback) {
              progressCallback({
                currentMonth: monthString,
                totalEntries,
                currentEntries: i + 1,
                isComplete: false
              });
            }
          } catch (error) {
            console.error('Error inserting event:', error);
          }
        }

      } catch (error) {
        console.error(`Error scraping month ${monthString}:`, error);
        if (progressCallback) {
          progressCallback({
            currentMonth: monthString,
            totalEntries,
            currentEntries: 0,
            isComplete: false,
            error: `Error scraping ${monthString}: ${error}`
          });
        }
      }

      currentDate = addMonths(currentDate, 1);
    }

    if (progressCallback) {
      progressCallback({
        currentMonth: 'Complete',
        totalEntries,
        currentEntries: totalEntries,
        isComplete: true
      });
    }

    console.log(`Scraping complete. Total entries: ${totalEntries}`);
  }
}

export const calendarScraper = new CalendarScraper();
