import type { DeviceStatus } from '../types.ts'
import type { Cutter, Stapler } from './office-device.ts'

/** Guillotina de la sala de archivo. Puede perfilar y cortar. */
export class Guillotine implements Stapler, Cutter {
  readonly model = 'Guillotine Pro 3000'
  private stapledJobs: string[] = []

  constructor(
    readonly id: string,
    private status: DeviceStatus = 'ready',
  ) {}

  getStatus(): DeviceStatus {
    return this.status
  }

  staple(jobId: string): void {
    this.stapledJobs.push(jobId)
  }

  stapledJobIds(): string[] {
    return [...this.stapledJobs]
  }

  cut(pages: number): number {
    return pages
  }
}
