import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

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

class Database {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor() {
    this.dbPath = path.join(process.cwd(), 'wayland_calendar.db');
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          resolve();
        }
      });
    });
  }

  async init(): Promise<void> {
    if (!this.db) await this.connect();

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS calendar_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT,
        department TEXT,
        committee TEXT,
        event_type TEXT,
        description TEXT,
        source_url TEXT NOT NULL,
        scraped_at TEXT NOT NULL,
        UNIQUE(title, date, time, source_url)
      )
    `;

    return new Promise((resolve, reject) => {
      this.db!.run(createTableQuery, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database table created/verified');
          resolve();
        }
      });
    });
  }

  async insertEntry(entry: CalendarEntry): Promise<number> {
    if (!this.db) await this.connect();

    const insertQuery = `
      INSERT OR IGNORE INTO calendar_entries
      (title, date, time, department, committee, event_type, description, source_url, scraped_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      this.db!.run(
        insertQuery,
        [
          entry.title,
          entry.date,
          entry.time,
          entry.department,
          entry.committee,
          entry.event_type,
          entry.description,
          entry.source_url,
          entry.scraped_at
        ],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
  }

  async getAllEntries(): Promise<CalendarEntry[]> {
    if (!this.db) await this.connect();

    const selectQuery = `
      SELECT * FROM calendar_entries
      ORDER BY date ASC, time ASC
    `;

    return new Promise((resolve, reject) => {
      this.db!.all(selectQuery, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as CalendarEntry[]);
        }
      });
    });
  }

  async getEntriesByDateRange(startDate: string, endDate: string): Promise<CalendarEntry[]> {
    if (!this.db) await this.connect();

    const selectQuery = `
      SELECT * FROM calendar_entries
      WHERE date >= ? AND date <= ?
      ORDER BY date ASC, time ASC
    `;

    return new Promise((resolve, reject) => {
      this.db!.all(selectQuery, [startDate, endDate], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as CalendarEntry[]);
        }
      });
    });
  }

  async getEntryCount(): Promise<number> {
    if (!this.db) await this.connect();

    const countQuery = `SELECT COUNT(*) as count FROM calendar_entries`;

    return new Promise((resolve, reject) => {
      this.db!.get(countQuery, [], (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });
  }

  async close(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      this.db!.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database connection closed');
          resolve();
        }
      });
    });
  }
}

export const database = new Database();
