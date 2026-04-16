import { useState } from "react"
import { LevelMeter } from "@/components/ui/level-meter"
import { LiveIndicator } from "@/components/ui/live-indicator"
import { Badge } from "@/components/ui/badge"
import { MicIcon, PaletteIcon, CastIcon, SunIcon, MoonIcon, DownloadIcon, Trash2Icon, SparklesIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { save } from "@tauri-apps/plugin-dialog"
import { writeTextFile } from "@tauri-apps/plugin-fs"
import { SummaryModal } from "@/components/panels/summary-modal"
import { SettingsDialog } from "@/components/settings-dialog"
import { ThemeDesigner } from "@/components/broadcast/theme-designer"
import { BroadcastSettings } from "@/components/broadcast/broadcast-settings"
import { useAudioStore, useTranscriptStore, useBroadcastStore, useDetectionStore } from "@/stores"
import { useTheme } from "@/components/theme-provider"

export function TransportBar() {
  const { theme, setTheme } = useTheme()
  const audioLevel = useAudioStore((s) => s.level)
  const isTranscribing = useTranscriptStore((s) => s.isTranscribing)
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [showSummaryModal, setShowSummaryModal] = useState(false)

  const handleSaveSession = async () => {
    const segments = useTranscriptStore.getState().segments
    const detections = useDetectionStore.getState().detections

    if (segments.length === 0 && detections.length === 0) return

    const now = new Date()
    const dateStr = now.toLocaleDateString()
    const timeStr = now.toLocaleTimeString()

    let md = `# Session Notes - ${dateStr} ${timeStr}\n\n`

    if (detections.length > 0) {
      md += `## Bible Verses Detected\n\n`
      detections.forEach((d: any) => {
        md += `### ${d.verse_ref}\n> ${d.verse_text}\n\n`
      })
    }

    if (segments.length > 0) {
      md += `## Full Transcript\n\n`
      segments.forEach((seg: any) => {
        md += `${seg.text}\n\n`
      })
    } else {
      md += `*No transcript recorded.*\n`
    }

    try {
      const filePath = await save({
        title: "Save Session Notes",
        defaultPath: `Rhema_Session_${now.toISOString().split('T')[0]}.md`,
        filters: [{
          name: 'Markdown',
          extensions: ['md']
        }]
      })

      if (filePath) {
        await writeTextFile(filePath, md)
      }
    } catch (e) {
      console.error("Failed to save session notes:", e)
    }
  }

  const handleClear = () => {
    useTranscriptStore.getState().clearTranscript()
    useDetectionStore.getState().clearDetections()
  }

  return (
    <div
      data-slot="transport-bar"
      className="col-span-4 flex h-14 items-center justify-between border-b border-border  bg-card px-3"
    >
      {/* Left: Logo + Plan Badge */}
      <div className="flex items-center gap-2.5">
        <span className="text-sm font-semibold tracking-tight text-foreground">
          Rhema
        </span>
        <Badge variant="outline" className="text-[0.5625rem] uppercase">
          Free
        </Badge>
      </div>

      {/* Right: Audio + Status + Settings */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <MicIcon className="size-3.5 text-muted-foreground" />
          <LevelMeter level={audioLevel.rms} bars={4} />
        </div>
        <LiveIndicator active={isTranscribing} />

        <div className="h-4 w-px bg-border mx-1" />

        <Button
          variant="ghost"
          size="icon-sm"
          className="text-purple-500 hover:text-purple-400 hover:bg-purple-500/10"
          onClick={() => setShowSummaryModal(true)}
          title="AI Summary & Highlights"
        >
          <SparklesIcon className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={handleSaveSession}
          title="Save session notes"
        >
          <DownloadIcon className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={handleClear}
          title="Clear session"
        >
          <Trash2Icon className="size-3.5" />
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        <Button
          variant="ghost"
          size="icon-sm"
          title="Toggle theme"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <SunIcon className="size-3.5" />
          ) : (
            <MoonIcon className="size-3.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          title="Broadcast Settings"
          data-tour="broadcast"
          onClick={() => setBroadcastOpen(true)}
        >
          <CastIcon className="size-3.5" />
        </Button>
        <BroadcastSettings open={broadcastOpen} onOpenChange={setBroadcastOpen} />
        <Button
          variant="ghost"
          size="icon-sm"
          title="Theme Designer"
          data-tour="theme"
          onClick={() => useBroadcastStore.getState().setDesignerOpen(true)}
        >
          <PaletteIcon className="size-3.5" />
        </Button>
        <ThemeDesigner />
        <SettingsDialog />
        <SummaryModal open={showSummaryModal} onOpenChange={setShowSummaryModal} />
      </div>
    </div>
  )
}
