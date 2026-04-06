/**
 * Text-to-Speech Engine with natural prosody improvements
 * Uses Web Speech API with SSML-like processing for better naturalness
 */

interface TTSOptions {
  rate?: number
  pitch?: number
  volume?: number
  lang?: string
  voice?: SpeechSynthesisVoice
}

interface TextSegment {
  text: string
  pause: number // pause after text in milliseconds
}

export class NaturalTTSEngine {
  private utterances: SpeechSynthesisUtterance[] = []
  private currentIndex = 0
  private isPlaying = false
  private pausedTime = 0

  /**
   * Preprocess text for more natural reading
   * - Add pauses after punctuation
   * - Split long sentences
   * - Fix common abbreviations
   */
  private preprocessText(text: string): TextSegment[] {
    // Clean up multiple spaces and line breaks
    let cleaned = text
      .replace(/\s+/g, " ")
      .replace(/\n+/g, " ")
      .trim()

    // Fix common abbreviations for natural reading
    const abbreviations: Record<string, string> = {
      "m.a.o": "med andra ord",
      "t.ex": "till exempel",
      "o.s.v": "och så vidare",
      "etc": "och så vidare",
      "f.d": "före detta",
      "bl.a": "bland annat",
      "dvs": "det vill säga",
      "nr": "nummer",
      "st": "stycke",
      "kl": "klockan",
      "mkt": "mycket",
      "osv": "och så vidare",
    }

    Object.entries(abbreviations).forEach(([abbr, full]) => {
      const regex = new RegExp(`\\b${abbr}\\b`, "gi")
      cleaned = cleaned.replace(regex, full)
    })

    // Split on sentence boundaries while preserving structure
    const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [cleaned]

    const segments: TextSegment[] = []

    sentences.forEach((sentence) => {
      const trimmed = sentence.trim()
      if (!trimmed) return

      // Split very long sentences into smaller chunks
      if (trimmed.length > 200) {
        const chunks = trimmed.match(/.{1,150}(?:[,.;]\s|$)/g) || [trimmed]
        chunks.forEach((chunk, idx) => {
          segments.push({
            text: chunk.trim(),
            pause: idx < chunks.length - 1 ? 400 : 600, // longer pause at sentence end
          })
        })
      } else {
        segments.push({
          text: trimmed,
          pause: 600, // pause after sentence
        })
      }
    })

    // Add paragraph breaks
    const paragraphs = text.split(/\n\n+/)
    if (paragraphs.length > 1) {
      // Reset and reprocess with paragraph awareness
      let offset = 0
      return paragraphs.flatMap((para, parIdx) => {
        const parSegments = this.preprocessText(para)
        // Add longer pause between paragraphs
        if (parIdx < paragraphs.length - 1 && parSegments.length > 0) {
          const lastSeg = parSegments[parSegments.length - 1]
          lastSeg.pause = Math.max(lastSeg.pause, 1000)
        }
        return parSegments
      })
    }

    return segments
  }

  /**
   * Create utterances from text segments
   */
  private createUtterances(
    segments: TextSegment[],
    options: TTSOptions = {}
  ): SpeechSynthesisUtterance[] {
    const utterances: SpeechSynthesisUtterance[] = []

    segments.forEach((segment, index) => {
      const utterance = new SpeechSynthesisUtterance(segment.text)

      // Apply voice settings
      if (options.voice) {
        utterance.voice = options.voice
      }

      utterance.rate = options.rate ?? 1
      utterance.pitch = options.pitch ?? 1
      utterance.volume = options.volume ?? 1
      utterance.lang = options.lang ?? "sv-SE"

      // Add slight variation in pitch for natural flow (subtle)
      if (index % 3 === 0) {
        utterance.pitch = (options.pitch ?? 1) * 0.95
      }

      // Vary speed slightly for long texts
      if (segments.length > 10 && index % 4 === 0) {
        utterance.rate = (options.rate ?? 1) * 0.95
      }

      // Add pause after this utterance
      if (segment.pause && index < segments.length - 1) {
        utterance.onend = () => {
          // Pause is handled by the queue system
        }
      }

      utterances.push(utterance)
    })

    return utterances
  }

  /**
   * Speak text with natural prosody
   */
  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    // Cancel any ongoing speech
    this.cancel()

    // Preprocess text for natural reading
    const segments = this.preprocessText(text)

    // Create utterances
    this.utterances = this.createUtterances(segments, options)

    // Play utterances in sequence
    return new Promise((resolve) => {
      if (this.utterances.length === 0) {
        resolve()
        return
      }

      this.isPlaying = true
      this.currentIndex = 0
      let completedCount = 0

      this.utterances.forEach((utterance, index) => {
        utterance.onend = () => {
          completedCount++

          // If there's a pause defined in the segment, wait before playing next
          const nextIndex = index + 1
          if (nextIndex < this.utterances.length) {
            const pauseTime = 100 // default inter-utterance pause
            setTimeout(() => {
              window.speechSynthesis.speak(this.utterances[nextIndex])
            }, pauseTime)
          } else if (completedCount === this.utterances.length) {
            this.isPlaying = false
            resolve()
          }
        }

        utterance.onerror = () => {
          completedCount++
          if (completedCount === this.utterances.length) {
            this.isPlaying = false
            resolve()
          }
        }

        // Speak the first utterance immediately
        if (index === 0) {
          window.speechSynthesis.speak(utterance)
        }
      })
    })
  }

  /**
   * Stop speech
   */
  cancel(): void {
    window.speechSynthesis.cancel()
    this.isPlaying = false
  }

  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    return window.speechSynthesis.getVoices()
  }

  /**
   * Get Swedish voices
   */
  getSwedishVoices(): SpeechSynthesisVoice[] {
    return this.getVoices().filter((voice) => voice.lang.startsWith("sv"))
  }

  /**
   * Check if speech is active
   */
  isActive(): boolean {
    return this.isPlaying || window.speechSynthesis.speaking
  }
}

// Singleton instance
let ttsEngine: NaturalTTSEngine | null = null

export function getTTSEngine(): NaturalTTSEngine {
  if (!ttsEngine) {
    ttsEngine = new NaturalTTSEngine()
  }
  return ttsEngine
}
