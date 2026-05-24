import ChatWidget from '@/components/ChatWidget'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">After-Hours AI Lead Assistant</p>
      <ChatWidget />
    </div>
  )
}
