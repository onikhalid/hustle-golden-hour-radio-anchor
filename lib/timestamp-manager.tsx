/* eslint-disable @typescript-eslint/no-explicit-any */
export interface TimestampEvent {
  id: string
  event: string
  time: number
  duration: number
  type: "question" | "answer-text" | "result-reveal" | "transition" | "custom"
  description?: string
  metadata?: Record<string, any>
}

export interface TimestampTrack {
  id: string
  name: string
  events: TimestampEvent[]
  color: string
  visible: boolean
}

export interface TimestampProject {
  id: string
  name: string
  totalDuration: number
  frameRate: number
  tracks: TimestampTrack[]
  createdAt: Date
  updatedAt: Date
  version: string
}

export type ExportFormat = "json" | "srt" | "vtt" | "csv" | "xml" | "fcpxml"

export class TimestampManager {
  private project: TimestampProject
  private onUpdateCallback?: (project: TimestampProject) => void

  constructor(projectName: string, totalDuration: number, frameRate = 30) {
    this.project = {
      id: `project-${Date.now()}`,
      name: projectName,
      totalDuration,
      frameRate,
      tracks: [
        {
          id: "main-track",
          name: "Main Events",
          events: [],
          color: "#8b5cf6",
          visible: true,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: "1.0.0",
    }
  }

  setUpdateCallback(callback: (project: TimestampProject) => void) {
    this.onUpdateCallback = callback
  }

  private notifyUpdate() {
    this.project.updatedAt = new Date()
    this.onUpdateCallback?.(this.project)
  }

  getProject(): TimestampProject {
    return { ...this.project }
  }

  addEvent(trackId: string, event: Omit<TimestampEvent, "id">): TimestampEvent {
    const newEvent: TimestampEvent = {
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }

    const track = this.project.tracks.find((t) => t.id === trackId)
    if (track) {
      track.events.push(newEvent)
      track.events.sort((a, b) => a.time - b.time) // Keep events sorted by time
      this.notifyUpdate()
    }

    return newEvent
  }

  updateEvent(eventId: string, updates: Partial<TimestampEvent>): boolean {
    for (const track of this.project.tracks) {
      const eventIndex = track.events.findIndex((e) => e.id === eventId)
      if (eventIndex !== -1) {
        track.events[eventIndex] = { ...track.events[eventIndex], ...updates }
        track.events.sort((a, b) => a.time - b.time)
        this.notifyUpdate()
        return true
      }
    }
    return false
  }

  deleteEvent(eventId: string): boolean {
    for (const track of this.project.tracks) {
      const eventIndex = track.events.findIndex((e) => e.id === eventId)
      if (eventIndex !== -1) {
        track.events.splice(eventIndex, 1)
        this.notifyUpdate()
        return true
      }
    }
    return false
  }

  addTrack(name: string, color = "#6b7280"): TimestampTrack {
    const newTrack: TimestampTrack = {
      id: `track-${Date.now()}`,
      name,
      events: [],
      color,
      visible: true,
    }

    this.project.tracks.push(newTrack)
    this.notifyUpdate()
    return newTrack
  }

  deleteTrack(trackId: string): boolean {
    if (this.project.tracks.length <= 1) return false // Keep at least one track

    const trackIndex = this.project.tracks.findIndex((t) => t.id === trackId)
    if (trackIndex !== -1) {
      this.project.tracks.splice(trackIndex, 1)
      this.notifyUpdate()
      return true
    }
    return false
  }

  importEvents(events: TimestampEvent[], trackId?: string): void {
    const targetTrackId = trackId || this.project.tracks[0].id
    const track = this.project.tracks.find((t) => t.id === targetTrackId)

    if (track) {
      events.forEach((event) => {
        this.addEvent(targetTrackId, event)
      })
    }
  }

  getAllEvents(): TimestampEvent[] {
    return this.project.tracks.flatMap((track) => track.events).sort((a, b) => a.time - b.time)
  }

  getEventsInRange(startTime: number, endTime: number): TimestampEvent[] {
    return this.getAllEvents().filter((event) => event.time >= startTime && event.time <= endTime)
  }

  validateTimestamps(): Array<{ type: "error" | "warning"; message: string; eventId?: string }> {
    const issues: Array<{ type: "error" | "warning"; message: string; eventId?: string }> = []
    const allEvents = this.getAllEvents()

    // Check for overlapping events
    for (let i = 0; i < allEvents.length - 1; i++) {
      const current = allEvents[i]
      const next = allEvents[i + 1]

      if (current.time + current.duration > next.time) {
        issues.push({
          type: "warning",
          message: `Event "${current.event}" overlaps with "${next.event}"`,
          eventId: current.id,
        })
      }
    }

    // Check for events beyond total duration
    allEvents.forEach((event) => {
      if (event.time + event.duration > this.project.totalDuration) {
        issues.push({
          type: "error",
          message: `Event "${event.event}" extends beyond video duration`,
          eventId: event.id,
        })
      }
    })

    // Check for negative times
    allEvents.forEach((event) => {
      if (event.time < 0) {
        issues.push({
          type: "error",
          message: `Event "${event.event}" has negative timestamp`,
          eventId: event.id,
        })
      }
    })

    return issues
  }

  exportToFormat(format: ExportFormat): string {
    switch (format) {
      case "json":
        return this.exportToJSON()
      case "srt":
        return this.exportToSRT()
      case "vtt":
        return this.exportToVTT()
      case "csv":
        return this.exportToCSV()
      case "xml":
        return this.exportToXML()
      case "fcpxml":
        return this.exportToFCPXML()
      default:
        return this.exportToJSON()
    }
  }

  private exportToJSON(): string {
    return JSON.stringify(
      {
        project: this.project.name,
        totalDuration: this.project.totalDuration,
        frameRate: this.project.frameRate,
        exportedAt: new Date().toISOString(),
        events: this.getAllEvents().map((event) => ({
          time: event.time,
          duration: event.duration,
          event: event.event,
          type: event.type,
          description: event.description,
          metadata: event.metadata,
        })),
      },
      null,
      2,
    )
  }

  private exportToSRT(): string {
    const events = this.getAllEvents()
    return events
      .map((event, index) => {
        const startTime = this.formatSRTTime(event.time)
        const endTime = this.formatSRTTime(event.time + event.duration)

        return `${index + 1}\n${startTime} --> ${endTime}\n${event.event}\n`
      })
      .join("\n")
  }

  private exportToVTT(): string {
    const events = this.getAllEvents()
    let vtt = "WEBVTT\n\n"

    events.forEach((event) => {
      const startTime = this.formatVTTTime(event.time)
      const endTime = this.formatVTTTime(event.time + event.duration)
      vtt += `${startTime} --> ${endTime}\n${event.event}\n\n`
    })

    return vtt
  }

  private exportToCSV(): string {
    const events = this.getAllEvents()
    let csv = "Time,Duration,Event,Type,Description\n"

    events.forEach((event) => {
      csv += `${event.time},${event.duration},"${event.event}","${event.type}","${event.description || ""}"\n`
    })

    return csv
  }

  private exportToXML(): string {
    const events = this.getAllEvents()
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<timestamps>\n'

    events.forEach((event) => {
      xml += `  <event>\n`
      xml += `    <time>${event.time}</time>\n`
      xml += `    <duration>${event.duration}</duration>\n`
      xml += `    <name>${this.escapeXML(event.event)}</name>\n`
      xml += `    <type>${event.type}</type>\n`
      if (event.description) {
        xml += `    <description>${this.escapeXML(event.description)}</description>\n`
      }
      xml += `  </event>\n`
    })

    xml += "</timestamps>"
    return xml
  }

  private exportToFCPXML(): string {
    // Simplified Final Cut Pro XML export
    const events = this.getAllEvents()
    let fcpxml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    fcpxml += '<fcpxml version="1.8">\n'
    fcpxml += '  <project name="' + this.project.name + '">\n'
    fcpxml += "    <sequence>\n"

    events.forEach((event) => {
      const startFrame = Math.round(event.time * this.project.frameRate)
      const durationFrames = Math.round(event.duration * this.project.frameRate)

      fcpxml += `      <marker start="${startFrame}" duration="${durationFrames}" value="${this.escapeXML(event.event)}" />\n`
    })

    fcpxml += "    </sequence>\n"
    fcpxml += "  </project>\n"
    fcpxml += "</fcpxml>"

    return fcpxml
  }

  private formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`
  }

  private formatVTTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toFixed(3).padStart(6, "0")}`
    } else {
      return `${minutes.toString().padStart(2, "0")}:${secs.toFixed(3).padStart(6, "0")}`
    }
  }

  private escapeXML(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;")
  }

  loadFromJSON(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)

      if (data.events && Array.isArray(data.events)) {
        // Clear existing events
        this.project.tracks.forEach((track) => {
          track.events = []
        })

        // Import events
        data.events.forEach((eventData: any) => {
          this.addEvent(this.project.tracks[0].id, {
            event: eventData.event,
            time: eventData.time,
            duration: eventData.duration,
            type: eventData.type || "custom",
            description: eventData.description,
            metadata: eventData.metadata,
          })
        })

        return true
      }
    } catch (error) {
      console.error("Failed to load timestamp data:", error)
    }

    return false
  }
}
