import { useEffect, useState } from 'react';
import { resourceService } from '../services/resource.service';
import {
  Plus, Edit, Trash2, FileText, Search,
  BookOpen, Dumbbell, Headphones, Youtube,
  Star, Link, ImageIcon, Tag, X, ExternalLink
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Dialog, DialogContent } from '../components/ui/Dialog';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Resource {
  _id: string;
  title: string;
  description: string;
  category: 'reading' | 'exercise' | 'meditation';
  type: 'article' | 'video' | 'audio' | 'exercise';
  moodTags: string[];
  content: string | null;
  contentUrl?: string | null;
  thumbnail?: string | null;
  tags: string[];
  isFeatured: boolean;
  active: boolean;
  createdAt: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORIES = ['reading', 'exercise', 'meditation'] as const;
const TYPES = ['article', 'video', 'audio', 'exercise'] as const;

const CAT_CFG = {
  reading: { bg: 'bg-sky-500/10 text-sky-600', ring: 'ring-sky-500', pill: 'bg-sky-50 text-sky-700', dot: 'bg-sky-500', icon: BookOpen },
  exercise: { bg: 'bg-emerald-500/10 text-emerald-600', ring: 'ring-emerald-500', pill: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', icon: Dumbbell },
  meditation: { bg: 'bg-violet-500/10 text-violet-600', ring: 'ring-violet-500', pill: 'bg-violet-50 text-violet-700', dot: 'bg-violet-500', icon: Headphones },
} as const;

const TYPE_CFG = {
  article: { label: 'Article', Icon: FileText },
  video: { label: 'Video', Icon: Youtube },
  audio: { label: 'Audio', Icon: Headphones },
  exercise: { label: 'Exercise', Icon: Dumbbell },
} as const;

const initialForm = {
  title: '',
  description: '',
  category: 'reading' as Resource['category'],
  type: 'article' as Resource['type'],
  moodTags: '',
  content: '',
  contentUrl: '',
  thumbnail: '',
  tags: '',
  isFeatured: false,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [form, setForm] = useState(initialForm);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // ── data ──────────────────────────────────────────────────────────────────

  const fetchResources = async () => {
    setLoading(true);
    try {
      const data = await resourceService.getAll();
      setResources(Array.isArray(data) ? data : data.items || []);
    } catch { toast.error('Failed to load resources'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchResources(); }, []);

  // ── modal ─────────────────────────────────────────────────────────────────

  const openCreate = () => { setEditing(null); setForm(initialForm); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); setForm(initialForm); };

  const openEdit = (r: Resource) => {
    setEditing(r);
    setForm({
      title: r.title,
      description: r.description || '',
      category: r.category,
      type: r.type,
      moodTags: r.moodTags?.join(', ') || '',
      content: r.content || '',
      contentUrl: r.contentUrl || '',
      thumbnail: r.thumbnail || '',
      tags: r.tags?.join(', ') || '',
      isFeatured: r.isFeatured || false,
    });
    setShowModal(true);
  };

  // ── submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const payload = {
      ...form,
      moodTags: form.moodTags.split(',').map(t => t.trim()).filter(Boolean),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    try {
      if (editing) { await resourceService.update(editing._id, payload); toast.success('Resource updated'); }
      else { await resourceService.create(payload); toast.success('Resource published'); }
      closeModal(); fetchResources();
    } catch { toast.error('Operation failed'); }
    finally { setSubmitting(false); }
  };

  // ── delete ────────────────────────────────────────────────────────────────

  const handleDelete = (id: string) => {
    toast(t => (
      <div className="flex flex-col gap-3">
        <p className="font-bold text-slate-900">Delete this resource?</p>
        <p className="text-xs text-slate-500">This action cannot be undone.</p>
        <div className="flex gap-2">
          <Button variant="destructive" size="sm" onClick={async () => {
            toast.dismiss(t.id);
            const lid = toast.loading('Deleting…');
            try { await resourceService.delete(id); toast.success('Deleted', { id: lid }); fetchResources(); }
            catch { toast.error('Failed', { id: lid }); }
          }}>Delete</Button>
          <Button variant="outline" size="sm" onClick={() => toast.dismiss(t.id)}>Cancel</Button>
        </div>
      </div>
    ));
  };

  // ── filtered ──────────────────────────────────────────────────────────────

  const filtered = resources.filter(r => {
    const q = searchQuery.toLowerCase();
    const matchSearch = r.title.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.tags?.some(t => t.toLowerCase().includes(q));
    return matchSearch && (activeFilter === 'all' || r.category === activeFilter);
  });

  const counts = CATEGORIES.reduce((a, c) => ({ ...a, [c]: resources.filter(r => r.category === c).length }), {} as Record<string, number>);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Page header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Resources</h2>
          <p className="text-slate-500 mt-1">Curate articles, exercises &amp; meditations for your users.</p>
        </div>
        <Button onClick={openCreate} className="bg-teal-600 hover:bg-teal-700 shadow-teal-100 shadow-xl">
          <Plus className="w-4 h-4 mr-2" /> Add Resource
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: resources.length, cls: 'bg-slate-900 text-white' },
          { label: 'Reading', value: counts.reading || 0, cls: 'bg-sky-50 text-sky-700' },
          { label: 'Exercise', value: counts.exercise || 0, cls: 'bg-emerald-50 text-emerald-700' },
          { label: 'Meditation', value: counts.meditation || 0, cls: 'bg-violet-50 text-violet-700' },
        ].map(s => (
          <div key={s.label} className={cn('rounded-2xl p-4 flex items-center justify-between', s.cls)}>
            <span className="text-sm font-bold opacity-70">{s.label}</span>
            <span className="text-2xl font-black">{s.value}</span>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by title, tag…"
            className="pl-11 border-none bg-slate-50/50 hover:bg-slate-50 focus-visible:ring-teal-400/20"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', ...CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setActiveFilter(cat)}
              className={cn('px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all',
                activeFilter === cat ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              )}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-24 flex flex-col items-center justify-center bg-white/50 rounded-3xl border border-slate-100">
            <Spinner size="lg" className="mb-4 text-teal-500" />
            <p className="animate-pulse font-medium text-slate-400">Loading resources…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-24 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No resources found</h3>
            <p className="text-slate-500 mt-2">Try adjusting your search or add a new resource.</p>
          </div>
        ) : (
          filtered.map(r => {
            const cat = CAT_CFG[r.category] ?? CAT_CFG.reading;
            const type = TYPE_CFG[r.type] ?? TYPE_CFG.article;
            const CatIcon = cat.icon;
            const TypeIcon = type.Icon;
            return (
              <Card key={r._id} className="group flex flex-col hover:border-teal-200 hover:shadow-2xl hover:shadow-teal-600/5 transition-all duration-500 overflow-hidden">
                {r.thumbnail ? (
                  <div className="h-36 overflow-hidden bg-slate-100 shrink-0">
                    <img src={r.thumbnail} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : (
                  <div className={cn('h-20 flex items-center justify-center shrink-0', cat.bg)}>
                    <CatIcon className="w-8 h-8 opacity-30" />
                  </div>
                )}
                <CardHeader className="p-5 pb-2 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge className={cn('border-none text-[10px] font-bold uppercase tracking-wider flex items-center gap-1', cat.pill)}>
                        <CatIcon className="w-3 h-3" /> {r.category}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-slate-200 flex items-center gap-1">
                        <TypeIcon className="w-3 h-3" /> {type.label}
                      </Badge>
                      {r.isFeatured && (
                        <Badge className="bg-amber-50 text-amber-600 border-none text-[10px] font-bold flex items-center gap-1">
                          <Star className="w-2.5 h-2.5" /> Featured
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl" onClick={() => openEdit(r)}><Edit className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl" onClick={() => handleDelete(r._id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900 group-hover:text-teal-800 transition-colors leading-snug">{r.title}</CardTitle>
                  <CardDescription className="mt-1.5 line-clamp-2 text-sm">{r.description || r.content}</CardDescription>
                </CardHeader>
                <CardContent className="px-5 pb-3 pt-0">
                  {r.moodTags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {r.moodTags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-[10px] font-bold text-slate-400 border-slate-100 uppercase tracking-widest">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="px-5 py-3 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    {r.contentUrl ? (
                      <a href={r.contentUrl} target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-600 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> View Link
                      </a>
                    ) : <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Text</span>}
                  </div>
                  <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>

      {/* ════════════════════════════════════════════════
          MODAL — two-column split layout
          Left  : dark sidebar  — identity & classification
          Right : white panel   — content fields (scrolls)
      ════════════════════════════════════════════════ */}
      <Dialog open={showModal} onOpenChange={closeModal}>
        {/*
          max-w-5xl = wide enough to breathe
          fixed height 90vh, no overflow on wrapper — panels handle their own scroll
        */}
        <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden border-none shadow-2xl rounded-2xl flex flex-col">
          <form onSubmit={handleSubmit} className="flex flex-1 min-h-0">

            {/* ── LEFT SIDEBAR — dark, fixed, no scroll ── */}
            <aside className="w-80 shrink-0 bg-slate-900 text-white flex flex-col">

              {/* sidebar header */}
              <div className="px-8 pt-8 pb-6 border-b border-white/10">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-400 mb-2">
                  {editing ? 'Editing' : 'New Resource'}
                </p>
                <h2 className="text-2xl font-black leading-tight">
                  {form.title || <span className="opacity-30 italic font-normal text-lg">Untitled resource</span>}
                </h2>
                {form.description && (
                  <p className="text-sm text-slate-400 mt-2 line-clamp-3">{form.description}</p>
                )}
              </div>

              {/* sidebar fields */}
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">

                {/* Title */}
                <Field label="Title">
                  <input
                    required
                    placeholder="Resource name…"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                  />
                </Field>

                {/* Description */}
                <Field label="Description">
                  <textarea
                    rows={3}
                    placeholder="Short summary…"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none transition-all"
                  />
                </Field>

                {/* Category */}
                <Field label="Category">
                  <div className="flex flex-col gap-2">
                    {CATEGORIES.map(cat => {
                      const cfg = CAT_CFG[cat];
                      const Icon = cfg.icon;
                      return (
                        <button key={cat} type="button" onClick={() => setForm({ ...form, category: cat })}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold capitalize border-2 transition-all text-left',
                            form.category === cat
                              ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                              : 'border-white/5 bg-white/5 text-slate-400 hover:border-white/20'
                          )}>
                          <Icon className="w-4 h-4 shrink-0" />
                          {cat}
                          {form.category === cat && <span className="ml-auto w-2 h-2 rounded-full bg-teal-400" />}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                {/* Type */}
                <Field label="Content Type">
                  <div className="grid grid-cols-2 gap-2">
                    {TYPES.map(type => {
                      const cfg = TYPE_CFG[type];
                      const Icon = cfg.Icon;
                      return (
                        <button key={type} type="button" onClick={() => setForm({ ...form, type })}
                          className={cn(
                            'flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-bold border-2 transition-all',
                            form.type === type
                              ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                              : 'border-white/5 bg-white/5 text-slate-400 hover:border-white/20'
                          )}>
                          <Icon className="w-4 h-4" />
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                {/* Featured toggle */}
                <Field label="Visibility">
                  <label className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all',
                    form.isFeatured ? 'border-amber-500/50 bg-amber-500/10' : 'border-white/5 bg-white/5 hover:border-white/20'
                  )}>
                    <input type="checkbox" checked={form.isFeatured}
                      onChange={e => setForm({ ...form, isFeatured: e.target.checked })}
                      className="w-4 h-4 rounded accent-amber-400 shrink-0"
                    />
                    <div>
                      <p className={cn('text-sm font-bold flex items-center gap-1.5', form.isFeatured ? 'text-amber-300' : 'text-slate-400')}>
                        <Star className="w-3.5 h-3.5" /> Featured
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Pinned at top of library</p>
                    </div>
                  </label>
                </Field>
              </div>

              {/* sidebar footer buttons */}
              <div className="px-8 py-6 border-t border-white/10 flex flex-col gap-3 shrink-0">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-900 font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <><Spinner size="sm" /> Saving…</> : editing ? 'Save Changes' : 'Publish Resource'}
                </button>
                <button type="button" onClick={closeModal} disabled={submitting}
                  className="w-full py-2.5 rounded-xl text-slate-500 hover:text-white text-sm font-bold transition-colors">
                  Discard
                </button>
              </div>
            </aside>

            {/* ── RIGHT PANEL — white, scrollable content area ── */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">

              {/* right panel header */}
              <div className="px-10 pt-8 pb-6 border-b border-slate-100 shrink-0 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Content Fields</p>
                  <h3 className="text-xl font-bold text-slate-900">What does this resource contain?</h3>
                  <p className="text-sm text-slate-400 mt-1">Fill in the fields relevant to your resource type. You don't need all of them.</p>
                </div>
                {/* <button type="button" onClick={closeModal}
                  className="shrink-0 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button> */}
              </div>

              {/* right panel scrollable body */}
              <div className="flex-1 overflow-y-auto px-10 py-8 space-y-10 custom-scrollbar">

                {/* ── Mood & Tags ── */}
                <section className="space-y-6">
                  <SectionHeading step="01" title="Tags &amp; Mood Mapping" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <WhiteField label="Mood Tags" hint="Comma-separated.">
                      <input
                        placeholder="anxious, stressed, overwhelmed…"
                        value={form.moodTags}
                        onChange={e => setForm({ ...form, moodTags: e.target.value })}
                        className={inputCls}
                      />
                    </WhiteField>
                    <WhiteField label="General Tags" hint="Used for search and library filtering.">
                      <input
                        placeholder="breathing, calm, anxiety…"
                        value={form.tags}
                        onChange={e => setForm({ ...form, tags: e.target.value })}
                        className={inputCls}
                      />
                    </WhiteField>
                  </div>
                </section>

                {/* ── URL & Thumbnail ── */}
                <section className="space-y-6">
                  <SectionHeading step="02" title="Link &amp; Media" />
                  <WhiteField label="Content URL" hint="YouTube, audio file, or any external link.">
                    <div className="relative">
                      <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=…"
                        value={form.contentUrl}
                        onChange={e => setForm({ ...form, contentUrl: e.target.value })}
                        className={cn(inputCls, 'pl-10')}
                      />
                    </div>
                  </WhiteField>

                  <WhiteField label="Thumbnail URL" hint="Auto-populate from YouTube: https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg">
                    <div className="flex gap-4 items-start">
                      <div className="flex-1">
                        <div className="relative">
                          <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input
                            type="url"
                            placeholder="https://img.youtube.com/vi/…/hqdefault.jpg"
                            value={form.thumbnail}
                            onChange={e => setForm({ ...form, thumbnail: e.target.value })}
                            className={cn(inputCls, 'pl-10')}
                          />
                        </div>
                      </div>
                      {form.thumbnail && (
                        <img src={form.thumbnail} alt="thumb" className="w-24 h-16 rounded-xl object-cover border border-slate-100 shrink-0" />
                      )}
                    </div>
                  </WhiteField>
                </section>

                {/* ── Text Content ── */}
                <section className="space-y-6">
                  <SectionHeading step="03" title="Written Content" />
                  <WhiteField
                    label="Article / Exercise Text"
                    hint="Use this for articles or exercises that don't have an external URL. Leave blank if you provided a URL above."
                  >
                    <textarea
                      rows={10}
                      placeholder={`Write the full content here…\n\nFor exercises: step-by-step instructions.\nFor articles: the full readable text.\nFor meditations without audio: the guided script.`}
                      value={form.content}
                      onChange={e => setForm({ ...form, content: e.target.value })}
                      className="w-full border border-slate-200 bg-slate-50/50 rounded-2xl px-5 py-4 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 resize-none transition-all leading-relaxed"
                    />
                  </WhiteField>
                </section>

              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

const inputCls =
  'w-full border border-slate-200 bg-slate-50/50 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 transition-all';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">{label}</p>
      {children}
    </div>
  );
}

function WhiteField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-sm font-bold text-slate-700">{label}</label>
        {hint && <span className="text-[10px] text-slate-400 text-right leading-tight max-w-[200px]">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function SectionHeading({ step, title }: { step: string; title: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-[10px] font-black text-teal-500 bg-teal-50 rounded-lg px-2 py-1 tracking-widest">{step}</span>
      <h4 className="text-sm font-black uppercase tracking-[0.15em] text-slate-400"
        dangerouslySetInnerHTML={{ __html: title }} />
      <span className="flex-1 h-px bg-slate-100" />
    </div>
  );
}