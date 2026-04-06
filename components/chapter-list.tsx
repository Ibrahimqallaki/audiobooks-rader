"use client"

import { cn } from "@/lib/utils"
import { BookOpen, Check } from "lucide-react"

export interface Chapter {
  id: string
  title: string
  text: string
  audioUrl?: string
  duration?: number
}

interface ChapterListProps {
  chapters: Chapter[]
  currentChapterIndex: number
  onSelectChapter: (index: number) => void
}

export function ChapterList({
  chapters,
  currentChapterIndex,
  onSelectChapter,
}: ChapterListProps) {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "--:--"
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  if (chapters.length === 0) {
    return (
      <div className="rounded-xl bg-card p-6 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="size-5 text-primary" />
          <h2 className="font-semibold text-foreground">Kapitel</h2>
        </div>
        <div className="py-8 text-center text-muted-foreground">
          <p className="text-sm">Inga kapitel än</p>
          <p className="text-xs mt-1">
            Kapitel skapas automatiskt när du genererar ljud
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-card p-6 border border-border">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="size-5 text-primary" />
        <h2 className="font-semibold text-foreground">
          Kapitel ({chapters.length})
        </h2>
      </div>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {chapters.map((chapter, index) => (
          <button
            key={chapter.id}
            onClick={() => onSelectChapter(index)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
              index === currentChapterIndex
                ? "bg-primary/10 border border-primary/30"
                : "bg-secondary hover:bg-secondary/80"
            )}
          >
            <div
              className={cn(
                "size-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
                index === currentChapterIndex
                  ? "bg-primary text-primary-foreground"
                  : chapter.audioUrl
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {chapter.audioUrl ? (
                <Check className="size-4" />
              ) : (
                index + 1
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "font-medium truncate",
                  index === currentChapterIndex
                    ? "text-primary"
                    : "text-foreground"
                )}
              >
                {chapter.title}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {chapter.text.slice(0, 60)}...
              </p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatDuration(chapter.duration)}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
