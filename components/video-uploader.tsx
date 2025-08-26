"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Upload, FileVideo } from "lucide-react"
import { cn } from "@/lib/utils"

interface VideoUploaderProps {
  onUpload: (files: File[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
  className?: string
}

export function VideoUploader({
  onUpload,
  maxFiles = 2,
  acceptedTypes = ["video/mp4", "video/mov", "video/avi"],
  className,
}: VideoUploaderProps) {
  const [dragActive, setDragActive] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onUpload(acceptedFiles.slice(0, maxFiles))
      }
      setDragActive(false)
    },
    [onUpload, maxFiles],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/*": acceptedTypes.map((type) => type.split("/")[1]),
    },
    maxFiles,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  })

  return (
    <div className={cn("w-full", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          "hover:border-primary/50 hover:bg-primary/5",
          isDragActive || dragActive ? "border-primary bg-primary/10" : "border-border bg-card",
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-4">
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full transition-colors",
              isDragActive || dragActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            <FileVideo className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium text-foreground">
              {isDragActive ? "Drop videos here" : "Upload Question Videos"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Drag and drop up to {maxFiles} video files, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">Supports: {acceptedTypes.join(", ")}</p>
          </div>

          <Button variant="outline" size="sm" className="mt-2 bg-transparent">
            <Upload className="h-4 w-4 mr-2" />
            Choose Files
          </Button>
        </div>

        {(isDragActive || dragActive) && (
          <div className="absolute inset-0 bg-primary/20 rounded-lg flex items-center justify-center">
            <div className="text-primary font-medium">Drop videos to upload</div>
          </div>
        )}
      </div>
    </div>
  )
}
