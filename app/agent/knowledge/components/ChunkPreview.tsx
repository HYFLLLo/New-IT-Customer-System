'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { toast } from 'sonner'
import { X, Copy, Check } from 'lucide-react'

interface ChunkPreviewProps {
  chunk: {
    id: string
    content: string
    chunkIndex: number
  } | null
  onClose: () => void
}

export function ChunkPreview({ chunk, onClose }: ChunkPreviewProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!chunk) return

    if (!navigator.clipboard) {
      toast.error('复制失败：剪贴板不可用')
      return
    }

    try {
      await navigator.clipboard.writeText(chunk.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Copy chunk error:', error)
      toast.error('复制失败')
    }
  }

  return (
    <Dialog.Root open={chunk !== null} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[85vh] bg-white rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-900">
                Chunk #{chunk ? chunk.chunkIndex + 1 : 0}
              </span>
              {chunk && (
                <span className="text-xs text-gray-500">
                  {chunk.content.length} 字符
                </span>
              )}
            </div>
            <Dialog.Close className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {chunk ? (
              <pre className="text-sm text-gray-700 whitespace-pre-wrap break-all bg-gray-50 p-4 rounded-lg font-mono">
                {chunk.content}
              </pre>
            ) : (
              <div className="text-center text-gray-500 py-8">
                暂无内容
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button
              onClick={handleCopy}
              disabled={!chunk}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  复制内容
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
            >
              关闭
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}