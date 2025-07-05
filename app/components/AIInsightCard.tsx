import React from 'react'
import ReactMarkdown from 'react-markdown'
import { SparklesIcon } from '@heroicons/react/24/outline'

export default function AIInsightCard({ result }: { result: string }) {
  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6 border border-gray-100">
      <h2 className="text-xl font-bold flex items-center mb-4">
        <SparklesIcon className="h-6 w-6 text-indigo-500 mr-2" />
        AI 기반 인사이트
      </h2>
      <div className="prose prose-indigo max-w-none text-gray-900">
        <ReactMarkdown
          components={{
            h1: ({ node, ...props }) => (
              <h1 className="text-2xl font-bold text-indigo-700 mt-6 mb-2" {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h2 className="text-lg font-bold text-blue-700 mt-6 mb-2" {...props} />
            ),
            h3: ({ node, ...props }) => (
              <h3 className="text-base font-semibold text-blue-600 mt-4 mb-2" {...props} />
            ),
            ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-2" {...props} />,
            ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-2" {...props} />,
            li: ({ node, ...props }) => <li className="mb-1" {...props} />,
            blockquote: ({ node, ...props }) => (
              <blockquote
                className="border-l-4 border-blue-300 bg-blue-50 p-3 my-4 italic text-blue-900"
                {...props}
              />
            ),
            strong: ({ node, ...props }) => (
              <strong className="text-indigo-700 font-semibold" {...props} />
            ),
            code: ({ node, ...props }) => (
              <code className="bg-gray-100 rounded px-1 text-pink-600" {...props} />
            ),
            hr: () => <hr className="my-4 border-t border-gray-200" />,
            p: ({ node, ...props }) => <p className="mb-2" {...props} />,
          }}
        >
          {result}
        </ReactMarkdown>
      </div>
    </div>
  )
}
