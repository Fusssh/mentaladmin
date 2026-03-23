import { useEffect, useState } from 'react';
import api from '../services/api';
import { Search, Plus, Trash2, Edit, X } from 'lucide-react';

interface Resource {
  _id: string; title: string; description: string; category: string; type: string;
  contentUrl?: string | null; content?: string | null; thumbnail?: string | null;
  tags: string[]; moodTags: string[]; isFeatured: boolean; active: boolean; createdAt: string;
}

const empty: Omit<Resource, '_id' | 'createdAt'> = { title: '', description: '', category: 'reading', type: 'article', contentUrl: '', content: '', thumbnail: '', tags: [], moodTags: [], isFeatured: false, active: true };

export default function Resources() {
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [form, setForm] = useState(empty);
  const [tagsInput, setTagsInput] = useState('');

  const fetch_ = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (search) p.set('q', search);
      if (catFilter) p.set('category', catFilter);
      const res = await api.get(`/resources?${p}`);
      setItems(Array.isArray(res.data) ? res.data : res.data.items || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { const t = setTimeout(fetch_, 400); return () => clearTimeout(t); }, [search, catFilter]);

  const openCreate = () => { setEditing(null); setForm(empty); setTagsInput(''); setShowForm(true); };
  const openEdit = (r: Resource) => { setEditing(r); setForm({ title: r.title, description: r.description, category: r.category, type: r.type, contentUrl: r.contentUrl || '', content: r.content || '', thumbnail: r.thumbnail || '', tags: r.tags, moodTags: r.moodTags, isFeatured: r.isFeatured, active: r.active }); setTagsInput(r.tags.join(', ')); setShowForm(true); };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const body = { ...form, tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean) };
    try {
      if (editing) { await api.patch(`/resources/${editing._id}`, body); }
      else { await api.post('/resources', body); }
      setShowForm(false); fetch_();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this resource?')) return;
    try { await api.delete(`/resources/${id}`); setItems(i => i.filter(x => x._id !== id)); } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h2 className="text-2xl font-bold text-gray-900">Resource Management</h2><p className="mt-1 text-sm text-gray-500">Manage articles, exercises, and meditations.</p></div>
        <div className="flex gap-3 items-center">
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">All Categories</option>
            <option value="reading">Reading</option>
            <option value="meditation">Meditation</option>
            <option value="exercise">Exercise</option>
            <option value="articles">Articles</option>
            <option value="anxiety">Anxiety</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="pl-10 pr-3 py-2 border rounded-lg text-sm shadow-sm" />
          </div>
          <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors"><Plus className="w-4 h-4" />Add</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? [1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-200 rounded-2xl animate-pulse" />) : items.length === 0 ? <p className="col-span-3 text-center text-gray-400 py-10">No resources found.</p> : items.map(r => (
          <div key={r._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
            {r.thumbnail && <img src={r.thumbnail} alt="" className="h-32 w-full object-cover" />}
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-start justify-between">
                <h4 className="text-sm font-bold text-gray-900 line-clamp-2">{r.title}</h4>
                <div className="flex gap-1 ml-2 shrink-0">
                  <button onClick={() => openEdit(r)} className="p-1 text-gray-400 hover:text-sky-600 rounded"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(r._id)} className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.description}</p>
              <div className="mt-auto pt-3 flex items-center gap-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">{r.category}</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{r.type}</span>
                {r.isFeatured && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Featured</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b"><h3 className="text-lg font-bold">{editing ? 'Edit Resource' : 'New Resource'}</h3><button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Title</label><input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label><input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm"><option value="article">Article</option><option value="video">Video</option><option value="audio">Audio</option><option value="exercise">Exercise</option></select></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Content URL</label><input value={form.contentUrl || ''} onChange={e => setForm({ ...form, contentUrl: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="https://…" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Content (text)</label><textarea value={form.content || ''} onChange={e => setForm({ ...form, content: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label><input value={tagsInput} onChange={e => setTagsInput(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="anxiety, stress, calm" /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
