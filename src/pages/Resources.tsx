import { useEffect, useState } from 'react';
import { resourceService } from '../services/resource.service';
import { Plus, Edit, Trash2, X, FileText } from 'lucide-react';

interface Resource {
  _id: string; title: string; category: string; type: string;
  content: string; url?: string; createdAt: string;
}

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [form, setForm] = useState({ title: '', category: 'article', type: 'reading', content: '', url: '' });

  const fetchResources = async () => {
    setLoading(true);
    try {
      const data = await resourceService.getAll();
      setResources(Array.isArray(data) ? data : data.items || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchResources(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) await resourceService.update(editing._id, form);
      else await resourceService.create(form);
      setShowModal(false); setEditing(null); setForm({ title: '', category: 'article', type: 'reading', content: '', url: '' });
      fetchResources();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this resource?')) return;
    try { await resourceService.delete(id); fetchResources(); } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-gray-900">Resources</h2><p className="text-sm text-gray-500">Manage articles, videos, and exercises.</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"><Plus className="w-5 h-5 mr-2" /> Add Resource</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? <div className="col-span-full py-20 text-center text-gray-400">Loading…</div> : resources.length === 0 ? <div className="col-span-full py-20 text-center text-gray-400">No resources yet.</div> : resources.map(r => (
          <div key={r._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="px-2 py-1 bg-sky-50 text-sky-700 text-[10px] font-bold uppercase rounded tracking-wider">{r.category}</span>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(r); setForm({ title: r.title, category: r.category, type: r.type, content: r.content, url: r.url || '' }); setShowModal(true); }} className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-md"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(r._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h4 className="font-bold text-gray-900 leading-tight mb-2">{r.title}</h4>
              <p className="text-sm text-gray-500 line-clamp-3 mb-4">{r.content}</p>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-50 uppercase tracking-widest font-semibold"><div className="flex items-center"><FileText className="w-3 h-3 mr-1" /> {r.type}</div><span>{new Date(r.createdAt).toLocaleDateString()}</span></div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">{editing ? 'Edit Resource' : 'New Resource'}</h3>
              <button onClick={() => { setShowModal(false); setEditing(null); }} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Title</label><input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Category</label><input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-1 focus:ring-sky-500 outline-none" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Type</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-1 focus:ring-sky-500 outline-none"><option value="reading">Reading</option><option value="video">Video</option><option value="exercise">Exercise</option></select></div>
              </div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Content / Description</label><textarea required rows={4} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-1 focus:ring-sky-500 outline-none resize-none" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">URL (Optional)</label><input type="url" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-1 focus:ring-sky-500 outline-none" /></div>
              <div className="pt-4"><button type="submit" className="w-full py-3 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition-all shadow-lg shadow-sky-100">{editing ? 'Save Changes' : 'Create Resource'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
