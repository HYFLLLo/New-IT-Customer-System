'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Star, CheckCircle } from 'lucide-react'

const CURRENT_EMPLOYEE_ID = 'emp-001'

interface FeedbackModalProps {
  ticketId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmitted?: () => void
}

export default function FeedbackModal({ ticketId, open, onOpenChange, onSubmitted }: FeedbackModalProps) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) return

    setSubmitting(true)
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          userId: CURRENT_EMPLOYEE_ID,
          rating,
          comment,
        }),
      })
      setSubmitted(true)
      onSubmitted?.()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      onOpenChange(false)
      // Reset state after animation
      setTimeout(() => {
        setRating(0)
        setHoverRating(0)
        setComment('')
        setSubmitted(false)
      }, 300)
    }
  }

  const ratingLabels: Record<number, string> = {
    1: '非常不满意',
    2: '不满意',
    3: '一般',
    4: '满意',
    5: '非常满意',
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#12122a] border-[#2a2a4a] max-w-md p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="bg-gradient-to-r from-[#00f0ff]/10 to-[#00f0ff]/5 border-b border-[#2a2a4a] p-6">
          <DialogTitle className="text-white text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-[#ffcc00]" />
            满意度评价
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            /* Success State */
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#00ff88]/20 to-[#00ff88]/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#00ff88]/30">
                <CheckCircle className="w-8 h-8 text-[#00ff88]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">感谢您的评价！</h3>
              <p className="text-[#8888aa] mb-6">您的反馈将帮助我们不断提升服务质量</p>
              <Button
                onClick={handleClose}
                className="bg-gradient-to-r from-[#00f0ff] to-[#00c0cc] text-[#0a0a0f] hover:opacity-90"
              >
                确定
              </Button>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit}>
              <p className="text-[#ccccdd] mb-6 text-center">您对本次服务满意吗？</p>

              {/* Star Rating */}
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                    disabled={submitting}
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        star <= (hoverRating || rating)
                          ? 'fill-[#ffcc00] text-[#ffcc00] drop-shadow-[0_0_8px_rgba(255,204,0,0.5)]'
                          : 'text-[#2a2a4a]'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Rating Label */}
              {rating > 0 && (
                <p className="text-center text-[#00f0ff] mb-6 font-medium">
                  {ratingLabels[rating]}
                </p>
              )}

              {/* Comment */}
              <div className="mb-6">
                <label className="block text-sm text-[#8888aa] mb-2">
                  评价（可选）
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  placeholder="分享您的想法或建议..."
                  disabled={submitting}
                  className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#2a2a4a] rounded-lg text-[#ccccdd] placeholder-[#8888aa] focus:outline-none focus:border-[#00f0ff]/50 resize-none"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitting || rating === 0}
                className="w-full py-3 bg-gradient-to-r from-[#00f0ff] to-[#00c0cc] text-[#0a0a0f] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#0a0a0f] border-t-transparent rounded-full animate-spin" />
                    提交中...
                  </span>
                ) : (
                  '提交评价'
                )}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
