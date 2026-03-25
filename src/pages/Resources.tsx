import { useEffect, useState } from 'react';
import { resourceService } from '../services/resource.service';
import { Plus, Edit, Trash2, X, FileText } from 'lucide-react';

interface Resource {
  _id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  moodTags: string[];
  content: string | null;
  contentUrl?: string | null;
  thumbnail?: string;
  tags: string[];
  isFeatured: boolean;
  active: boolean;
  createdAt: string;
}

const initialForm = {
  title: '',
  description: '',
  category: 'reading',
  type: 'article',
  moodTags: '',
  content: '',
  contentUrl: '',
  tags: '',
  thumbnail: '',
  isFeatured: false
};

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false); // ← duplicate-submit guard

  const fetchResources = async () => {
    setLoading(true);
    try {
      const data = await resourceService.getAll();
      setResources(Array.isArray(data) ? data : data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const openModal = () => {
    setEditing(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(initialForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Block re-entry — prevents StrictMode double-invoke & rapid clicks
    if (submitting) return;
    setSubmitting(true);

    const payload = {
      ...form,
      moodTags: form.moodTags.split(',').map(t => t.trim()).filter(t => t),
      tags: form.tags.split(',').map(t => t.trim()).filter(t => t),
    };

    try {
      if (editing) {
        await resourceService.update(editing._id, payload);
      } else {
        await resourceService.create(payload);
      }
      closeModal();
      fetchResources();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      await resourceService.delete(id);
      fetchResources();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resources</h2>
          <p className="text-sm text-gray-500">Manage articles, videos, and exercises.</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" /> Add Resource
        </button>
      </div>

      {/* Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-gray-400">Loading…</div>
        ) : resources.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-400">No resources yet.</div>
        ) : (
          resources.map(r => (
            <div
              key={r._id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-1 bg-sky-50 text-sky-700 text-[10px] font-bold uppercase rounded tracking-wider">
                      {r.category}
                    </span>
                    {r.moodTags?.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold uppercase rounded tracking-wider">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditing(r);
                        setForm({
                          title: r.title,
                          description: r.description || '',
                          category: r.category,
                          type: r.type,
                          moodTags: r.moodTags?.join(', ') || '',
                          content: r.content || '',
                          contentUrl: r.contentUrl || '',
                          tags: r.tags?.join(', ') || '',
                          thumbnail: r.thumbnail || '',
                          isFeatured: r.isFeatured || false
                        });
                        setShowModal(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-md"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(r._id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h4 className="font-bold text-gray-900 leading-tight mb-2">{r.title}</h4>
                <p className="text-sm text-gray-500 line-clamp-3 mb-4">{r.description || r.content}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-50 uppercase tracking-widest font-semibold">
                <div className="flex items-center">
                  <FileText className="w-3 h-3 mr-1" /> {r.type}
                </div>
                <span>{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

            {/* Sticky Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 shrink-0">
              <h3 className="text-xl font-bold text-gray-900">
                {editing ? 'Edit Resource' : 'New Resource'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Scrollable Body */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto flex-1 px-6 py-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-1 focus:ring-sky-500 outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-1 focus:ring-sky-500 outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                    <select
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-1 focus:ring-sky-500 outline-none"
                    >
                      <option value="reading">Reading</option>
                      <option value="exercise">Exercise</option>
                      <option value="meditation">Meditation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                    <select
                      value={form.type}
                      onChange={e => setForm({ ...form, type: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-1 focus:ring-sky-500 outline-none"
                    >
                      <option value="article">Article</option>
                      <option value="video">Video</option>
                      <option value="audio">Audio</option>
                      <option value="exercise">Exercise</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Mood Tags <span className="text-gray-400 font-normal">(comma separated)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. anxious, stressed, overwhelmed"
                      value={form.moodTags}
                      onChange={e => setForm({ ...form, moodTags: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-1 focus:ring-sky-500 outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      General Tags <span className="text-gray-400 font-normal">(comma separated)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. habits, wellness, mental health"
                      value={form.tags}
                      onChange={e => setForm({ ...form, tags: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-1 focus:ring-sky-500 outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Content Text</label>
                    <textarea
                      rows={4}
                      value={form.content}
                      onChange={e => setForm({ ...form, content: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-1 focus:ring-sky-500 outline-none resize-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Content URL / Video Link</label>
                    <input
                      type="url"
                      value={form.contentUrl}
                      onChange={e => setForm({ ...form, contentUrl: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-1 focus:ring-sky-500 outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Thumbnail URL</label>
                    <input
                      type="url"
                      value={form.thumbnail}
                      onChange={e => setForm({ ...form, thumbnail: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-1 focus:ring-sky-500 outline-none"
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isFeatured"
                      checked={form.isFeatured}
                      onChange={e => setForm({ ...form, isFeatured: e.target.checked })}
                      className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                    />
                    <label htmlFor="isFeatured" className="text-sm font-semibold text-gray-700">
                      Feature this resource
                    </label>
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="px-6 py-4 border-t border-gray-100 shrink-0">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition-all shadow-lg shadow-sky-100 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving…' : editing ? 'Save Changes' : 'Create Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}