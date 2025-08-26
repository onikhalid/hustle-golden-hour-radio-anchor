"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, AlertCircle, Download, FileText, Baseline as Timeline } from "lucide-react"

interface ProcessingJob {
  id: string
  status: "pending" | "processing" | "completed" | "error"
  progress: number
  videos: Array<{
    id: string
    name: string
  }>
  outputUrl?: string
  timestamps?: Array<{
    event: string
    time: number
    duration: number
  }>
}

interface ProcessingStatusProps {
  job: ProcessingJob | null
  onShowTimestamps?: () => void
}

export function ProcessingStatus({ job, onShowTimestamps }: ProcessingStatusProps) {
  if (!job) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Processing Status
          </CardTitle>
          <CardDescription>Upload videos to start processing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No processing job active</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusIcon = () => {
    switch (job.status) {
      case "pending":
        return <Clock className="h-5 w-5 text-muted-foreground" />
      case "processing":
        return <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-destructive" />
    }
  }

  const getStatusBadge = () => {
    switch (job.status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
    }
  }

  const downloadTimestamps = () => {
    if (!job.timestamps) return

    const data = {
      jobId: job.id,
      totalDuration: job.timestamps.reduce((acc, t) => Math.max(acc, t.time + t.duration), 0),
      events: job.timestamps,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `timestamps-${job.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Processing Status
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>Job ID: {job.id.slice(-8)}</span>
          {getStatusBadge()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        {job.status === "processing" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(job.progress)}%</span>
            </div>
            <Progress value={job.progress} className="h-2" />
          </div>
        )}

        {/* Video List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Processing Videos:</h4>
          {job.videos.map((video, index) => (
            <div key={video.id} className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="truncate">
                Question {index + 1}: {video.name}
              </span>
            </div>
          ))}
        </div>

        {/* Completed Actions */}
        {job.status === "completed" && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex gap-2">
              <Button size="sm" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download Video
              </Button>
              <Button variant="outline" size="sm" onClick={downloadTimestamps} className="flex-1 bg-transparent">
                <FileText className="h-4 w-4 mr-2" />
                Get Timestamps
              </Button>
            </div>

            {onShowTimestamps && (
              <Button variant="outline" size="sm" onClick={onShowTimestamps} className="w-full bg-transparent">
                <Timeline className="h-4 w-4 mr-2" />
                Open Timestamp Tracker
              </Button>
            )}

            {job.timestamps && (
              <div className="text-xs text-muted-foreground">
                <p>✓ Video compiled with {job.timestamps.length} timed events</p>
                <p>✓ Timestamp JSON ready for download</p>
                <p>✓ Advanced timestamp tracking available</p>
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {job.status === "error" && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">Processing failed. Please check your video files and try again.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
