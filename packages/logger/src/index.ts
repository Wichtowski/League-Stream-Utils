type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  msg: string;
  ts: string;
  requestId?: string;
  [key: string]: unknown;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

const MIN_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) ?? 'info';
const IS_PROD = process.env.NODE_ENV === 'production';

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[MIN_LEVEL];
}

function formatEntry(entry: LogEntry): string {
  if (IS_PROD) return JSON.stringify(entry);
  const { level, msg, ts, requestId, ...rest } = entry;
  const rid = requestId ? ` [${requestId}]` : '';
  const extra = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : '';
  return `${ts} ${level.toUpperCase().padEnd(5)}${rid} ${msg}${extra}`;
}

function emit(level: LogLevel, msg: string, meta?: Record<string, unknown>) {
  if (!shouldLog(level)) return;
  const entry: LogEntry = { level, msg, ts: new Date().toISOString(), ...meta };
  const formatted = formatEntry(entry);
  if (level === 'error') console.error(formatted);
  else if (level === 'warn') console.warn(formatted);
  else console.log(formatted);
}

export function createLogger(context: string) {
  function log(level: LogLevel, msg: string, meta?: Record<string, unknown>) {
    emit(level, msg, { context, ...meta });
  }

  return {
    debug: (msg: string, meta?: Record<string, unknown>) => log('debug', msg, meta),
    info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
    warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
    error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
    child: (requestId: string) => ({
      debug: (msg: string, meta?: Record<string, unknown>) => log('debug', msg, { requestId, ...meta }),
      info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, { requestId, ...meta }),
      warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, { requestId, ...meta }),
      error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, { requestId, ...meta }),
    }),
  };
}

export type Logger = ReturnType<typeof createLogger>;
export type ChildLogger = ReturnType<Logger['child']>;

let requestCounter = 0;
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${(++requestCounter).toString(36)}`;
}
