'use client'

import { useState } from 'react'
import { DocumentList } from './components/DocumentList'
import { SearchTest } from './components/SearchTest'
import { FileUpload } from './components/FileUpload'

type Tab = 'documents' | 'search'

export default function KnowledgePage() {
  const [activeTab, setActiveTab] = useState<Tab>('documents')
  const [refreshKey, setRefreshKey] = useState(0)

  const handleUploadComplete = () => {
    setRefreshKey(k => k + 1)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">知识库管理</h1>
        <p className="text-gray-500 text-sm mt-1">
          管理文档、上传新知识、测试检索效果
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'documents'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          文档管理
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'search'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          搜索测试
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <FileUpload onUploadComplete={handleUploadComplete} />
            <DocumentList refreshKey={refreshKey} />
          </div>
        )}
        {activeTab === 'search' && <SearchTest />}
      </div>
    </div>
  )
}