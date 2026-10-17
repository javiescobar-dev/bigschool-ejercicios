import { formatMoney } from './formatting.ts'

export interface ReportRow {
  label: string
  value: number
}

// ---------------------------------------------------------------------------
// Sistema de caché con estrategias de evicción intercambiables
// ---------------------------------------------------------------------------

export type CacheEvictionStrategy = 'lru' | 'fifo' | 'lfu' | 'none'

export interface CacheEntry<TValue> {
  value: TValue
  insertedAt: number
  lastAccessedAt: number
  hits: number
}

export interface ReportCache<TValue> {
  get(key: string): TValue | undefined
  set(key: string, value: TValue): void
  clear(): void
  size(): number
}

class LruCache<TValue> implements ReportCache<TValue> {
  private readonly entries = new Map<string, CacheEntry<TValue>>()
  constructor(private readonly maxEntries: number) {}

  get(key: string): TValue | undefined {
    const entry = this.entries.get(key)
    if (!entry) return undefined
    entry.lastAccessedAt = Date.now()
    entry.hits += 1
    return entry.value
  }

  set(key: string, value: TValue): void {
    if (this.entries.size >= this.maxEntries) {
      let oldestKey: string | undefined
      let oldestAccess = Number.POSITIVE_INFINITY
      for (const [candidateKey, entry] of this.entries) {
        if (entry.lastAccessedAt < oldestAccess) {
          oldestAccess = entry.lastAccessedAt
          oldestKey = candidateKey
        }
      }
      if (oldestKey !== undefined) this.entries.delete(oldestKey)
    }
    this.entries.set(key, { value, insertedAt: Date.now(), lastAccessedAt: Date.now(), hits: 0 })
  }

  clear(): void {
    this.entries.clear()
  }
  size(): number {
    return this.entries.size
  }
}

class FifoCache<TValue> implements ReportCache<TValue> {
  private readonly entries = new Map<string, CacheEntry<TValue>>()
  constructor(private readonly maxEntries: number) {}

  get(key: string): TValue | undefined {
    return this.entries.get(key)?.value
  }

  set(key: string, value: TValue): void {
    if (this.entries.size >= this.maxEntries) {
      const firstKey = this.entries.keys().next().value
      if (firstKey !== undefined) this.entries.delete(firstKey)
    }
    this.entries.set(key, { value, insertedAt: Date.now(), lastAccessedAt: Date.now(), hits: 0 })
  }

  clear(): void {
    this.entries.clear()
  }
  size(): number {
    return this.entries.size
  }
}

class LfuCache<TValue> implements ReportCache<TValue> {
  private readonly entries = new Map<string, CacheEntry<TValue>>()
  constructor(private readonly maxEntries: number) {}

  get(key: string): TValue | undefined {
    const entry = this.entries.get(key)
    if (!entry) return undefined
    entry.hits += 1
    return entry.value
  }

  set(key: string, value: TValue): void {
    if (this.entries.size >= this.maxEntries) {
      let leastUsedKey: string | undefined
      let leastHits = Number.POSITIVE_INFINITY
      for (const [candidateKey, entry] of this.entries) {
        if (entry.hits < leastHits) {
          leastHits = entry.hits
          leastUsedKey = candidateKey
        }
      }
      if (leastUsedKey !== undefined) this.entries.delete(leastUsedKey)
    }
    this.entries.set(key, { value, insertedAt: Date.now(), lastAccessedAt: Date.now(), hits: 0 })
  }

  clear(): void {
    this.entries.clear()
  }
  size(): number {
    return this.entries.size
  }
}

class NoOpCache<TValue> implements ReportCache<TValue> {
  get(_key: string): TValue | undefined {
    return undefined
  }
  set(_key: string, _value: TValue): void {}
  clear(): void {}
  size(): number {
    return 0
  }
}

export function createCache<TValue>(
  strategy: CacheEvictionStrategy,
  maxEntries: number,
): ReportCache<TValue> {
  switch (strategy) {
    case 'lru':
      return new LruCache<TValue>(maxEntries)
    case 'fifo':
      return new FifoCache<TValue>(maxEntries)
    case 'lfu':
      return new LfuCache<TValue>(maxEntries)
    case 'none':
    default:
      return new NoOpCache<TValue>()
  }
}

// ---------------------------------------------------------------------------
// Sistema de plugins
// ---------------------------------------------------------------------------

export interface ReportPlugin<TRow extends ReportRow> {
  name: string
  priority?: number
  beforeRender?(rows: TRow[]): TRow[]
  afterRender?(output: string): string
  onError?(error: Error): void
}

export class PluginRegistry<TRow extends ReportRow> {
  private readonly plugins = new Map<string, ReportPlugin<TRow>>()

  register(plugin: ReportPlugin<TRow>): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`El plugin "${plugin.name}" ya está registrado`)
    }
    this.plugins.set(plugin.name, plugin)
  }

  unregister(name: string): boolean {
    return this.plugins.delete(name)
  }

  get(name: string): ReportPlugin<TRow> | undefined {
    return this.plugins.get(name)
  }

  all(): ReportPlugin<TRow>[] {
    return [...this.plugins.values()].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  }
}

// ---------------------------------------------------------------------------
// Renderizado
// ---------------------------------------------------------------------------

export interface ReportRenderer<TRow extends ReportRow> {
  render(rows: TRow[], title: string, includeFooter: boolean): string
}

export abstract class AbstractReportRendererFactory<TRow extends ReportRow> {
  abstract createRenderer(): ReportRenderer<TRow>
}

class TextReportRenderer<TRow extends ReportRow> implements ReportRenderer<TRow> {
  render(rows: TRow[], title: string, includeFooter: boolean): string {
    const lines = [title, '='.repeat(title.length)]
    for (const row of rows) {
      lines.push(`${row.label.padEnd(20, '.')} ${formatMoney(row.value)}`)
    }
    if (includeFooter) {
      const total = rows.reduce((sum, row) => sum + row.value, 0)
      lines.push('-'.repeat(title.length))
      lines.push(`${'TOTAL'.padEnd(20, '.')} ${formatMoney(total)}`)
    }
    return lines.join('\n')
  }
}

export class TextReportRendererFactory<
  TRow extends ReportRow,
> extends AbstractReportRendererFactory<TRow> {
  createRenderer(): ReportRenderer<TRow> {
    return new TextReportRenderer<TRow>()
  }
}

// ---------------------------------------------------------------------------
// Motor
// ---------------------------------------------------------------------------

export interface RetryPolicy {
  attempts: number
  backoffMs: number
  jitter: boolean
  retryOn?: (error: Error) => boolean
}

export interface ReportOptions<TRow extends ReportRow> {
  title?: string
  locale?: string
  timezone?: string
  cacheStrategy?: CacheEvictionStrategy
  maxCacheEntries?: number
  retry?: RetryPolicy
  plugins?: ReportPlugin<TRow>[]
  pageSize?: number
  includeFooter?: boolean
  experimentalStreaming?: boolean
  onProgress?: (percent: number) => void
  onComplete?: (output: string) => void
  onError?: (error: Error) => void
}

const DEFAULT_OPTIONS: Required<Pick<ReportOptions<ReportRow>, 'cacheStrategy' | 'maxCacheEntries' | 'includeFooter' | 'locale' | 'pageSize'>> = {
  cacheStrategy: 'none',
  maxCacheEntries: 100,
  includeFooter: true,
  locale: 'es-ES',
  pageSize: 50,
}

export class ReportEngine<TRow extends ReportRow> {
  private readonly registry = new PluginRegistry<TRow>()
  private readonly cache: ReportCache<string>
  private readonly renderer: ReportRenderer<TRow>
  private readonly options: ReportOptions<TRow>

  constructor(
    options: ReportOptions<TRow> = {},
    rendererFactory: AbstractReportRendererFactory<TRow> = new TextReportRendererFactory<TRow>(),
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.cache = createCache<string>(
      this.options.cacheStrategy ?? 'none',
      this.options.maxCacheEntries ?? 100,
    )
    this.renderer = rendererFactory.createRenderer()
    for (const plugin of options.plugins ?? []) {
      this.registry.register(plugin)
    }
  }

  generate(rows: TRow[], title: string): string {
    const cacheKey = `${title}:${rows.length}`
    const cached = this.cache.get(cacheKey)
    if (cached !== undefined) return cached

    let processed = rows
    for (const plugin of this.registry.all()) {
      if (plugin.beforeRender) processed = plugin.beforeRender(processed)
    }

    let output = this.renderer.render(processed, title, this.options.includeFooter ?? true)

    for (const plugin of this.registry.all()) {
      if (plugin.afterRender) output = plugin.afterRender(output)
    }

    this.cache.set(cacheKey, output)
    this.options.onComplete?.(output)
    return output
  }
}

/** Punto de entrada que usa toda la aplicación para producir un informe. */
export function generateReport(rows: ReportRow[], title: string): string {
  return new ReportEngine<ReportRow>().generate(rows, title)
}
