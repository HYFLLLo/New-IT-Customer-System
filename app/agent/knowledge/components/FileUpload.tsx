'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, FileText, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface FileUploadProps {
  onUploadComplete: () => void
}

const SUPPORTED_TYPES = ['application/pdf', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const SUPPORTED_EXTENSIONS = ['.pdf', '.md', '.docx']

export function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      return `不支持的文件类型。请上传以下格式: ${SUPPORTED_EXTENSIONS.join(', ')}`
    }
    if (!SUPPORTED_TYPES.includes(file.type) && !file.name.endsWith('.md')) {
      if (file.type === 'text/plain' && ext === '.md') {
        return null // Allow .md files with text/plain type
      }
      return `文件类型验证失败。请确保文件扩展名为: ${SUPPORTED_EXTENSIONS.join(', ')}`
    }
    return null
  }

  const uploadFile = async (file: File) => {
    const error = validateFile(file)
    if (error) {
      toast.error(error)
      return
    }

    setFileName(file.name)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('uploadedById', 'default-user') // TODO: Use actual user ID

      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest()

      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100)
            setUploadProgress(progress)
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText)
              reject(new Error(errorData.error || '上传失败'))
            } catch {
              reject(new Error(`上传失败 (${xhr.status})`))
            }
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('网络错误，请重试'))
        })

        xhr.addEventListener('timeout', () => {
          reject(new Error('上传超时，请重试'))
        })

        xhr.open('POST', '/api/agent/knowledge')
        xhr.timeout = 120000 // 2 minutes
        xhr.send(formData)
      })

      toast.success('文件上传成功')
      setFileName(null)
      onUploadComplete()
    } catch (error) {
      const message = error instanceof Error ? error.message : '上传失败'
      toast.error(message)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      uploadFile(files[0])
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      uploadFile(files[0])
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const handleCancel = () => {
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    setFileName(null)
    setIsUploading(false)
    setUploadProgress(0)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'pointer-events-none opacity-75' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.md,.docx"
          className="hidden"
          onChange={handleFileSelect}
        />

        {isUploading ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-700">{fileName}</p>
                <p className="text-xs text-gray-500">上传中... {uploadProgress}%</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleCancel()
                }}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 bg-gray-100 rounded-full">
                <Upload className="w-6 h-6 text-gray-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-700">
                  拖拽文件到此处，或<span className="text-blue-500">点击选择</span>
                </p>
                <p className="text-xs text-gray-500">
                  支持 PDF、Markdown、DOCX 格式
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Accepted file types hint */}
      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-400">
        <FileText className="w-3 h-3" />
        <span>支持格式: PDF, MD, DOCX</span>
      </div>
    </div>
  )
}