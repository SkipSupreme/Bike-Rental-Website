import { useState, useEffect } from 'react'
import { FileText, Save, Image, Check, AlertCircle, X } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function AdminContent() {
  const [content, setContent] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('hero')
  const [editData, setEditData] = useState({ title: '', body: '', imageUrl: '' })
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const sections = [
    { key: 'hero', label: 'Hero Banner', desc: 'Main homepage banner' },
    { key: 'about', label: 'About Section', desc: 'About Joe\'s Garage' },
    { key: 'location', label: 'Location', desc: 'Address and hours' },
    { key: 'contact', label: 'Contact Info', desc: 'Phone and email' },
    { key: 'repairs', label: 'Repairs Page', desc: 'Repair services info' },
    { key: 'waiver', label: 'Waiver Text', desc: 'Rental agreement terms' },
  ]

  useEffect(() => {
    fetchContent()
  }, [])

  useEffect(() => {
    if (content[activeSection]) {
      setEditData({
        title: content[activeSection].title || '',
        body: content[activeSection].body || '',
        imageUrl: content[activeSection].imageUrl || ''
      })
    } else {
      setEditData({ title: '', body: '', imageUrl: '' })
    }
  }, [activeSection, content])

  const fetchContent = async () => {
    try {
      const res = await fetch(`${API_URL}/api/content`, { credentials: 'include' })
      const data = await res.json()
      setContent(data.content || {})
    } catch (err) {
      setError('Failed to load content')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`${API_URL}/api/content/${activeSection}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editData)
      })

      if (!res.ok) throw new Error('Failed to save')

      const data = await res.json()
      setContent({ ...content, [activeSection]: data.content })
      setSuccess('Content saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('image', file)

    try {
      const res = await fetch(`${API_URL}/api/content/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      if (!res.ok) throw new Error('Upload failed')

      const data = await res.json()
      setEditData({ ...editData, imageUrl: data.imageUrl })
      setSuccess('Image uploaded!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to upload image')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-heading text-3xl">Website Content</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-3">
          <Check className="text-green-400" size={20} />
          <p className="text-green-200">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3">
          <AlertCircle className="text-red-400" size={20} />
          <p className="text-red-200">{error}</p>
          <button onClick={() => setError('')} className="ml-auto"><X size={18} /></button>
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-6">
        {/* Section List */}
        <div className="card md:col-span-1 h-fit">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="text-bike-orange" size={18} />
            Sections
          </h2>
          <div className="space-y-2">
            {sections.map(section => (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  activeSection === section.key
                    ? 'bg-bike-orange/20 text-bike-orange border border-bike-orange/50'
                    : 'bg-bike-dark/50 text-gray-300 hover:bg-bike-gray/50'
                }`}
              >
                <p className="font-medium">{section.label}</p>
                <p className="text-xs text-gray-500">{section.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Edit Form */}
        <div className="card md:col-span-3">
          <h2 className="font-semibold mb-4">
            Edit: {sections.find(s => s.key === activeSection)?.label}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="label">Title</label>
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="input"
                placeholder="Section title"
              />
            </div>

            <div>
              <label className="label">Content</label>
              <textarea
                value={editData.body}
                onChange={(e) => setEditData({ ...editData, body: e.target.value })}
                className="input min-h-64 font-mono text-sm"
                placeholder="Section content... (supports line breaks)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use line breaks for formatting. Text will display as written.
              </p>
            </div>

            {activeSection !== 'waiver' && activeSection !== 'contact' && activeSection !== 'location' && (
              <div>
                <label className="label flex items-center gap-2">
                  <Image size={16} />
                  Image (optional)
                </label>
                <div className="flex gap-4 items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={editData.imageUrl}
                      onChange={(e) => setEditData({ ...editData, imageUrl: e.target.value })}
                      className="input"
                      placeholder="Image URL or upload below"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="mt-2 text-sm text-gray-400"
                    />
                  </div>
                  {editData.imageUrl && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-bike-dark border border-bike-gray">
                      <img
                        src={editData.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="mt-6 pt-6 border-t border-bike-gray/50">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Preview</h3>
            <div className="bg-bike-dark/50 rounded-lg p-4">
              {editData.title && (
                <h4 className="text-xl font-semibold mb-2 text-bike-orange">{editData.title}</h4>
              )}
              <p className="text-gray-300 whitespace-pre-line">{editData.body || 'No content yet...'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 p-4 bg-bike-orange/10 border border-bike-orange/30 rounded-lg">
        <h3 className="font-semibold mb-2 text-bike-orange">Tips for Editing</h3>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Press Enter to create line breaks in the content</li>
          <li>• Changes are saved when you click "Save Changes"</li>
          <li>• Upload images directly or paste URLs from other sources</li>
          <li>• The waiver text appears when customers sign up</li>
          <li>• Changes appear on the website immediately after saving</li>
        </ul>
      </div>
    </div>
  )
}
