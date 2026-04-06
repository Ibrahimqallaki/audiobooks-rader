"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react"

interface AudioPlayerProps {
  audioUrl: string | null
  title?: string
  onChapterChange?: (direction: "prev" | "next") => void
  hasNextChapter?: boolean
  hasPrevChapter?: boolean
}

export function AudioPlayer({
  audioUrl,
  title = "Kapitel 1",
  onChapterChange,
  hasNextChapter = false,
  hasPrevChapter = false,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [audioUrl])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = value[0]
    setCurrentTime(value[0])
  }

  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return
    const newVolume = value[0]
    audioRef.current.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (!audioRef.current) return
    if (isMuted) {
      audioRef.current.volume = volume || 1
      setIsMuted(false)
    } else {
      audioRef.current.volume = 0
      setIsMuted(true)
    }
  }

  const changePlaybackRate = () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2]
    const currentIndex = rates.indexOf(playbackRate)
    const nextIndex = (currentIndex + 1) % rates.length
    const newRate = rates[nextIndex]
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate
    }
    setPlaybackRate(newRate)
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const skip = (seconds: number) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = Math.max(
      0,
      Math.min(duration, audioRef.current.currentTime + seconds)
    )
  }

  if (!audioUrl) {
    return (
      <div className="rounded-xl bg-card p-6 border border-border">
        <div className="flex flex-col items-center justify-center gap-4 py-8 text-muted-foreground">
          <div className="size-16 rounded-full bg-secondary flex items-center justify-center">
            <Volume2 className="size-8" />
          </div>
          <p className="text-sm">Ingen ljudfil tillgänglig</p>
          <p className="text-xs text-center max-w-xs">
            Klistra in text och klicka på &quot;Skapa Ljudbok&quot; för att generera ljud
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-card p-6 border border-border">
      <audio ref={audioRef} src={audioUrl} />

      {/* Title */}
      <div className="mb-6 text-center">
        <h3 className="font-semibold text-foreground text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground">AI-genererad ljudbok</p>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={1}
          onValueChange={handleSeek}
          className="cursor-pointer"
        />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main controls */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onChapterChange?.("prev")}
          disabled={!hasPrevChapter}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          <SkipBack className="size-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => skip(-10)}
          className="text-muted-foreground hover:text-foreground"
        >
          <span className="text-xs font-medium">-10</span>
        </Button>

        <Button
          size="lg"
          onClick={togglePlay}
          className="size-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isPlaying ? (
            <Pause className="size-6" />
          ) : (
            <Play className="size-6 ml-1" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => skip(10)}
          className="text-muted-foreground hover:text-foreground"
        >
          <span className="text-xs font-medium">+10</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onChapterChange?.("next")}
          disabled={!hasNextChapter}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          <SkipForward className="size-5" />
        </Button>
      </div>

      {/* Secondary controls */}
      <div className="flex items-center justify-between">
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
            className="w-24"
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
    </div>
  )
}
