import { createClient } from '@supabase/supabase-js';

export interface CalendarEntry {
  id?: number;
  title: string;
  date: string; // ISO date string
  time?: string;
  department?: string;
  committee?: string;
  event_type?: string;
  description?: string;
  source_url: string;
  scraped_at: string; // ISO datetime string
  created_at?: string;
  updated_at?: string;
}

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

class SupabaseDatabase {
  async init(): Promise<void> {
    // Check if table exists, create if not
    try {
      const { data, error } = await supabase
        .from('calendar_entries')
        .select('id')
        .limit(1);

      if (error && error.message.includes('relation "calendar_entries" does not exist')) {
        // Table doesn't exist, we need to create it
        console.log('Calendar entries table needs to be created in Supabase dashboard');
      }

      console.log('Supabase database initialized');
    } catch (error) {
      console.error('Database initialization error:', error);
    }
  }

  async insertEntry(entry: CalendarEntry): Promise<number> {
    try {
      // Check for duplicates first
      const { data: existing } = await supabase
        .from('calendar_entries')
        .select('id')
        .eq('title', entry.title)
        .eq('date', entry.date)
        .eq('time', entry.time || '')
        .eq('source_url', entry.source_url)
        .single();

      if (existing) {
        return existing.id; // Entry already exists
      }

      const { data, error } = await supabase
        .from('calendar_entries')
        .insert([{
          title: entry.title,
          date: entry.date,
          time: entry.time,
          department: entry.department,
          committee: entry.committee,
          event_type: entry.event_type,
          description: entry.description,
          source_url: entry.source_url,
          scraped_at: entry.scraped_at
        }])
        .select('id')
        .single();

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      return data?.id || 0;
    } catch (error) {
      console.error('Error inserting entry:', error);
      throw error;
    }
  }

  async getAllEntries(): Promise<CalendarEntry[]> {
    try {
      const { data, error } = await supabase
        .from('calendar_entries')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) {
        console.error('Get all entries error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting all entries:', error);
      throw error;
    }
  }

  async getEntriesByDateRange(startDate: string, endDate: string): Promise<CalendarEntry[]> {
    try {
      const { data, error } = await supabase
        .from('calendar_entries')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) {
        console.error('Get entries by date range error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting entries by date range:', error);
      throw error;
    }
  }

  async getEntryCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('calendar_entries')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Get entry count error:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting entry count:', error);
      throw error;
    }
  }

  async clearAllEntries(): Promise<void> {
    try {
      const { error } = await supabase
        .from('calendar_entries')
        .delete()
        .neq('id', 0); // Delete all entries

      if (error) {
        console.error('Clear all entries error:', error);
        throw error;
      }

      console.log('All entries cleared from database');
    } catch (error) {
      console.error('Error clearing all entries:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    // Supabase client doesn't need explicit closing
    console.log('Supabase database connection closed');
  }

  // Demo data population
  async populateDemo(): Promise<void> {
    const sampleEvents: CalendarEntry[] = [
      {
        title: "Board of Assessors",
        date: "2025-09-04",
        time: "6:00pm",
        department: "board-assessors",
        committee: "Board of Assessors",
        event_type: "Public Meeting",
        description: "Regular monthly meeting of the Board of Assessors to review property assessments and address public concerns.",
        source_url: "https://www.wayland.ma.us/board-assessors/events/197066",
        scraped_at: new Date().toISOString()
      },
      {
        title: "Select Board",
        date: "2025-09-04",
        time: "6:30pm",
        department: "select-board",
        committee: "Select Board",
        event_type: "Public Meeting",
        description: "Regular meeting of the Select Board to discuss town business and policy matters.",
        source_url: "https://www.wayland.ma.us/select-board/events/197076",
        scraped_at: new Date().toISOString()
      },
      {
        title: "Historic District Commission",
        date: "2025-09-04",
        time: "7:00pm",
        department: "historic-district-commission",
        committee: "Historic District Commission",
        event_type: "Public Meeting",
        description: "Monthly meeting to review applications for changes to properties within the historic district.",
        source_url: "https://www.wayland.ma.us/historic-district-commission/events/196826",
        scraped_at: new Date().toISOString()
      },
      {
        title: "Planning Board",
        date: "2025-09-13",
        time: "7:00pm",
        department: "planning-department-board",
        committee: "Planning Board",
        event_type: "Public Meeting",
        description: "Regular meeting to review development proposals and zoning matters.",
        source_url: "https://www.wayland.ma.us/planning-department-board/events/197196",
        scraped_at: new Date().toISOString()
      },
      {
        title: "School Committee",
        date: "2025-09-18",
        time: "6:00pm",
        department: "school-committee",
        committee: "School Committee",
        event_type: "Public Meeting",
        description: "Regular meeting of the School Committee to discuss educational policies and budget matters.",
        source_url: "https://www.wayland.ma.us/school-committee/events/197506",
        scraped_at: new Date().toISOString()
      },
      {
        title: "Conservation Commission",
        date: "2025-09-20",
        time: "6:30pm",
        department: "conservation-commission",
        committee: "Conservation Commission",
        event_type: "Public Meeting",
        description: "Meeting to review wetland protection applications and conservation matters.",
        source_url: "https://www.wayland.ma.us/conservation-commission/events/197586",
        scraped_at: new Date().toISOString()
      },
      {
        title: "Finance Committee",
        date: "2025-09-28",
        time: "7:00pm",
        department: "finance-committee",
        committee: "Finance Committee",
        event_type: "Public Meeting",
        description: "Regular meeting to review town budget and financial matters.",
        source_url: "https://www.wayland.ma.us/finance-committee/events/197721",
        scraped_at: new Date().toISOString()
      },
      {
        title: "Board of Health",
        date: "2025-10-11",
        time: "6:30pm",
        department: "board-health",
        committee: "Board of Health",
        event_type: "Public Meeting",
        description: "Monthly meeting to address public health concerns and regulations.",
        source_url: "https://www.wayland.ma.us/board-health/events/197266",
        scraped_at: new Date().toISOString()
      },
      {
        title: "Recreation Commission",
        date: "2025-10-19",
        time: "10:30am",
        department: "recreation-commission",
        committee: "Recreation Commission",
        event_type: "Public Meeting",
        description: "Meeting to plan recreational activities and review facility usage.",
        source_url: "https://www.wayland.ma.us/recreation-commission/events/197556",
        scraped_at: new Date().toISOString()
      },
      {
        title: "Economic Development Committee",
        date: "2025-10-28",
        time: "1:30pm",
        department: "economic-development-committee",
        committee: "Economic Development Committee",
        event_type: "Public Meeting",
        description: "Committee meeting to discuss business development initiatives and economic growth strategies.",
        source_url: "https://www.wayland.ma.us/economic-development-committee/events/197846",
        scraped_at: new Date().toISOString()
      },
      {
        title: "Board of Library Trustees",
        date: "2025-11-20",
        time: "9:00am",
        department: "board-library-trustees",
        committee: "Board of Library Trustees",
        event_type: "Public Meeting",
        description: "Monthly meeting to oversee library operations and policies.",
        source_url: "https://www.wayland.ma.us/board-library-trustees/events/197486",
        scraped_at: new Date().toISOString()
      },
      {
        title: "Cultural Council",
        date: "2025-11-13",
        time: "7:00pm",
        department: "cultural-council",
        committee: "Cultural Council",
        event_type: "Public Meeting",
        description: "Meeting to review grant applications and plan cultural events for the community.",
        source_url: "https://www.wayland.ma.us/cultural-council/events/197346",
        scraped_at: new Date().toISOString()
      },
      {
        title: "Housing Partnership",
        date: "2025-12-13",
        time: "7:00pm",
        department: "housing-partnership",
        committee: "Housing Partnership",
        event_type: "Public Meeting",
        description: "Committee meeting to discuss affordable housing initiatives and policies.",
        source_url: "https://www.wayland.ma.us/housing-partnership/events/197326",
        scraped_at: new Date().toISOString()
      },
      {
        title: "Zoning Board of Appeals",
        date: "2025-12-12",
        time: "7:00pm",
        department: "zoning-board-appeals",
        committee: "Zoning Board of Appeals",
        event_type: "Public Hearing",
        description: "Public hearing for variance and special permit applications.",
        source_url: "https://www.wayland.ma.us/zoning-board-appeals/events/196876",
        scraped_at: new Date().toISOString()
      },
      {
        title: "Board of Public Works",
        date: "2025-12-02",
        time: "7:10pm",
        department: "board-public-works",
        committee: "Board of Public Works",
        event_type: "Public Meeting",
        description: "Regular meeting to discuss public works projects and infrastructure maintenance.",
        source_url: "https://www.wayland.ma.us/board-public-works/events/197981",
        scraped_at: new Date().toISOString()
      }
    ];

    let insertedCount = 0;
    for (const event of sampleEvents) {
      try {
        await this.insertEntry(event);
        insertedCount++;
      } catch (error: any) {
        // Log error but continue with other entries
        console.error('Error inserting demo event:', error);
      }
    }

    console.log(`Demo data populated: ${insertedCount} events added`);
  }
}

export const supabaseDb = new SupabaseDatabase();
