"use client"

import { useState, useEffect } from "react"
import { Play, Clock, MoreVertical, Trash2, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getAudiobooks, subscribe, removeAudiobook, type Audiobook } from "@/lib/audiobook-store"

interface LibraryProps {
  onSelectBook: (book: Audiobook) => void
}

export function Library({ onSelectBook }: LibraryProps) {
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([])

  useEffect(() => {
    setAudiobooks(getAudiobooks())
    return subscribe(() => {
      setAudiobooks(getAudiobooks())
    })
  }, [])

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "Okänd längd"
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}t ${minutes}min`
    }
    return `${minutes} min`
  }

  const formatProgress = (current: number, total: number) => {
    if (!total || isNaN(total)) return "0%"
    return `${Math.round((current / total) * 100)}%`
  }

  const getProgressWidth = (current: number, total: number) => {
    if (!total || isNaN(total)) return "0%"
    return `${(current / total) * 100}%`
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    removeAudiobook(id)
  }

  if (audiobooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="size-20 rounded-full bg-secondary flex items-center justify-center mb-6">
          <BookOpen className="size-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Ditt bibliotek är tomt
        </h3>
        <p className="text-muted-foreground max-w-sm">
          Ladda upp din första ljudbok för att börja lyssna. Stöd för MP3, M4A och M4B-filer.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        Ditt bibliotek ({audiobooks.length})
      </h2>
      <div className="grid gap-4">
        {audiobooks.map((book) => (
          <div
            key={book.id}
            onClick={() => onSelectBook(book)}
            className="group flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/50 cursor-pointer transition-all"
          >
            {/* Cover */}
            <div className="relative size-16 md:size-20 rounded-lg overflow-hidden bg-secondary shrink-0">
              {book.coverUrl ? (
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="size-full object-cover"
                />
              ) : (
                <div className="size-full flex items-center justify-center">
                  <BookOpen className="size-8 text-muted-foreground" />
                </div>
              )}
              {/* Play overlay on hover */}
              <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Play className="size-8 text-primary" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground truncate">
                {book.title}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {book.author}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {formatDuration(book.duration)}
                </span>
                <span>{formatProgress(book.currentTime, book.duration)} avlyssnat</span>
              </div>
              {/* Progress bar */}
              {book.currentTime > 0 && (
                <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: getProgressWidth(book.currentTime, book.duration) }}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <MoreVertical className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => handleDelete(book.id, e as unknown as React.MouseEvent)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4 mr-2" />
                  Ta bort
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </div>
  )
}
