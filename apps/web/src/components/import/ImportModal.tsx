import { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react'
import { Upload, Download } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { importApi } from '@/lib/api'

interface ImportModalProps {
  petId: string
  type: 'weight' | 'events'
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const FORMAT_HINTS: Record<'weight' | 'events', string> = {
  weight: 'Oczekiwany format CSV: Data,Waga_kg lub date,weight\nPrzykład: 2024-01-15,4.5',
  events: 'Oczekiwany format CSV: Tytul,Data,Typ,Lokalizacja,Notatki\nTypy: VET_VISIT, DEWORMING, GROOMING, WEIGHT_CHECK, OTHER\n(lub po polsku: wizyta, odrobaczanie, pielęgnacja, waga, inne)',
}

function generateTemplate(type: 'weight' | 'events'): string {
  if (type === 'weight') {
    return 'Data,Waga_kg\n2024-01-01,4.50\n2024-02-01,4.60\n2024-03-01,4.55\n'
  }
  return 'Tytul,Data,Typ,Lokalizacja,Notatki\nWizyta kontrolna,2024-01-15,VET_VISIT,Klinika Pejzaż,Coroczna kontrola\nOdrobaczanie,2024-02-01,DEWORMING,,\nGrooming,2024-03-10,GROOMING,Salon Fluffy,\n'
}

function parsePreview(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  return lines.slice(0, 6).map((l) => l.split(',').map((c) => c.trim()))
}

export function ImportModal({ petId, type, open, onClose, onSuccess }: ImportModalProps) {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string[][]>([])
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((f: File) => {
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setPreview(parsePreview(text))
    }
    reader.readAsText(f, 'utf-8')
  }, [])

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) handleFile(selected)
  }

  const handleImport = async () => {
    if (!file) return
    setLoading(true)
    try {
      const result = type === 'weight'
        ? await importApi.importWeight(petId, file)
        : await importApi.importEvents(petId, file)

      const msg = `Zaimportowano: ${result.imported}, pominięto: ${result.skipped}`
      if (result.errors.length > 0) {
        toast({ title: msg, description: result.errors.slice(0, 3).join('\n'), variant: 'destructive' })
      } else {
        toast({ title: 'Import zakończony', description: msg })
      }
      onSuccess()
      handleClose()
    } catch {
      toast({ title: 'Błąd importu', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setPreview([])
    onClose()
  }

  const downloadTemplate = () => {
    const content = generateTemplate(type)
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = type === 'weight' ? 'waga_szablon.csv' : 'zdarzenia_szablon.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const title = type === 'weight' ? 'Importuj wagę z CSV' : 'Importuj zdarzenia z CSV'

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Format hint */}
          <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground whitespace-pre-wrap">
            {FORMAT_HINTS[type]}
          </div>

          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50'}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            {file ? (
              <div className="space-y-1">
                <p className="font-medium text-sm">{file.name}</p>
                <Badge variant="outline">{(file.size / 1024).toFixed(1)} KB</Badge>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Przeciągnij plik CSV lub kliknij, aby wybrać
              </p>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleChange}
            />
          </div>

          {/* Preview table */}
          {preview.length > 0 && (
            <div className="overflow-x-auto">
              <p className="text-xs text-muted-foreground mb-1">Podgląd (pierwsze {Math.min(5, preview.length - 1)} wierszy):</p>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    {preview[0].map((h, i) => (
                      <th key={i} className="border px-2 py-1 bg-muted text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(1, 6).map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="border px-2 py-1">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-1" />
              Pobierz szablon
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>Anuluj</Button>
              <Button onClick={handleImport} disabled={!file || loading}>
                {loading ? 'Importuję...' : 'Importuj'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
