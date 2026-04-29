import { useCallback, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from 'axios'
import {
  AlertTriangle,
  CheckCircle2,
  FileArchive,
  Loader2,
  Upload as UploadIcon,
  X,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

type UploadSuccess = {
  success: true
  message: string
  data: {
    key: string
    name: string
    version: string
    description?: string
  }
  path: string
  has_plugin: boolean
  migrations: number
}

type UploadFailure = {
  status: number
  reason?: string
  message: string
  requires_core?: string
  core_version?: string
  signature_reason?: string
}

function isTarGz(file: File): boolean {
  const name = file.name.toLowerCase()
  return name.endsWith('.tar.gz') || name.endsWith('.tgz')
}

export function AddonsUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [result, setResult] = useState<UploadSuccess | null>(null)
  const [failure, setFailure] = useState<UploadFailure | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadMutation = useMutation({
    mutationFn: async (f: File) => {
      const form = new FormData()
      form.append('bundle', f)
      const { data } = await api.post<UploadSuccess>(
        '/addons/bundle/upload',
        form
      )
      return data
    },
    onSuccess: (data) => {
      setResult(data)
      setFailure(null)
      toast.success(data.message || 'Bundle instalado correctamente')
    },
    onError: (err) => {
      setResult(null)
      if (axios.isAxiosError(err)) {
        const status = err.response?.status ?? 0
        const body = err.response?.data ?? {}
        setFailure({
          status,
          reason: body.reason,
          message: body.message || err.message,
          requires_core: body.requires_core,
          core_version: body.core_version,
          signature_reason: body.signature_reason,
        })
      } else {
        setFailure({ status: 0, message: (err as Error).message })
      }
      toast.error('Error al subir el bundle')
    },
  })

  const handleFile = useCallback((f: File | null) => {
    setResult(null)
    setFailure(null)
    if (!f) {
      setFile(null)
      return
    }
    if (!isTarGz(f)) {
      toast.error('El archivo debe ser .tar.gz o .tgz')
      return
    }
    setFile(f)
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragging(false)
      const f = e.dataTransfer.files?.[0] ?? null
      handleFile(f)
    },
    [handleFile]
  )

  const submit = () => {
    if (!file) return
    uploadMutation.mutate(file)
  }

  const reset = () => {
    setFile(null)
    setResult(null)
    setFailure(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className='px-4 py-6 @7xl/content:mx-auto @7xl/content:w-full @7xl/content:max-w-4xl'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
          Subir bundle de complemento
        </h1>
        <p className='text-muted-foreground'>
          Instala un complemento desde un archivo .tar.gz firmado. Esta vía
          permite sideloading de addons personalizados.
        </p>
      </div>
      <Separator className='my-6' />

      <Card>
        <CardHeader>
          <CardTitle>Archivo del bundle</CardTitle>
          <CardDescription>
            Arrastra el archivo .tar.gz aquí o selecciónalo desde el disco.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div
            role='button'
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
            }}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center transition-colors',
              dragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            )}
          >
            <input
              ref={inputRef}
              type='file'
              accept='.tar.gz,.tgz,application/gzip,application/x-gzip'
              className='hidden'
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div className='flex items-center gap-3'>
                <FileArchive className='text-primary h-8 w-8' />
                <div className='text-left'>
                  <div className='font-medium'>{file.name}</div>
                  <div className='text-muted-foreground text-xs'>
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
            ) : (
              <>
                <UploadIcon className='text-muted-foreground h-10 w-10' />
                <div className='font-medium'>
                  Arrastra un archivo o haz clic para seleccionar
                </div>
                <div className='text-muted-foreground text-xs'>
                  Solo se aceptan archivos .tar.gz o .tgz
                </div>
              </>
            )}
          </div>

          <div className='flex items-center gap-2'>
            <Button
              disabled={!file || uploadMutation.isPending}
              onClick={submit}
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Subiendo e instalando
                </>
              ) : (
                <>
                  <UploadIcon className='h-4 w-4' />
                  Subir e instalar
                </>
              )}
            </Button>
            {(file || result || failure) && (
              <Button
                variant='outline'
                onClick={reset}
                disabled={uploadMutation.isPending}
              >
                <X className='h-4 w-4' />
                Limpiar
              </Button>
            )}
          </div>

          {result && <UploadSuccessPanel result={result} />}
          {failure && <UploadFailurePanel failure={failure} />}
        </CardContent>
      </Card>
    </div>
  )
}

function UploadSuccessPanel({ result }: { result: UploadSuccess }) {
  return (
    <Alert>
      <CheckCircle2 className='text-emerald-600' />
      <AlertTitle>{result.message}</AlertTitle>
      <AlertDescription>
        <ul className='mt-2 space-y-1 text-sm'>
          <li>
            <span className='font-medium'>Clave:</span> {result.data.key}
          </li>
          <li>
            <span className='font-medium'>Nombre:</span> {result.data.name}
          </li>
          <li>
            <span className='font-medium'>Versión:</span> {result.data.version}
          </li>
          <li>
            <span className='font-medium'>Ruta:</span>{' '}
            <code className='bg-muted rounded px-1 text-xs'>{result.path}</code>
          </li>
          <li>
            <span className='font-medium'>Plugin compilado:</span>{' '}
            {result.has_plugin ? 'Sí' : 'No'}
          </li>
          <li>
            <span className='font-medium'>Migraciones aplicadas:</span>{' '}
            {result.migrations}
          </li>
        </ul>
      </AlertDescription>
    </Alert>
  )
}

function UploadFailurePanel({ failure }: { failure: UploadFailure }) {
  const title = (() => {
    if (failure.status === 400) return 'Bundle inválido'
    if (failure.status === 409 && failure.reason === 'incompatible_core')
      return 'Núcleo incompatible'
    if (failure.status === 422 && failure.reason === 'invalid_signature')
      return 'Firma inválida'
    if (
      failure.status === 422 &&
      failure.reason === 'migration_checksum_mismatch'
    )
      return 'Checksum de migraciones no coincide'
    return 'Error al instalar el bundle'
  })()

  return (
    <Alert variant='destructive'>
      <AlertTriangle />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <div>{failure.message}</div>
        {failure.reason === 'incompatible_core' && (
          <ul className='mt-2 space-y-1 text-sm'>
            {failure.requires_core && (
              <li>
                <span className='font-medium'>Requiere núcleo:</span>{' '}
                {failure.requires_core}
              </li>
            )}
            {failure.core_version && (
              <li>
                <span className='font-medium'>Versión actual:</span>{' '}
                {failure.core_version}
              </li>
            )}
          </ul>
        )}
        {failure.reason === 'invalid_signature' && failure.signature_reason && (
          <div className='mt-2 text-sm'>
            <span className='font-medium'>Motivo:</span>{' '}
            {failure.signature_reason}
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}
