-- Supabase SQL Schema for Wayland Calendar Scraper
-- Run this in your Supabase SQL Editor to create the required table

-- Create calendar_entries table
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

-- Create indexes for better performance
CREATE INDEX idx_calendar_entries_date ON calendar_entries(date);
CREATE INDEX idx_calendar_entries_department ON calendar_entries(department);
CREATE INDEX idx_calendar_entries_committee ON calendar_entries(committee);
CREATE INDEX idx_calendar_entries_event_type ON calendar_entries(event_type);
CREATE INDEX idx_calendar_entries_created_at ON calendar_entries(created_at);

-- Create unique constraint to prevent duplicates
CREATE UNIQUE INDEX idx_calendar_entries_unique
ON calendar_entries(title, date, time, source_url);

-- Enable Row Level Security (RLS)
ALTER TABLE calendar_entries ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON calendar_entries
FOR SELECT USING (true);

-- Create policy to allow public insert access
CREATE POLICY "Allow public insert access" ON calendar_entries
FOR INSERT WITH CHECK (true);

-- Create policy to allow public update access
CREATE POLICY "Allow public update access" ON calendar_entries
FOR UPDATE USING (true);

-- Create policy to allow public delete access
CREATE POLICY "Allow public delete access" ON calendar_entries
FOR DELETE USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_calendar_entries_updated_at
BEFORE UPDATE ON calendar_entries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
