"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TimestampManager,
  type TimestampEvent,
  type TimestampProject,
  type ExportFormat,
} from "@/lib/timestamp-manager"
import {
  Clock,
  Download,
  Upload,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"

interface TimestampTrackerProps {
  totalDuration: number
  frameRate?: number
  initialEvents?: TimestampEvent[]
  onEventSelect?: (event: TimestampEvent) => void
  onTimeSeek?: (time: number) => void
}

export function TimestampTracker({
  totalDuration,
  frameRate = 30,
  initialEvents = [],
  onEventSelect,
  onTimeSeek,
}: TimestampTrackerProps) {
  const [manager] = useState(() => new TimestampManager("Game Show Video", totalDuration, frameRate))
  const [project, setProject] = useState<TimestampProject>()
  const [selectedEvent, setSelectedEvent] = useState<TimestampEvent | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [validationIssues, setValidationIssues] = useState<
    Array<{ type: "error" | "warning"; message: string; eventId?: string }>
  >([])
  const [exportFormat, setExportFormat] = useState<ExportFormat>("json")
  const [newEventForm, setNewEventForm] = useState({
    event: "",
    time: 0,
    duration: 5,
    type: "custom" as TimestampEvent["type"],
    description: "",
  })

  const timelineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    manager.setUpdateCallback(setProject)

    // Import initial events
    if (initialEvents.length > 0) {
      manager.importEvents(initialEvents)
    }

    setProject(manager.getProject())
  }, [manager, initialEvents])

  useEffect(() => {
    // Validate timestamps when project changes
    if (project) {
      const issues = manager.validateTimestamps()
      setValidationIssues(issues)
    }
  }, [project, manager])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`
  }

  const handleAddEvent = () => {
    if (!newEventForm.event.trim()) return

    const mainTrack = project?.tracks[0]
    if (mainTrack) {
      manager.addEvent(mainTrack.id, {
        event: newEventForm.event,
        time: newEventForm.time,
        duration: newEventForm.duration,
        type: newEventForm.type,
        description: newEventForm.description,
      })

      // Reset form
      setNewEventForm({
        event: "",
        time: currentTime,
        duration: 5,
        type: "custom",
        description: "",
      })
    }
  }

  const handleUpdateEvent = (eventId: string, updates: Partial<TimestampEvent>) => {
    manager.updateEvent(eventId, updates)
  }

  const handleDeleteEvent = (eventId: string) => {
    manager.deleteEvent(eventId)
    if (selectedEvent?.id === eventId) {
      setSelectedEvent(null)
    }
  }

  const handleEventClick = (event: TimestampEvent) => {
    setSelectedEvent(event)
    setCurrentTime(event.time)
    onEventSelect?.(event)
    onTimeSeek?.(event.time)
  }

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const time = percentage * totalDuration

    setCurrentTime(Math.max(0, Math.min(time, totalDuration)))
    onTimeSeek?.(time)
  }

  const exportTimestamps = () => {
    const data = manager.exportToFormat(exportFormat)
    const blob = new Blob([data], {
      type: exportFormat === "json" ? "application/json" : "text/plain",
    })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `timestamps-${Date.now()}.${exportFormat}`
    a.click()

    URL.revokeObjectURL(url)
  }

  const importTimestamps = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (manager.loadFromJSON(content)) {
        setProject(manager.getProject())
      }
    }
    reader.readAsText(file)
  }

  if (!project) return null

  const allEvents = manager.getAllEvents()
  const currentTimePercentage = (currentTime / totalDuration) * 100

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timestamp Tracker
          </CardTitle>
          <CardDescription>Manage and export timestamps for your video project</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="timeline" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="validation">Validation</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="space-y-4">
              {/* Timeline Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Timeline View</CardTitle>
                  <CardDescription>
                    Current time: {formatTime(currentTime)} / {formatTime(totalDuration)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Timeline */}
                    <div
                      ref={timelineRef}
                      className="relative h-20 bg-muted rounded-lg cursor-pointer overflow-hidden"
                      onClick={handleTimelineClick}
                    >
                      {/* Time markers */}
                      <div className="absolute inset-0 flex">
                        {Array.from({ length: 11 }, (_, i) => (
                          <div key={i} className="flex-1 border-r border-border/50 text-xs text-muted-foreground p-1">
                            {formatTime((i / 10) * totalDuration)}
                          </div>
                        ))}
                      </div>

                      {/* Events */}
                      {allEvents.map((event) => {
                        const left = (event.time / totalDuration) * 100
                        const width = (event.duration / totalDuration) * 100

                        return (
                          <div
                            key={event.id}
                            className={`absolute top-8 h-8 rounded cursor-pointer transition-colors ${
                              selectedEvent?.id === event.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            }`}
                            style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEventClick(event)
                            }}
                            title={`${event.event} (${formatTime(event.time)})`}
                          >
                            <div className="px-1 text-xs truncate leading-8">{event.event}</div>
                          </div>
                        )
                      })}

                      {/* Current time indicator */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                        style={{ left: `${currentTimePercentage}%` }}
                      />
                    </div>

                    {/* Playback controls */}
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="outline" size="sm">
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setIsPlaying(!isPlaying)}>
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="sm">
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Add New Event */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Add New Event</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="event-name">Event Name</Label>
                      <Input
                        id="event-name"
                        value={newEventForm.event}
                        onChange={(e) => setNewEventForm((prev) => ({ ...prev, event: e.target.value }))}
                        placeholder="Enter event name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="event-type">Type</Label>
                      <Select
                        value={newEventForm.type}
                        onValueChange={(value: TimestampEvent["type"]) =>
                          setNewEventForm((prev) => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="question">Question</SelectItem>
                          <SelectItem value="answer-text">Answer Text</SelectItem>
                          <SelectItem value="result-reveal">Result Reveal</SelectItem>
                          <SelectItem value="transition">Transition</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="event-time">Time (seconds)</Label>
                      <Input
                        id="event-time"
                        type="number"
                        min="0"
                        max={totalDuration}
                        step="0.1"
                        value={newEventForm.time}
                        onChange={(e) =>
                          setNewEventForm((prev) => ({ ...prev, time: Number.parseFloat(e.target.value) || 0 }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="event-duration">Duration (seconds)</Label>
                      <Input
                        id="event-duration"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={newEventForm.duration}
                        onChange={(e) =>
                          setNewEventForm((prev) => ({ ...prev, duration: Number.parseFloat(e.target.value) || 1 }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-description">Description (optional)</Label>
                    <Textarea
                      id="event-description"
                      value={newEventForm.description}
                      onChange={(e) => setNewEventForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Add description or notes"
                      rows={2}
                    />
                  </div>
                  <Button onClick={handleAddEvent} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="space-y-4">
              <div className="space-y-3">
                {allEvents.map((event) => (
                  <Card
                    key={event.id}
                    className={`cursor-pointer transition-colors ${
                      selectedEvent?.id === event.id ? "ring-2 ring-primary" : "hover:bg-muted/50"
                    }`}
                    onClick={() => handleEventClick(event)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{event.event}</h4>
                            <Badge variant="outline" className="capitalize">
                              {event.type.replace("-", " ")}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>
                              Time: {formatTime(event.time)} - {formatTime(event.time + event.duration)}
                            </div>
                            <div>Duration: {event.duration}s</div>
                            {event.description && <div>Description: {event.description}</div>}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              // Open edit dialog
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteEvent(event.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {allEvents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No events added yet</p>
                    <p className="text-sm">Add events using the timeline or events tab</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Validation Tab */}
            <TabsContent value="validation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    {validationIssues.length === 0 ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                    )}
                    Validation Results
                  </CardTitle>
                  <CardDescription>
                    {validationIssues.length === 0
                      ? "All timestamps are valid"
                      : `Found ${validationIssues.length} issue(s)`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {validationIssues.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                      <p>All timestamps are valid!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {validationIssues.map((issue, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            issue.type === "error"
                              ? "bg-red-50 border-red-200 text-red-800"
                              : "bg-orange-50 border-orange-200 text-orange-800"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {issue.type === "error" ? (
                              <AlertTriangle className="h-4 w-4 mt-0.5 text-red-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 mt-0.5 text-orange-500" />
                            )}
                            <div>
                              <p className="font-medium capitalize">{issue.type}</p>
                              <p className="text-sm">{issue.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Export Tab */}
            <TabsContent value="export" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Export Timestamps</CardTitle>
                  <CardDescription>Export your timestamps in various formats</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="export-format">Export Format</Label>
                    <Select value={exportFormat} onValueChange={(value: ExportFormat) => setExportFormat(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="json">JSON (Structured Data)</SelectItem>
                        <SelectItem value="srt">SRT (Subtitles)</SelectItem>
                        <SelectItem value="vtt">VTT (Web Subtitles)</SelectItem>
                        <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                        <SelectItem value="xml">XML (Structured)</SelectItem>
                        <SelectItem value="fcpxml">FCPXML (Final Cut Pro)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={exportTimestamps} className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Export Timestamps
                    </Button>
                    <Button variant="outline" className="flex-1 bg-transparent" asChild>
                      <label>
                        <Upload className="h-4 w-4 mr-2" />
                        Import JSON
                        <input type="file" accept=".json" onChange={importTimestamps} className="hidden" />
                      </label>
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>
                      <strong>Format descriptions:</strong>
                    </p>
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                      <li>
                        <strong>JSON:</strong> Complete project data with all metadata
                      </li>
                      <li>
                        <strong>SRT:</strong> Standard subtitle format for video players
                      </li>
                      <li>
                        <strong>VTT:</strong> Web-compatible subtitle format
                      </li>
                      <li>
                        <strong>CSV:</strong> Spreadsheet format for data analysis
                      </li>
                      <li>
                        <strong>XML:</strong> Structured format for other applications
                      </li>
                      <li>
                        <strong>FCPXML:</strong> Import markers into Final Cut Pro
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
