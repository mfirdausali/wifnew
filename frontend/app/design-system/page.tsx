import DesignSystemTest from '@/components/design-system/DesignSystemTest'

export default function DesignSystemPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="py-8">
        <h1 className="heading-1 text-center mb-8">Design System Test Page</h1>
        <DesignSystemTest />
      </div>
    </main>
  )
}