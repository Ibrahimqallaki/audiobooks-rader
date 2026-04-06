"use client"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, FileAudio, FileText, X, Loader2 } from "lucide-react"

interface FileUploadProps {
  onAudioFileLoad: (audioUrl: string, fileName: string) => void
  onTextExtracted: (text: string, fileName: string) => void
  isLoading?: boolean
}

type FileType = "audio" | "pdf" | "epub" | "unknown"

const AUDIO_FORMATS = [".mp3", ".m4a", ".m4b", ".wav", ".ogg", ".aac", ".flac"]
const DOCUMENT_FORMATS = [".pdf", ".epub", ".txt"]

function getFileType(fileName: string): FileType {
  const extension = fileName.toLowerCase().slice(fileName.lastIndexOf("."))
  if (AUDIO_FORMATS.includes(extension)) return "audio"
  if (extension === ".pdf") return "pdf"
  if (extension === ".epub") return "epub"
  if (extension === ".txt") return "pdf" // treat txt like pdf for text extraction
  return "unknown"
}

export function FileUpload({
  onAudioFileLoad,
  onTextExtracted,
  isLoading = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{
    name: string
    type: FileType
    size: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const processFile = useCallback(
    async (file: File) => {
      setError(null)
      setIsProcessing(true)

      const fileType = getFileType(file.name)

      if (fileType === "unknown") {
        setError(
          "Filformatet stöds inte. Använd MP3, M4B, WAV, PDF, EPUB eller TXT."
        )
        setIsProcessing(false)
        return
      }

      setUploadedFile({
        name: file.name,
        type: fileType,
        size: file.size,
      })

      try {
        if (fileType === "audio") {
          // Create object URL for audio file
          const audioUrl = URL.createObjectURL(file)
          onAudioFileLoad(audioUrl, file.name)
        } else if (fileType === "pdf" || fileType === "epub") {
          // Extract text from PDF/EPUB
          const text = await extractTextFromFile(file, fileType)
          onTextExtracted(text, file.name)
        }
      } catch (err) {
        console.error("Error processing file:", err)
        setError("Kunde inte bearbeta filen. Försök igen.")
      } finally {
        setIsProcessing(false)
      }
    },
    [onAudioFileLoad, onTextExtracted]
  )

  const extractTextFromFile = async (
    file: File,
    fileType: FileType
  ): Promise<string> => {
    if (file.name.endsWith(".txt")) {
      return await file.text()
    }

    if (fileType === "pdf") {
      // Use pdf.js to extract text with legacy build (includes worker)
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs")
      
      // Disable worker to avoid CORS issues
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
      }).promise

      let fullText = ""
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ")
        fullText += pageText + "\n\n"
      }

      return fullText.trim()
    }

    if (fileType === "epub") {
      // Use epubjs to extract text
      const ePub = (await import("epubjs")).default
      const arrayBuffer = await file.arrayBuffer()
      const book = ePub(arrayBuffer)
      await book.ready

      const spine = book.spine as { each: (callback: (section: { load: (book: { load: (url: string) => Promise<Document> }) => Promise<Document> }) => Promise<void>) => Promise<void> }
      let fullText = ""

      await spine.each(async (section) => {
        const contents = await section.load(book.load.bind(book))
        const text = contents.body?.textContent || ""
        fullText += text + "\n\n"
      })

      return fullText.trim()
    }

    throw new Error("Unsupported file type")
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = e.dataTransfer.files
      if (files.length > 0) {
        processFile(files[0])
      }
    },
    [processFile]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        processFile(files[0])
      }
    },
    [processFile]
  )

  const clearFile = useCallback(() => {
    setUploadedFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const acceptedFormats = [...AUDIO_FORMATS, ...DOCUMENT_FORMATS].join(",")

  return (
    <div className="rounded-xl bg-card p-6 border border-border">
      <h3 className="font-semibold text-foreground mb-4">Ladda upp fil</h3>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer
          ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-secondary/50"
          }
        `}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4 text-center">
          {isProcessing || isLoading ? (
            <>
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="size-6 text-primary animate-spin" />
              </div>
              <div>
                <p className="font-medium text-foreground">Bearbetar fil...</p>
                <p className="text-sm text-muted-foreground">Vänligen vänta</p>
              </div>
            </>
          ) : (
            <>
              <div className="size-12 rounded-full bg-secondary flex items-center justify-center">
                <Upload className="size-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  Dra och släpp eller klicka för att välja
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Stöder ljudböcker (MP3, M4B) och dokument (PDF, EPUB, TXT)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Uploaded file info */}
      {uploadedFile && !error && (
        <div className="mt-4 p-4 rounded-lg bg-secondary/50 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                {uploadedFile.type === "audio" ? (
                  <FileAudio className="size-5 text-primary" />
                ) : (
                  <FileText className="size-5 text-primary" />
                )}
              </div>
              <div>
                <p className="font-medium text-foreground text-sm truncate max-w-[200px]">
                  {uploadedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(uploadedFile.size)} •{" "}
                  {uploadedFile.type === "audio" ? "Ljudbok" : "Dokument"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                clearFile()
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Supported formats */}
      <div className="mt-4 flex flex-wrap gap-2">
        {[...AUDIO_FORMATS.slice(0, 3), ...DOCUMENT_FORMATS].map((format) => (
          <span
            key={format}
            className="px-2 py-1 text-xs rounded-md bg-secondary text-muted-foreground"
          >
            {format.toUpperCase().replace(".", "")}
          </span>
        ))}
      </div>
    </div>
  )
}
