import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useSettingsStore, useTranscriptStore } from "@/stores"
import { Loader2Icon, CopyIcon, SparklesIcon, CheckIcon } from "lucide-react"

export function SummaryModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState("")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    const openaiApiKey = useSettingsStore.getState().openaiApiKey
    if (!openaiApiKey) {
      setError("Please add an OpenAI API Key in Settings to use this feature.")
      return
    }

    const segments = useTranscriptStore.getState().segments
    if (segments.length === 0) {
      setError("No transcript data available to summarize.")
      return
    }

    const transcript = segments.map(s => s.text).join(" ")

    setLoading(true)
    setError("")
    setResult("")
    setCopied(false)

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // fast and cheap
          messages: [
            {
              role: "system",
              content: "You are an expert sermon note-taker. Here is the raw transcript from a live session. First, write a 2-3 paragraph detailed summary of the speaker's core message. Second, extract the most important key points formatted into a numbered list of bite-sized highlights perfectly tailored for posting on social media like Twitter and Instagram."
            },
            {
              role: "user",
              content: `Here is the transcript to summarize and extract points from:\n\n${transcript}`
            }
          ],
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error("Failed to generate summary. Please check your API key.")
      }

      const data = await response.json()
      setResult(data.choices[0].message.content)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-purple-500" />
            AI Sermon Summary & Highlights
          </DialogTitle>
          <DialogDescription>
            Automatically generate a detailed summary and social media bullet points from your live transcript.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4 space-y-4">
          {!result && !loading && !error && (
             <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border rounded-lg border-dashed">
               <SparklesIcon className="size-8 mb-4 opacity-50" />
               <p>Click generate to build an intelligent summary + social media highlights from the current session's transcript.</p>
             </div>
          )}

          {error && <p className="text-destructive text-sm p-4 bg-destructive/10 rounded-md">{error}</p>}

          {loading && (
             <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
               <Loader2Icon className="size-8 mb-4 animate-spin" />
               <p>AI is analyzing the sermon transcript. Please wait...</p>
             </div>
          )}

          {result && (
            <div className="bg-muted p-4 rounded-md whitespace-pre-wrap text-sm leading-relaxed border border-border/50 select-text">
              {result}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 pt-4 border-t border-border flex sm:justify-between">
          <div>
            {result && (
              <Button 
                variant="outline" 
                onClick={handleCopy}
              >
                {copied ? <CheckIcon className="size-4 mr-2" /> : <CopyIcon className="size-4 mr-2" />}
                {copied ? "Copied!" : "Copy to Clipboard"}
              </Button>
            )}
          </div>
          <Button onClick={handleGenerate} disabled={loading} className="gap-2 shrink-0">
            {loading ? <Loader2Icon className="size-4 animate-spin" /> : <SparklesIcon className="size-4" />}
            {result ? "Regenerate" : "Generate Now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
