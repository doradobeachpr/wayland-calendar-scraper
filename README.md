# Wayland Calendar Scraper

**Production-ready web scraping tool to extract and export calendar events from the Town of Wayland, MA website with Supabase database integration.**

## 🚀 Features

- **Real-time Calendar Scraping** - Extract events from wayland.ma.us by month
- **Supabase Database Integration** - Persistent PostgreSQL storage
- **Professional Dashboard** - Modern UI built with Next.js 15 + shadcn/ui
- **CSV Export with Hyperlinks** - Excel-compatible downloads
- **Demo Mode** - 15 authentic Wayland town event samples
- **Production Ready** - Full error handling and duplicate prevention

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Supabase PostgreSQL, Next.js API Routes
- **Scraping:** Cheerio + Axios with retry logic
- **Date Handling:** date-fns for formatting and calculations
- **CSV Generation:** Custom CSV export with hyperlink formulas

## ⚡ Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/doradobeachpr/wayland-calendar-scraper.git
cd wayland-calendar-scraper
```

### 2. Install Dependencies
```bash
bun install
```

### 3. Setup Supabase Database

#### a) Create Supabase Project
1. Go to [Supabase Dashboard](https://app.supabase.co/)
2. Create a new project
3. Note your project URL and anon key

#### b) Run Database Schema
1. Open Supabase SQL Editor
2. Copy and run the SQL from `supabase-schema.sql`
3. This creates the `calendar_entries` table with proper indexes and RLS policies

### 4. Configure Environment Variables
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Start Development Server
```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📊 Usage

### Demo Mode
1. Click **"Populate Demo Data"** to load 15 sample Wayland town events
2. Test export functionality with realistic data

### Live Scraping
1. Set your desired date range (e.g., Sept 1 - Dec 31, 2025)
2. Click **"Start Scraping"** to extract real events from wayland.ma.us
3. Events are automatically stored in your Supabase database

### Export Data
- **Export CSV** - Standard format with all event details
- **Export CSV with Hyperlinks** - Excel-compatible with clickable source links

### Database Management
- **Clear All Data** - Remove all entries from database
- View real-time statistics and recent events

## 🏗️ Database Schema

The application uses a single `calendar_entries` table:

```sql
CREATE TABLE calendar_entries (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT,
  department TEXT,
  committee TEXT,
  event_type TEXT,
  description TEXT,
  source_url TEXT NOT NULL,
  scraped_at TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 📅 Sample Data

Demo mode includes authentic Wayland town events:
- Board of Assessors meetings
- Select Board sessions
- Planning Board hearings
- School Committee meetings
- Conservation Commission reviews
- Finance Committee discussions
- And 9 more town departments

## 🔧 Production Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

### Railway
1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically

### Netlify
Note: Requires server-side functionality, use Netlify Functions or consider Vercel/Railway

## 🛡️ Technical Notes

### Cloudflare Protection
The target website (wayland.ma.us) uses Cloudflare anti-bot protection. For production scraping at scale:

1. **Browser Automation** - Integrate Puppeteer or Playwright
2. **Proxy Rotation** - Use residential proxy services
3. **Request Throttling** - Built-in 1-second delays between requests
4. **User Agent Rotation** - Modern browser headers included

### Error Handling
- Automatic retry logic (3 attempts per request)
- Duplicate entry prevention
- Comprehensive logging
- Graceful failure recovery

## 📄 CSV Export Format

### Standard CSV
```csv
Event Title,Date,Time,Department,Committee,Event Type,Description,Source Link,Formatted Date,Scraped At
Board of Assessors,2025-09-04,6:00pm,board-assessors,Board of Assessors,Public Meeting,"Regular monthly meeting...",https://wayland.ma.us/...,Thursday September 4 2025,2025-09-10T...
```

### CSV with Hyperlinks
Includes Excel-compatible `=HYPERLINK()` formulas for clickable source links.

## 🎯 Key Features

### Professional Dashboard
- Real-time database statistics
- Department breakdown with badges
- Sample event previews
- Progress tracking for scraping operations

### Robust Scraping Engine
- Month-by-month navigation
- Comprehensive event parsing
- Cloudflare-ready headers
- Background processing

### Data Export
- Multiple CSV formats
- Date range filtering
- Hyperlink preservation
- Browser-compatible downloads

## 📝 API Endpoints

### `GET /api/scrape`
Returns current database summary and sample events.

### `POST /api/scrape`
Starts scraping process for specified date range.
```json
{
  "startDate": "2025-09-01",
  "endDate": "2025-12-31"
}
```

### `GET /api/export`
Returns export summary with statistics.

### `POST /api/export`
Generates and downloads CSV export.
```json
{
  "format": "csv-with-links",
  "includeDescription": true,
  "startDate": "2025-09-01",
  "endDate": "2025-12-31"
}
```

### `POST /api/demo`
Manages demo data and database operations.
```json
{
  "action": "populate" // or "clear"
}
```

## 🔐 Security

- Row Level Security (RLS) enabled in Supabase
- Public read/write policies for calendar data
- Environment variable protection for API keys
- Input validation and sanitization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **GitHub Issues** - Bug reports and feature requests
- **Documentation** - Comprehensive setup guides included
- **Community** - Active development and maintenance

---

**Built with ❤️ for the Wayland, MA community**

*This tool helps residents and officials access town meeting information in a convenient, searchable format.*
