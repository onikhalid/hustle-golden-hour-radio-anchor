"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  VideoCompiler,
  type CompilationSegment,
  type CompilationOptions,
  type CompilationProgress,
} from "@/lib/video-compiler"
import { Play, Settings, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

interface VideoCompilationManagerProps {
  segments: CompilationSegment[]
  onCompilationComplete: (videoBlob: Blob) => void
  onCompilationError: (error: string) => void
}

export function VideoCompilationManager({
  segments,
  onCompilationComplete,
  onCompilationError,
}: VideoCompilationManagerProps) {
  const [compiler] = useState(() => new VideoCompiler())
  const [isCompiling, setIsCompiling] = useState(false)
  const [progress, setProgress] = useState<CompilationProgress | null>(null)
  const [compilationOptions, setCompilationOptions] = useState<CompilationOptions>({
    outputFormat: "mp4",
    quality: "medium",
    resolution: "1080p",
    frameRate: 30,
    audioEnabled: true,
  })
  const [estimatedSize, setEstimatedSize] = useState<string>("")
  const [estimatedTime, setEstimatedTime] = useState<string>("")

  useEffect(() => {
    const calculateEstimates = () => {
      const totalDuration = segments.reduce((acc, segment) => acc + segment.duration, 0)
  
      // Rough size estimation based on quality and resolution
      let bitrate = 1000 // kbps base
  
      switch (compilationOptions.quality) {
        case "low":
          bitrate = 500
          break
        case "medium":
          bitrate = 1500
          break
        case "high":
          bitrate = 3000
          break
        case "ultra":
          bitrate = 6000
          break
      }
  
      switch (compilationOptions.resolution) {
        case "720p":
          bitrate *= 0.7
          break
        case "1080p":
          bitrate *= 1
          break
        case "4k":
          bitrate *= 4
          break
      }
  
      const sizeInMB = (totalDuration * bitrate * 0.125) / 1000 // Convert to MB
      setEstimatedSize(`~${sizeInMB.toFixed(1)} MB`)
  
      // Time estimation (very rough)
      const processingTime = totalDuration * 0.5 // Assume 0.5x realtime processing
      setEstimatedTime(`~${Math.ceil(processingTime / 60)} min`)
    }
    compiler.setProgressCallback(setProgress)

    calculateEstimates()

    return () => {
      compiler.dispose()
    }
  }, [compiler, segments, compilationOptions])


  const handleStartCompilation = async () => {
    if (segments.length === 0) return

    setIsCompiling(true)

    try {
      const videoBlob = await compiler.compileVideo(segments, compilationOptions)
      onCompilationComplete(videoBlob)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown compilation error"
      onCompilationError(errorMessage)
    } finally {
      setIsCompiling(false)
    }
  }

  const getStageIcon = (stage: CompilationProgress["stage"]) => {
    switch (stage) {
      case "initializing":
      case "loading":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case "processing":
      case "encoding":
      case "finalizing":
        return <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
      case "complete":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStageColor = (stage: CompilationProgress["stage"]) => {
    switch (stage) {
      case "complete":
        return "bg-green-100 text-green-800"
      case "error":
        return "bg-red-100 text-red-800"
      case "processing":
      case "encoding":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Compilation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Compilation Settings
          </CardTitle>
          <CardDescription>Configure output quality and format settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="output-format">Output Format</Label>
              <Select
                value={compilationOptions.outputFormat}
                onValueChange={(value: "mp4" | "webm" | "mov") =>
                  setCompilationOptions((prev) => ({ ...prev, outputFormat: value }))
                }
                disabled={isCompiling}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mp4">MP4 (Recommended)</SelectItem>
                  <SelectItem value="webm">WebM</SelectItem>
                  <SelectItem value="mov">MOV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quality">Quality</Label>
              <Select
                value={compilationOptions.quality}
                onValueChange={(value: "low" | "medium" | "high" | "ultra") =>
                  setCompilationOptions((prev) => ({ ...prev, quality: value }))
                }
                disabled={isCompiling}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (Fast)</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="ultra">Ultra (Slow)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resolution">Resolution</Label>
              <Select
                value={compilationOptions.resolution}
                onValueChange={(value: "720p" | "1080p" | "4k") =>
                  setCompilationOptions((prev) => ({ ...prev, resolution: value }))
                }
                disabled={isCompiling}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">720p HD</SelectItem>
                  <SelectItem value="1080p">1080p Full HD</SelectItem>
                  <SelectItem value="4k">4K Ultra HD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frame-rate">Frame Rate</Label>
              <Select
                value={compilationOptions.frameRate.toString()}
                onValueChange={(value) =>
                  setCompilationOptions((prev) => ({ ...prev, frameRate: Number.parseInt(value) as 24 | 30 | 60 }))
                }
                disabled={isCompiling}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24 fps (Cinematic)</SelectItem>
                  <SelectItem value="30">30 fps (Standard)</SelectItem>
                  <SelectItem value="60">60 fps (Smooth)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="audio-enabled"
              checked={compilationOptions.audioEnabled}
              onCheckedChange={(checked) => setCompilationOptions((prev) => ({ ...prev, audioEnabled: checked }))}
              disabled={isCompiling}
            />
            <Label htmlFor="audio-enabled">Include Audio</Label>
          </div>

          <div className="flex justify-between items-center pt-4 border-t text-sm text-muted-foreground">
            <div>
              Estimated file size: <span className="font-medium">{estimatedSize}</span>
            </div>
            <div>
              Estimated time: <span className="font-medium">{estimatedTime}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compilation Progress */}
      {progress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStageIcon(progress.stage)}
              Compilation Progress
            </CardTitle>
            <CardDescription className="flex items-center justify-between">
              <span>{progress.message}</span>
              <Badge className={getStageColor(progress.stage)}>
                {progress.stage.charAt(0).toUpperCase() + progress.stage.slice(1)}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{progress.progress}%</span>
              </div>
              <Progress value={progress.progress} className="h-2" />
            </div>

            {progress.currentSegment && (
              <div className="text-sm text-muted-foreground">
                Processing segment {progress.currentSegment} of {progress.totalSegments}
              </div>
            )}

            {progress.timeRemaining && (
              <div className="text-sm text-muted-foreground">
                Estimated time remaining: {Math.ceil(progress.timeRemaining / 60)} minutes
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Segment Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Compilation Queue</CardTitle>
          <CardDescription>{segments.length} segments ready for compilation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {segments.map((segment, index) => (
              <div key={segment.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
                  <span className="text-sm font-medium text-primary">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {segment.type.replace("-", " ")}
                    </Badge>
                    <span className="text-sm font-medium">{segment.duration}s duration</span>
                  </div>
                  {segment.textContent && <p className="text-xs text-muted-foreground mt-1">&quot;{segment.textContent}&quot;</p>}
                </div>
                <div className="text-xs text-muted-foreground">{segment.startTime}s</div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <Button onClick={handleStartCompilation} disabled={segments.length === 0 || isCompiling} className="flex-1">
              {isCompiling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Compiling...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Compilation
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
