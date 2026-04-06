"use client"

import { useState, useCallback } from "react"
import { Upload, FileAudio, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addAudiobook } from "@/lib/audiobook-store"

interface FileUploaderProps {
  onUpload: () => void
}

export function FileUploader({ onUpload }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && isAudioFile(droppedFile)) {
      setFile(droppedFile)
      // Extract title from filename
      const name = droppedFile.name.replace(/\.[^/.]+$/, "")
      setTitle(name)
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && isAudioFile(selectedFile)) {
      setFile(selectedFile)
      const name = selectedFile.name.replace(/\.[^/.]+$/, "")
      setTitle(name)
    }
  }, [])

  const handleCoverSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setCoverFile(selectedFile)
      setCoverPreview(URL.createObjectURL(selectedFile))
    }
  }, [])

  const isAudioFile = (file: File) => {
    const audioTypes = ["audio/mpeg", "audio/mp4", "audio/m4a", "audio/wav", "audio/ogg", "audio/x-m4b"]
    return audioTypes.includes(file.type) || file.name.match(/\.(mp3|m4a|m4b|wav|ogg)$/i)
  }

  const handleSubmit = async () => {
    if (!file || !title) return

    setIsUploading(true)

    try {
      // Create object URL for the audio file
      const audioUrl = URL.createObjectURL(file)

      // Get audio duration
      const duration = await getAudioDuration(audioUrl)

      // Create cover URL if provided
      const coverUrl = coverPreview

      // Add to store
      addAudiobook({
        title,
        author: author || "Okänd författare",
        coverUrl,
        audioUrl,
        duration,
        chapters: generateChapters(duration),
      })

      // Reset form
      setFile(null)
      setTitle("")
      setAuthor("")
      setCoverFile(null)
      setCoverPreview(null)

      onUpload()
    } catch (error) {
      console.error("Error uploading audiobook:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const getAudioDuration = (url: string): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio()
      audio.addEventListener("loadedmetadata", () => {
        resolve(audio.duration)
      })
      audio.addEventListener("error", () => {
        resolve(0)
      })
      audio.src = url
    })
  }

  const generateChapters = (duration: number) => {
    // Generate automatic chapters every 10 minutes
    const chapterLength = 600 // 10 minutes in seconds
    const chapters = []
    let start = 0
    let index = 1

    while (start < duration) {
      const end = Math.min(start + chapterLength, duration)
      chapters.push({
        id: `chapter-${index}`,
        title: `Kapitel ${index}`,
        startTime: start,
        endTime: end,
      })
      start = end
      index++
    }

    return chapters
  }

  const clearFile = () => {
    setFile(null)
    setTitle("")
    setAuthor("")
  }

  return (
    <div className="space-y-6">
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl p-12
            flex flex-col items-center justify-center gap-4
            transition-colors cursor-pointer
            ${isDragging 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50 hover:bg-card"
            }
          `}
        >
          <input
            type="file"
            accept="audio/*,.mp3,.m4a,.m4b,.wav,.ogg"
            onChange={handleFileSelect}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="size-16 rounded-full bg-secondary flex items-center justify-center">
            <Upload className="size-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">
              Dra och släpp en ljudbok här
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              eller klicka för att välja fil (MP3, M4A, M4B)
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Selected file */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 border border-border">
            <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileAudio className="size-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFile}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <X className="size-5" />
            </Button>
          </div>

          {/* Metadata form */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Titel
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ljudbokens titel"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Författare
              </label>
              <Input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Författarens namn (valfritt)"
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Omslagsbild (valfritt)
              </label>
              <div className="flex items-center gap-4">
                {coverPreview ? (
                  <div className="relative size-20 rounded-lg overflow-hidden">
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="size-full object-cover"
                    />
                    <button
                      onClick={() => {
                        setCoverFile(null)
                        setCoverPreview(null)
                      }}
                      className="absolute top-1 right-1 size-5 rounded-full bg-background/80 flex items-center justify-center"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ) : (
                  <label className="size-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverSelect}
                      className="sr-only"
                    />
                    <Upload className="size-5 text-muted-foreground" />
                  </label>
                )}
                <p className="text-sm text-muted-foreground">
                  Ladda upp en omslagsbild för din ljudbok
                </p>
              </div>
            </div>
          </div>

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={!title || isUploading}
            className="w-full"
          >
            {isUploading ? "Lägger till..." : "Lägg till ljudbok"}
          </Button>
        </div>
      )}
    </div>
  )
}
