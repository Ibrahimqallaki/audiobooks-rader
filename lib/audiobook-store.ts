"use client"

export interface Audiobook {
  id: string
  title: string
  author: string
  coverUrl: string | null
  audioUrl: string
  duration: number
  currentTime: number
  lastPlayed: Date
  chapters: Chapter[]
}

export interface Chapter {
  id: string
  title: string
  startTime: number
  endTime: number
}

export interface Bookmark {
  id: string
  audiobookId: string
  time: number
  note: string
  createdAt: Date
}

// Simple in-memory store for the MVP
// In production, you'd use a database
let audiobooks: Audiobook[] = []
let bookmarks: Bookmark[] = []
let listeners: (() => void)[] = []

export function subscribe(listener: () => void) {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

function notify() {
  listeners.forEach((l) => l())
}

export function getAudiobooks() {
  return audiobooks
}

export function getAudiobook(id: string) {
  return audiobooks.find((a) => a.id === id)
}

export function addAudiobook(audiobook: Omit<Audiobook, "id" | "lastPlayed" | "currentTime">) {
  const newBook: Audiobook = {
    ...audiobook,
    id: crypto.randomUUID(),
    currentTime: 0,
    lastPlayed: new Date(),
  }
  audiobooks = [...audiobooks, newBook]
  notify()
  return newBook
}

export function updateProgress(id: string, currentTime: number) {
  audiobooks = audiobooks.map((a) =>
    a.id === id ? { ...a, currentTime, lastPlayed: new Date() } : a
  )
  notify()
}

export function removeAudiobook(id: string) {
  audiobooks = audiobooks.filter((a) => a.id !== id)
  bookmarks = bookmarks.filter((b) => b.audiobookId !== id)
  notify()
}

export function getBookmarks(audiobookId: string) {
  return bookmarks.filter((b) => b.audiobookId === audiobookId)
}

export function addBookmark(audiobookId: string, time: number, note: string) {
  const bookmark: Bookmark = {
    id: crypto.randomUUID(),
    audiobookId,
    time,
    note,
    createdAt: new Date(),
  }
  bookmarks = [...bookmarks, bookmark]
  notify()
  return bookmark
}

export function removeBookmark(id: string) {
  bookmarks = bookmarks.filter((b) => b.id !== id)
  notify()
}
