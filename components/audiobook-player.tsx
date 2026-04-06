"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ChevronLeft,
  Bookmark,
  List,
  Moon,
  RotateCcw,
} from "lucide-react"
import { updateProgress, getBookmarks, addBookmark, removeBookmark, type Audiobook, type Bookmark as BookmarkType } from "@/lib/audiobook-store"

interface AudiobookPlayerProps {
  book: Audiobook
  onBack: () => void
}

export function AudiobookPlayer({ book, onBack }: AudiobookPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(book.currentTime || 0)
  const [duration, setDuration] = useState(book.duration || 0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showChapters, setShowChapters] = useState(false)
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([])
  const [sleepTimer, setSleepTimer] = useState<number | null>(null)
  const [sleepTimeRemaining, setSleepTimeRemaining] = useState<number | null>(null)
  const sleepIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load bookmarks
  useEffect(() => {
    setBookmarks(getBookmarks(book.id))
  }, [book.id])

  // Initialize audio
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => {
      setCurrentTime(audio.currentTime)
      // Save progress every 5 seconds
      if (Math.floor(audio.currentTime) % 5 === 0) {
        updateProgress(book.id, audio.currentTime)
      }
    }
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => {
      setIsPlaying(false)
      // Move to next chapter if available
      const currentChapter = book.chapters.find(
        (ch) => audio.currentTime >= ch.startTime && audio.currentTime < ch.endTime
      )
      if (currentChapter) {
        const currentIndex = book.chapters.indexOf(currentChapter)
        const nextChapter = book.chapters[currentIndex + 1]
        if (nextChapter) {
          audio.currentTime = nextChapter.startTime
          audio.play()
          setIsPlaying(true)
        }
      }
    }

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("ended", handleEnded)

    // Set initial position
    if (book.currentTime > 0) {
      audio.currentTime = book.currentTime
    }

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("ended", handleEnded)
      // Save progress on unmount
      updateProgress(book.id, audio.currentTime)
    }
  }, [book])

  // Sleep timer
  useEffect(() => {
    if (sleepTimer !== null) {
      setSleepTimeRemaining(sleepTimer * 60)
      sleepIntervalRef.current = setInterval(() => {
        setSleepTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            // Stop playback
            if (audioRef.current) {
              audioRef.current.pause()
              setIsPlaying(false)
            }
            setSleepTimer(null)
            if (sleepIntervalRef.current) {
              clearInterval(sleepIntervalRef.current)
            }
            return null
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (sleepIntervalRef.current) {
        clearInterval(sleepIntervalRef.current)
      }
    }
  }, [sleepTimer])

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  const handleSeek = useCallback((value: number[]) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = value[0]
    setCurrentTime(value[0])
  }, [])

  const handleVolumeChange = useCallback((value: number[]) => {
    if (!audioRef.current) return
    const newVolume = value[0]
    audioRef.current.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }, [])

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return
    if (isMuted) {
      audioRef.current.volume = volume || 1
      setIsMuted(false)
    } else {
      audioRef.current.volume = 0
      setIsMuted(true)
    }
  }, [isMuted, volume])

  const changePlaybackRate = useCallback(() => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
    const currentIndex = rates.indexOf(playbackRate)
    const nextIndex = (currentIndex + 1) % rates.length
    const newRate = rates[nextIndex]
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate
    }
    setPlaybackRate(newRate)
  }, [playbackRate])

  const skip = useCallback((seconds: number) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = Math.max(
      0,
      Math.min(duration, audioRef.current.currentTime + seconds)
    )
  }, [duration])

  const goToChapter = useCallback((startTime: number) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = startTime
    setCurrentTime(startTime)
    setShowChapters(false)
    if (!isPlaying) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }, [isPlaying])

  const handleAddBookmark = useCallback(() => {
    const newBookmark = addBookmark(book.id, currentTime, `Bokmärke vid ${formatTime(currentTime)}`)
    setBookmarks([...bookmarks, newBookmark])
  }, [book.id, currentTime, bookmarks])

  const handleRemoveBookmark = useCallback((id: string) => {
    removeBookmark(id)
    setBookmarks(bookmarks.filter((b) => b.id !== id))
  }, [bookmarks])

  const goToBookmark = useCallback((time: number) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = time
    setCurrentTime(time)
    setShowBookmarks(false)
  }, [])

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00"
    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60)
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const getCurrentChapter = () => {
    return book.chapters.find(
      (ch) => currentTime >= ch.startTime && currentTime < ch.endTime
    ) || book.chapters[0]
  }

  const currentChapter = getCurrentChapter()

  const setSleepTimerMinutes = (minutes: number | null) => {
    if (sleepIntervalRef.current) {
      clearInterval(sleepIntervalRef.current)
    }
    setSleepTimer(minutes)
    if (minutes === null) {
      setSleepTimeRemaining(null)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <audio ref={audioRef} src={book.audioUrl} preload="metadata" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-5 mr-1" />
            Bibliotek
          </Button>
          <div className="flex items-center gap-2">
            {sleepTimeRemaining !== null && (
              <span className="text-xs text-muted-foreground">
                Sömntimer: {Math.floor(sleepTimeRemaining / 60)}:{(sleepTimeRemaining % 60).toString().padStart(2, "0")}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Cover */}
          <div className="aspect-square max-w-xs mx-auto rounded-2xl overflow-hidden bg-secondary mb-8 shadow-2xl">
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="size-full object-cover"
              />
            ) : (
              <div className="size-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <span className="text-6xl font-bold text-primary/30">
                  {book.title.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Title and author */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-1 text-balance">
              {book.title}
            </h1>
            <p className="text-muted-foreground">{book.author}</p>
            {currentChapter && (
              <p className="text-sm text-primary mt-2">{currentChapter.title}</p>
            )}
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>-{formatTime(duration - currentTime)}</span>
            </div>
          </div>

          {/* Main controls */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(-30)}
              className="text-muted-foreground hover:text-foreground"
            >
              <div className="relative">
                <RotateCcw className="size-6" />
                <span className="absolute -bottom-1 -right-1 text-[10px] font-bold">30</span>
              </div>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(-10)}
              className="text-muted-foreground hover:text-foreground size-12"
            >
              <SkipBack className="size-6" />
            </Button>

            <Button
              size="lg"
              onClick={togglePlay}
              className="size-16 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isPlaying ? (
                <Pause className="size-7" />
              ) : (
                <Play className="size-7 ml-1" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(10)}
              className="text-muted-foreground hover:text-foreground size-12"
            >
              <SkipForward className="size-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(30)}
              className="text-muted-foreground hover:text-foreground"
            >
              <div className="relative">
                <RotateCcw className="size-6 -scale-x-100" />
                <span className="absolute -bottom-1 -left-1 text-[10px] font-bold">30</span>
              </div>
            </Button>
          </div>

          {/* Secondary controls */}
          <div className="flex items-center justify-between mb-8">
            {/* Volume */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="text-muted-foreground hover:text-foreground"
              >
                {isMuted ? (
                  <VolumeX className="size-5" />
                ) : (
                  <Volume2 className="size-5" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
                className="w-20"
              />
            </div>

            {/* Playback speed */}
            <Button
              variant="outline"
              size="sm"
              onClick={changePlaybackRate}
              className="text-xs font-medium min-w-[60px]"
            >
              {playbackRate}x
            </Button>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowChapters(!showChapters)}
              className="flex-col h-auto py-3"
            >
              <List className="size-5 mb-1" />
              <span className="text-xs">Kapitel</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddBookmark}
              className="flex-col h-auto py-3"
            >
              <Bookmark className="size-5 mb-1" />
              <span className="text-xs">Bokmärke</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowBookmarks(!showBookmarks)}
              className="flex-col h-auto py-3 relative"
            >
              <Bookmark className="size-5 mb-1 fill-current" />
              <span className="text-xs">Sparade</span>
              {bookmarks.length > 0 && (
                <span className="absolute -top-1 -right-1 size-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {bookmarks.length}
                </span>
              )}
            </Button>
            <Button
              variant={sleepTimer !== null ? "default" : "secondary"}
              size="sm"
              onClick={() => setSleepTimerMinutes(sleepTimer !== null ? null : 15)}
              className="flex-col h-auto py-3"
            >
              <Moon className="size-5 mb-1" />
              <span className="text-xs">Sömn</span>
            </Button>
          </div>

          {/* Sleep timer options */}
          {sleepTimer !== null && (
            <div className="mt-4 p-4 rounded-xl bg-card border border-border">
              <p className="text-sm text-muted-foreground mb-3">Välj tid:</p>
              <div className="flex flex-wrap gap-2">
                {[5, 10, 15, 30, 45, 60].map((min) => (
                  <Button
                    key={min}
                    variant={sleepTimer === min ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSleepTimerMinutes(min)}
                  >
                    {min} min
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSleepTimerMinutes(null)}
                >
                  Avbryt
                </Button>
              </div>
            </div>
          )}

          {/* Chapters panel */}
          {showChapters && (
            <div className="mt-4 p-4 rounded-xl bg-card border border-border max-h-64 overflow-y-auto">
              <h3 className="font-medium text-foreground mb-3">Kapitel</h3>
              <div className="space-y-2">
                {book.chapters.map((chapter) => (
                  <button
                    key={chapter.id}
                    onClick={() => goToChapter(chapter.startTime)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      currentChapter?.id === chapter.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-secondary text-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{chapter.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(chapter.startTime)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bookmarks panel */}
          {showBookmarks && (
            <div className="mt-4 p-4 rounded-xl bg-card border border-border max-h-64 overflow-y-auto">
              <h3 className="font-medium text-foreground mb-3">Bokmärken</h3>
              {bookmarks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Inga bokmärken ännu. Tryck på bokmärkesknappen för att spara din plats.
                </p>
              ) : (
                <div className="space-y-2">
                  {bookmarks.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary"
                    >
                      <button
                        onClick={() => goToBookmark(bookmark.time)}
                        className="text-left flex-1"
                      >
                        <span className="font-medium text-foreground">
                          {formatTime(bookmark.time)}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {bookmark.note}
                        </p>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveBookmark(bookmark.id)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <Bookmark className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
