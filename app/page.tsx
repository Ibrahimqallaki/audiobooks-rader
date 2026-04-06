"use client"

import { useState, useCallback } from "react"
import { TextInput } from "@/components/text-input"
import { AudioPlayer } from "@/components/audio-player"
import { ChapterList, type Chapter } from "@/components/chapter-list"
import { FileUpload } from "@/components/file-upload"
import { Headphones, Upload, FileText } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type AudioMode = "generated" | "uploaded"

export default function Home() {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [audioMode, setAudioMode] = useState<AudioMode>("generated")
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)

  const splitTextIntoChapters = (text: string): string[] => {
    const chapterMarkers = /(?:kapitel|chapter|del|avsnitt)\s*\d*/gi
    const paragraphs = text.split(/\n\s*\n/)

    if (paragraphs.length <= 1) {
      const words = text.split(/\s+/)
      const chunkSize = 500
      const chunks: string[] = []

      for (let i = 0; i < words.length; i += chunkSize) {
        chunks.push(words.slice(i, i + chunkSize).join(" "))
      }

      return chunks.length > 0 ? chunks : [text]
    }

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
    setAudioMode("generated")

    try {
      const chapterTexts = splitTextIntoChapters(text)
      const newChapters: Chapter[] = chapterTexts.map((chapterText, index) => ({
        id: `chapter-${index + 1}`,
        title: `Kapitel ${index + 1}`,
        text: chapterText,
      }))

      setChapters(newChapters)
      setCurrentChapterIndex(0)

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
    // Create a silent audio blob to represent generated audio
    // The actual TTS will be handled by the AudioPlayer component
    const silentAudio = createSilentAudio()
    return silentAudio
  }

  const createSilentAudio = (): string => {
    const channels = 1
    const sampleRate = 22050
    const bitsPerSample = 8
    const duration = 1

    const dataSize = Math.ceil(sampleRate * duration * channels * (bitsPerSample / 8))
    const buffer = new ArrayBuffer(44 + dataSize)
    const view = new DataView(buffer)

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i))
      }
    }

    writeString(0, "RIFF")
    view.setUint32(4, 36 + dataSize, true)
    writeString(8, "WAVE")
    writeString(12, "fmt ")
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, channels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * channels * (bitsPerSample / 8), true)
    view.setUint16(32, channels * (bitsPerSample / 8), true)
    view.setUint16(34, bitsPerSample, true)
    writeString(36, "data")
    view.setUint32(40, dataSize, true)

    for (let i = 0; i < dataSize; i++) {
      view.setUint8(44 + i, 128)
    }

    const blob = new Blob([buffer], { type: "audio/wav" })
    return URL.createObjectURL(blob)
  }

  const handleAudioFileLoad = useCallback((audioUrl: string, fileName: string) => {
    setUploadedAudioUrl(audioUrl)
    setUploadedFileName(fileName)
    setAudioMode("uploaded")
    setChapters([])
  }, [])

  const handleTextExtracted = useCallback((text: string, fileName: string) => {
    setUploadedFileName(fileName)
    handleTextSubmit(text)
  }, [handleTextSubmit])

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

  const activeAudioUrl = audioMode === "uploaded" ? uploadedAudioUrl : currentChapter?.audioUrl || null
  const activeTitle = audioMode === "uploaded" 
    ? uploadedFileName?.replace(/\.[^/.]+$/, "") || "Uppladdad ljudbok"
    : currentChapter?.title

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center">
              <Headphones className="size-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-foreground">VoiceBook</h1>
              <p className="text-xs text-muted-foreground">
                Ljudboksläsare och TTS
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
            Din personliga ljudboksläsare
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
            Ladda upp ljudböcker (MP3, M4B) eller dokument (PDF, EPUB) och lyssna direkt.
            Du kan också klistra in text för AI-uppläsning.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="size-4" />
                  Ladda upp fil
                </TabsTrigger>
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <FileText className="size-4" />
                  Klistra in text
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload">
                <FileUpload
                  onAudioFileLoad={handleAudioFileLoad}
                  onTextExtracted={handleTextExtracted}
                  isLoading={isLoading}
                />
                
                <div className="mt-6 p-4 rounded-xl bg-card border border-border">
                  <h4 className="font-medium text-foreground mb-3">Format som stöds</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-primary mb-2">Ljudböcker</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>MP3 - Vanligaste formatet</li>
                        <li>M4B - Apple ljudbok</li>
                        <li>M4A - AAC-ljud</li>
                        <li>WAV, OGG, FLAC</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary mb-2">Dokument</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>PDF - Extraherar text</li>
                        <li>EPUB - E-bokformat</li>
                        <li>TXT - Ren text</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="text">
                <TextInput onSubmit={handleTextSubmit} isLoading={isLoading} />
                
                <div className="mt-6 text-center">
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
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <AudioPlayer
              audioUrl={audioMode === "uploaded" ? activeAudioUrl : null}
              title={activeTitle}
              chapterText={audioMode === "generated" ? currentChapter?.text : undefined}
              onChapterChange={audioMode === "generated" ? handleChapterChange : undefined}
              hasNextChapter={audioMode === "generated" && currentChapterIndex < chapters.length - 1}
              hasPrevChapter={audioMode === "generated" && currentChapterIndex > 0}
            />
            
            {audioMode === "generated" && chapters.length > 0 && (
              <ChapterList
                chapters={chapters}
                currentChapterIndex={currentChapterIndex}
                onSelectChapter={handleSelectChapter}
              />
            )}

            {audioMode === "uploaded" && uploadedFileName && (
              <div className="rounded-xl bg-card p-6 border border-border">
                <h3 className="font-semibold text-foreground mb-3">Nu spelar</h3>
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Headphones className="size-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {uploadedFileName.replace(/\.[^/.]+$/, "")}
                    </p>
                    <p className="text-sm text-muted-foreground">Uppladdad ljudbok</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            VoiceBook - Din personliga ljudboksläsare. Stöder ljudböcker och textdokument.
          </p>
        </div>
      </footer>
    </div>
  )
}
