"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Trash2, Sparkles } from "lucide-react"

interface TextInputProps {
  onSubmit: (text: string) => void
  isLoading: boolean
}

export function TextInput({ onSubmit, isLoading }: TextInputProps) {
  const [text, setText] = useState("")

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text)
    }
  }

  const handleClear = () => {
    setText("")
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const charCount = text.length

  return (
    <div className="rounded-xl bg-card p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-primary" />
          <h2 className="font-semibold text-foreground">Din text</h2>
        </div>
        <div className="text-xs text-muted-foreground">
          {wordCount} ord · {charCount} tecken
        </div>
      </div>

      <Textarea
        placeholder="Klistra in din text här... Det kan vara en artikel, ett kapitel från en bok, eller annan text du vill lyssna på."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-h-[300px] bg-secondary border-border resize-none text-foreground placeholder:text-muted-foreground"
      />

      <div className="flex gap-3 mt-4">
        <Button
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isLoading ? (
            <>
              <div className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
              Genererar ljud...
            </>
          ) : (
            <>
              <Sparkles className="size-4 mr-2" />
              Skapa Ljudbok
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handleClear}
          disabled={!text || isLoading}
          className="border-border text-muted-foreground hover:text-foreground"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}
