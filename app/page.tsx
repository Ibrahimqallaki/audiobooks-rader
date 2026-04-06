"use client"

import { useState } from "react"
import { Headphones, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileUploader } from "@/components/file-uploader"
import { Library } from "@/components/library"
import { AudiobookPlayer } from "@/components/audiobook-player"
import type { Audiobook } from "@/lib/audiobook-store"

export default function Home() {
  const [currentBook, setCurrentBook] = useState<Audiobook | null>(null)
  const [showUploader, setShowUploader] = useState(false)

  const handleSelectBook = (book: Audiobook) => {
    setCurrentBook(book)
  }

  const handleBack = () => {
    setCurrentBook(null)
  }

  const handleUploadComplete = () => {
    setShowUploader(false)
  }

  // Show player if a book is selected
  if (currentBook) {
    return <AudiobookPlayer book={currentBook} onBack={handleBack} />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary flex items-center justify-center">
                <Headphones className="size-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-xl text-foreground">AudioBook Reader</h1>
                <p className="text-xs text-muted-foreground">
                  Din ljudboksbibliotek
                </p>
              </div>
            </div>
            <Button onClick={() => setShowUploader(true)} size="sm">
              <Plus className="size-4 mr-2" />
              Lägg till
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
            Lyssna på dina ljudböcker
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
            Ladda upp dina ljudböcker och lyssna var som helst. Med bokmärken, kapitelnavigering och sömntimer.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <div className="p-4 rounded-xl bg-card border border-border text-center">
            <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📁</span>
            </div>
            <h3 className="font-medium text-foreground">Ladda upp</h3>
            <p className="text-xs text-muted-foreground mt-1">
              MP3, M4A, M4B
            </p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border text-center">
            <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📑</span>
            </div>
            <h3 className="font-medium text-foreground">Kapitel</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Auto-genererade
            </p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border text-center">
            <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🔖</span>
            </div>
            <h3 className="font-medium text-foreground">Bokmärken</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Spara din plats
            </p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border text-center">
            <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🌙</span>
            </div>
            <h3 className="font-medium text-foreground">Sömntimer</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Pausa automatiskt
            </p>
          </div>
        </div>

        {/* Library */}
        <Library onSelectBook={handleSelectBook} />
      </main>

      {/* Upload dialog */}
      <Dialog open={showUploader} onOpenChange={setShowUploader}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Lägg till ljudbok</DialogTitle>
          </DialogHeader>
          <FileUploader onUpload={handleUploadComplete} />
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            AudioBook Reader - Lyssna på dina ljudböcker offline
          </p>
        </div>
      </footer>
    </div>
  )
}
