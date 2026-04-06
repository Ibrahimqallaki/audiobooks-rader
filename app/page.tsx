"use client"

import { useState, useCallback } from "react"
import { TextInput } from "@/components/text-input"
import { AudioPlayer } from "@/components/audio-player"
import { ChapterList, type Chapter } from "@/components/chapter-list"
import { Headphones, Wand2, BookOpenCheck, Zap } from "lucide-react"

export default function Home() {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const splitTextIntoChapters = (text: string): string[] => {
    // Split by double newlines or chapter markers
    const chapterMarkers = /(?:kapitel|chapter|del|avsnitt)\s*\d*/gi
    const paragraphs = text.split(/\n\s*\n/)

    if (paragraphs.length <= 1) {
      // If no clear chapters, split by word count (roughly 500 words per chapter)
      const words = text.split(/\s+/)
      const chunkSize = 500
      const chunks: string[] = []

      for (let i = 0; i < words.length; i += chunkSize) {
        chunks.push(words.slice(i, i + chunkSize).join(" "))
      }

      return chunks.length > 0 ? chunks : [text]
    }

    // Group paragraphs into reasonable chapters
    const chapters: string[] = []
    let currentChapter = ""

    for (const paragraph of paragraphs) {
      if (chapterMarkers.test(paragraph) && currentChapter) {
        chapters.push(currentChapter.trim())
        currentChapter = paragraph
      } else {
        currentChapter += (currentChapter ? "\n\n" : "") + paragraph
      }
    }

    if (currentChapter) {
      chapters.push(currentChapter.trim())
    }

    return chapters
  }

  const handleTextSubmit = useCallback(async (text: string) => {
    setIsLoading(true)

    try {
      const chapterTexts = splitTextIntoChapters(text)
      const newChapters: Chapter[] = chapterTexts.map((chapterText, index) => ({
        id: `chapter-${index + 1}`,
        title: `Kapitel ${index + 1}`,
        text: chapterText,
      }))

      setChapters(newChapters)
      setCurrentChapterIndex(0)

      // Generate audio for the first chapter using Web Speech API
      const firstChapter = newChapters[0]
      if (firstChapter) {
        const audioUrl = await generateAudio(firstChapter.text)
        setChapters((prev) =>
          prev.map((ch, i) =>
            i === 0 ? { ...ch, audioUrl, duration: 120 } : ch
          )
        )
      }
    } catch (error) {
      console.error("Error generating audio:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const generateAudio = async (text: string): Promise<string> => {
    return new Promise((resolve) => {
      // Use Web Speech API for demo
      // In production, you would call a TTS API like Google Cloud, ElevenLabs, or OpenAI
      const utterance = new SpeechSynthesisUtterance(text)

      // For demo purposes, we'll create a simple audio blob
      // In a real app, you'd get this from your TTS API
      const audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Create a MediaStreamDestination
      const mediaStreamDestination = audioContext.createMediaStreamDestination()
      gainNode.connect(mediaStreamDestination)

      const mediaRecorder = new MediaRecorder(mediaStreamDestination.stream)
      const chunks: Blob[] = []

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" })
        resolve(URL.createObjectURL(blob))
      }

      // For demo, we just resolve with an empty audio URL
      // The Web Speech API will speak the text instead
      setTimeout(() => {
        if (typeof window !== "undefined" && window.speechSynthesis) {
          utterance.lang = "sv-SE"
          utterance.rate = 1
          utterance.pitch = 1
          window.speechSynthesis.speak(utterance)
        }
        // Create a placeholder audio blob for the player
        const silentAudio = createSilentAudio()
        resolve(silentAudio)
      }, 1000)
    })
  }

  const createSilentAudio = (): string => {
    // Create a minimal valid WAV file (silent audio)
    const channels = 1
    const sampleRate = 22050
    const bitsPerSample = 8
    const duration = 1 // 1 second of silence

    const dataSize = Math.ceil(sampleRate * duration * channels * (bitsPerSample / 8))
    const buffer = new ArrayBuffer(44 + dataSize)
    const view = new DataView(buffer)

    // WAV header
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i))
      }
    }

    writeString(0, "RIFF")
    view.setUint32(4, 36 + dataSize, true)
    writeString(8, "WAVE")
    writeString(12, "fmt ")
    view.setUint32(16, 16, true) // Subchunk1Size
    view.setUint16(20, 1, true) // AudioFormat (PCM)
    view.setUint16(22, channels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * channels * (bitsPerSample / 8), true)
    view.setUint16(32, channels * (bitsPerSample / 8), true)
    view.setUint16(34, bitsPerSample, true)
    writeString(36, "data")
    view.setUint32(40, dataSize, true)

    // Fill with silence (128 for 8-bit audio)
    for (let i = 0; i < dataSize; i++) {
      view.setUint8(44 + i, 128)
    }

    const blob = new Blob([buffer], { type: "audio/wav" })
    return URL.createObjectURL(blob)
  }

  const handleChapterChange = (direction: "prev" | "next") => {
    const newIndex =
      direction === "prev"
        ? Math.max(0, currentChapterIndex - 1)
        : Math.min(chapters.length - 1, currentChapterIndex + 1)
    setCurrentChapterIndex(newIndex)
  }

  const handleSelectChapter = (index: number) => {
    setCurrentChapterIndex(index)
  }

  const currentChapter = chapters[currentChapterIndex]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center">
              <Headphones className="size-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-foreground">VoiceBook</h1>
              <p className="text-xs text-muted-foreground">
                Text till Ljudbok med AI
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
            Förvandla text till ljudböcker
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
            Klistra in vilken text som helst och låt AI läsa upp den som en
            professionell ljudbok. Perfekt för artiklar, rapporter eller böcker.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Wand2 className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">AI-röster</h3>
              <p className="text-xs text-muted-foreground">
                Naturliga, mänskliga röster
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <BookOpenCheck className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Auto-kapitel</h3>
              <p className="text-xs text-muted-foreground">
                Automatisk kapitelindelning
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Zap className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Snabb</h3>
              <p className="text-xs text-muted-foreground">
                Generera ljud på sekunder
              </p>
            </div>
          </div>
        </div>

        {/* Main app area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Text input */}
          <div className="lg:col-span-2">
            <TextInput onSubmit={handleTextSubmit} isLoading={isLoading} />
          </div>

          {/* Right column: Audio player and chapters */}
          <div className="space-y-6">
            <AudioPlayer
              audioUrl={currentChapter?.audioUrl || null}
              title={currentChapter?.title}
              onChapterChange={handleChapterChange}
              hasNextChapter={currentChapterIndex < chapters.length - 1}
              hasPrevChapter={currentChapterIndex > 0}
            />
            <ChapterList
              chapters={chapters}
              currentChapterIndex={currentChapterIndex}
              onSelectChapter={handleSelectChapter}
            />
          </div>
        </div>

        {/* Demo text */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Testa med exempeltext:
          </p>
          <button
            onClick={() => {
              const demoText = `Kapitel 1: Början

Det var en gång i ett land långt borta, där solen alltid sken och vinden viskade hemligheter genom de gamla ekarna. I detta land bodde en ung upptäckare vid namn Erik, som drömde om att utforska världens alla hörn.

Erik hade ärvt sin farfars gamla karta, en karta som visade vägen till en glömd skatt gömd djupt inne i de mystiska bergen i norr. Varje natt studerade han kartan vid skenet av ett ensamt ljus, och planerade sin stora expedition.

Kapitel 2: Resan börjar

En kall morgon i oktober packade Erik sin väska med allt han behövde: en kompass, en fickkniv, torra matportioner och naturligtvis den värdefulla kartan. Hans mormor stod i dörröppningen och vinkade farväl med tårar i ögonen.

"Var försiktig där ute", ropade hon. "Och glöm inte att bergen har sina egna regler."

Erik nickade, kysste henne på kinden och började sin långa vandring mot norr. Han visste att resan skulle bli svår, men ingenting kunde stoppa honom nu.`
              handleTextSubmit(demoText)
            }}
            className="text-primary hover:text-primary/80 underline underline-offset-4 text-sm"
          >
            Ladda exempeltext
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            VoiceBook använder AI för att generera naturliga röster. Byggd som
            MVP för text-till-ljudbok konvertering.
          </p>
        </div>
      </footer>
    </div>
  )
}
