'use client'

import React from 'react'

export default function DesignSystemTest() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Typography Section */}
      <section className="space-y-4">
        <h2 className="heading-2 text-primary-600">Typography System</h2>
        
        <div className="space-y-2">
          <h1 className="heading-1">Heading 1 - Design System</h1>
          <h2 className="heading-2">Heading 2 - Design System</h2>
          <h3 className="heading-3">Heading 3 - Design System</h3>
          <h4 className="heading-4">Heading 4 - Design System</h4>
          <h5 className="heading-5">Heading 5 - Design System</h5>
          <h6 className="heading-6">Heading 6 - Design System</h6>
        </div>

        <div className="space-y-2">
          <p className="body-large">Large body text for important content that needs emphasis.</p>
          <p className="body-regular">Regular body text for normal content paragraphs.</p>
          <p className="body-small">Small body text for secondary information.</p>
          <p className="label">LABEL TEXT FOR FORM ELEMENTS</p>
          <p className="caption">Caption text for additional context</p>
          <code className="code">const designSystem = 'working'</code>
        </div>
      </section>

      {/* Color Palette Section */}
      <section className="space-y-4">
        <h2 className="heading-2 text-primary-600">Color Palette</h2>
        
        {/* Primary Colors */}
        <div>
          <h3 className="heading-4 mb-3">Primary Colors</h3>
          <div className="flex flex-wrap gap-2">
            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => (
              <div key={shade} className="text-center">
                <div className={`w-20 h-20 rounded-lg bg-primary-${shade} border border-gray-200`}></div>
                <span className="text-xs">{shade}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Semantic Colors */}
        <div>
          <h3 className="heading-4 mb-3">Semantic Colors</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="w-full h-16 bg-success-500 rounded-lg"></div>
              <p className="text-sm font-medium">Success</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-warning-500 rounded-lg"></div>
              <p className="text-sm font-medium">Warning</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-danger-500 rounded-lg"></div>
              <p className="text-sm font-medium">Danger</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-16 bg-info-500 rounded-lg"></div>
              <p className="text-sm font-medium">Info</p>
            </div>
          </div>
        </div>

        {/* Role Colors */}
        <div>
          <h3 className="heading-4 mb-3">Role-Specific Colors</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-role-admin rounded-full"></div>
              <span className="text-sm">Admin</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-role-sales rounded-full"></div>
              <span className="text-sm">Sales</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-role-finance rounded-full"></div>
              <span className="text-sm">Finance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-role-operations rounded-full"></div>
              <span className="text-sm">Operations</span>
            </div>
          </div>
        </div>
      </section>

      {/* Spacing Section */}
      <section className="space-y-4">
        <h2 className="heading-2 text-primary-600">Spacing System</h2>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map((space) => (
            <div key={space} className="flex items-center gap-4">
              <span className="text-sm font-mono w-16">space-{space}</span>
              <div className={`h-4 bg-primary-500 rounded w-${space * 4}`}></div>
            </div>
          ))}
        </div>
      </section>

      {/* Shadows Section */}
      <section className="space-y-4">
        <h2 className="heading-2 text-primary-600">Shadow System</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['xs', 'sm', 'md', 'lg', 'xl', '2xl'].map((shadow) => (
            <div key={shadow} className={`bg-white p-6 rounded-lg shadow-${shadow} text-center`}>
              <p className="font-medium">shadow-{shadow}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Border Radius Section */}
      <section className="space-y-4">
        <h2 className="heading-2 text-primary-600">Border Radius</h2>
        <div className="flex flex-wrap gap-4">
          {['none', 'sm', 'DEFAULT', 'md', 'lg', 'xl', '2xl', '3xl', 'full'].map((radius) => (
            <div key={radius} className="text-center">
              <div className={`w-24 h-24 bg-primary-500 rounded-${radius === 'DEFAULT' ? '' : radius}`}></div>
              <span className="text-sm">{radius}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Elements */}
      <section className="space-y-4">
        <h2 className="heading-2 text-primary-600">Interactive Elements</h2>
        
        {/* Buttons */}
        <div>
          <h3 className="heading-4 mb-3">Buttons</h3>
          <div className="flex flex-wrap gap-4">
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors focus-ring">
              Primary Button
            </button>
            <button className="px-4 py-2 bg-secondary-100 text-secondary-900 rounded-lg hover:bg-secondary-200 transition-colors focus-ring">
              Secondary Button
            </button>
            <button className="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors focus-ring-success">
              Success Button
            </button>
            <button className="px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors focus-ring-danger">
              Danger Button
            </button>
          </div>
        </div>

        {/* Elevation Interactive */}
        <div>
          <h3 className="heading-4 mb-3">Interactive Cards</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 bg-white rounded-xl elevation-interactive cursor-pointer">
              <h4 className="font-semibold mb-2">Interactive Card</h4>
              <p className="text-gray-600">Hover to see elevation change</p>
            </div>
            <div className="p-6 bg-white rounded-xl elevation-interactive cursor-pointer">
              <h4 className="font-semibold mb-2">Another Card</h4>
              <p className="text-gray-600">Smooth shadow transition</p>
            </div>
            <div className="p-6 bg-white rounded-xl elevation-interactive cursor-pointer">
              <h4 className="font-semibold mb-2">Third Card</h4>
              <p className="text-gray-600">Click to see active state</p>
            </div>
          </div>
        </div>
      </section>

      {/* Grid System */}
      <section className="space-y-4">
        <h2 className="heading-2 text-primary-600">Grid System</h2>
        <div className="grid grid-cols-12 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-primary-100 p-4 rounded text-center text-sm font-medium">
              {i + 1}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4 bg-primary-200 p-4 rounded text-center">col-span-4</div>
          <div className="col-span-4 bg-primary-200 p-4 rounded text-center">col-span-4</div>
          <div className="col-span-4 bg-primary-200 p-4 rounded text-center">col-span-4</div>
        </div>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-3 bg-primary-300 p-4 rounded text-center">col-span-3</div>
          <div className="col-span-6 bg-primary-300 p-4 rounded text-center">col-span-6</div>
          <div className="col-span-3 bg-primary-300 p-4 rounded text-center">col-span-3</div>
        </div>
      </section>
    </div>
  )
}