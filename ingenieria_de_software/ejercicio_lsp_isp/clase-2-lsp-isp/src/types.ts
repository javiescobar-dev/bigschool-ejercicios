export type DeviceStatus = 'ready' | 'busy' | 'offline'

export interface OfficeDocument {
  id: string
  name: string
  pages: number
  content: string
}

export interface PrintJob {
  jobId: string
  deviceId: string
  copies: number
  pages: number
}

export interface FaxReceipt {
  deviceId: string
  number: string
  pages: number
}
