// In-memory database for serverless deployment
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
}

// In-memory storage
let entries: CalendarEntry[] = [];
let nextId = 1;

class MemoryDatabase {
  async init(): Promise<void> {
    console.log('Memory database initialized');
  }

  async insertEntry(entry: CalendarEntry): Promise<number> {
    // Check for duplicates
    const exists = entries.some(e =>
      e.title === entry.title &&
      e.date === entry.date &&
      e.time === entry.time &&
      e.source_url === entry.source_url
    );

    if (!exists) {
      const newEntry = { ...entry, id: nextId++ };
      entries.push(newEntry);
      return newEntry.id!;
    }

    return 0; // Entry already exists
  }

  async getAllEntries(): Promise<CalendarEntry[]> {
    return [...entries].sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return (a.time || '').localeCompare(b.time || '');
    });
  }

  async getEntriesByDateRange(startDate: string, endDate: string): Promise<CalendarEntry[]> {
    return entries
      .filter(entry => entry.date >= startDate && entry.date <= endDate)
      .sort((a, b) => {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }
        return (a.time || '').localeCompare(b.time || '');
      });
  }

  async getEntryCount(): Promise<number> {
    return entries.length;
  }

  async close(): Promise<void> {
    console.log('Memory database closed');
  }

  // Add method to populate demo data
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

    for (const event of sampleEvents) {
      await this.insertEntry(event);
    }

    console.log(`Demo data populated: ${sampleEvents.length} events added`);
  }
}

export const memoryDatabase = new MemoryDatabase();
