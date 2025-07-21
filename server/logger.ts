import fs from 'fs';
import path from 'path';

const logFile = path.join(process.cwd(), 'db-queries.log');

export function logQuery(query: string, params?: any[], duration?: number) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    query: query.replace(/\s+/g, ' ').trim(),
    params: params || [],
    duration: duration ? `${duration}ms` : undefined
  };
  
  const logLine = `${timestamp} - ${JSON.stringify(logEntry)}\n`;
  
  try {
    fs.appendFileSync(logFile, logLine);
  } catch (error) {
    console.error('Failed to write to query log:', error);
  }
}

export function logQuerySync(query: string, params?: any[]) {
  logQuery(query, params);
}