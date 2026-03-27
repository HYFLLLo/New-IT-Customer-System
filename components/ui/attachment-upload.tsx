'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Paperclip, X, Image as ImageIcon, FileText, Loader2 } from 'lucide-react'

interface Attachment {
  id: string
  fileName: string
  fileType: string
  filePath: string
  fileSize: number
}

interface AttachmentUploadProps {
  messageId: string
  onUploadComplete?: (attachment: Attachment) => void
  onRemove?: (attachmentId: string) => void
}

export function AttachmentUpload({ messageId, onUploadComplete, onRemove }: AttachmentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('messageId', messageId)

        const res = await fetch('/api/attachments', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const error = await res.json()
          toast.error(error.error || '上传失败')
          continue
        }

        const data = await res.json()
        setAttachments(prev => [...prev, data.attachment])
        onUploadComplete?.(data.attachment)
        toast.success(`${file.name} 上传成功`)
      } catch (error) {
        toast.error(`上传 ${file.name} 失败`)
      }
    }

    setUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemove = async (attachmentId: string) => {
    setAttachments(prev => prev.filter(a => a.id !== attachmentId))
    onRemove?.(attachmentId)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="w-4 h-4" />
    if (fileType === 'application/pdf') return <FileText className="w-4 h-4" />
    return <Paperclip className="w-4 h-4" />
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="h-8"
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Paperclip className="w-4 h-4 mr-2" />
        )}
        添加附件
      </Button>

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm"
            >
              {getFileIcon(attachment.fileType)}
              <span className="max-w-[150px] truncate">{attachment.fileName}</span>
              <span className="text-gray-500 text-xs">
                {formatFileSize(attachment.fileSize)}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(attachment.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
