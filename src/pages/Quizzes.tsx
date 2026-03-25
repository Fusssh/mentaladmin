import { useEffect, useState } from 'react';
import { quizService } from '../services/quiz.service';
import { Plus, Edit, Trash2, ClipboardList, PlusCircle, MinusCircle, Search, HelpCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '../components/ui/Dialog';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/Accordion';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

interface Question {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  points: number;
  _id?: string;
}

interface Quiz {
  _id: string;
  title: string;
  description: string;
  category: string;
  moodTags: string[];
  questions: Question[];
  active: boolean;
  createdAt: string;
}

const initialForm = {
  title: '',
  description: '',
  category: 'quiz-session',
  moodTags: '',
  questions: [
    { questionText: '', options: ['', '', '', ''], correctOptionIndex: 0, points: 1 }
  ]
};

export default function Quizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Quiz | null>(null);
  const [form, setForm] = useState(initialForm);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const data = await quizService.getAll();
      setQuizzes(Array.isArray(data) ? data : data.items || []);
    } catch (e) {
      toast.error('Failed to load quizzes');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
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
    setSubmitting(true);
    const payload = {
      ...form,
      moodTags: form.moodTags.split(',').map(t => t.trim()).filter(t => t),
    };
    try {
      if (editing) {
        await quizService.update(editing._id, payload);
        toast.success('Quiz updated successfully');
      } else {
        await quizService.create(payload);
        toast.success('Quiz published successfully');
      }
      closeModal();
      fetchQuizzes();
    } catch (e) {
      toast.error('Operation failed');
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-bold text-slate-900">Confirm Deletion</p>
        <p className="text-xs text-slate-500">This action cannot be undone.</p>
        <div className="flex gap-2">
          <Button variant="destructive" size="sm" onClick={async () => {
            toast.dismiss(t.id);
            const loadingId = toast.loading('Deleting...');
            try {
              await quizService.delete(id);
              toast.success('Deleted', { id: loadingId });
              fetchQuizzes();
            } catch {
              toast.error('Failed', { id: loadingId });
            }
          }}>Delete</Button>
          <Button variant="outline" size="sm" onClick={() => toast.dismiss(t.id)}>Cancel</Button>
        </div>
      </div>
    ));
  };

  const addQuestion = () => {
    setForm({
      ...form,
      questions: [...form.questions, { questionText: '', options: ['', '', '', ''], correctOptionIndex: 0, points: 1 }]
    });
  };

  const removeQuestion = (index: number) => {
    if (form.questions.length <= 1) return;
    const newQuestions = [...form.questions];
    newQuestions.splice(index, 1);
    setForm({ ...form, questions: newQuestions });
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...form.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setForm({ ...form, questions: newQuestions });
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...form.questions];
    const newOptions = [...newQuestions[qIndex].options];
    newOptions[oIndex] = value;
    newQuestions[qIndex].options = newOptions;
    setForm({ ...form, questions: newQuestions });
  };

  const filteredQuizzes = quizzes.filter(q => 
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Assessments</h2>
          <p className="text-slate-500 mt-1">Manage quizzes and psychological evaluations.</p>
        </div>
        <Button onClick={openModal} className="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 shadow-xl">
          <Plus className="w-5 h-5 mr-2" /> Create Quiz
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-soft">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Filter quizzes..." 
            className="pl-11 border-none bg-slate-50/50 hover:bg-slate-50 focus-visible:ring-indigo-400/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-24 flex flex-col items-center justify-center text-slate-400 bg-white/50 rounded-3xl border border-slate-100">
            <Spinner size="lg" className="mb-4 text-indigo-500" />
            <p className="animate-pulse font-medium text-slate-400">Loading assessments...</p>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="col-span-full py-24 text-center bg-white rounded-3xl border border-dashed border-slate-200">
             <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ClipboardList className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No quizzes mapped</h3>
            <p className="text-slate-500 mt-2">Start by creating your first psychological assessment.</p>
          </div>
        ) : (
          filteredQuizzes.map(q => (
            <Card key={q._id} className="group hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-600/5 transition-all duration-500">
              <CardHeader className="p-6 pb-2">
                <div className="flex justify-between items-start mb-4">
                  <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none px-3 py-1">
                    {q.category}
                  </Badge>
                  <div className="flex gap-1 opacity-10 md:opacity-0 group-hover:opacity-100 transition-all">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
                      onClick={() => {
                        setEditing(q);
                        setForm({
                          title: q.title,
                          description: q.description || '',
                          category: q.category,
                          moodTags: q.moodTags?.join(', ') || '',
                          questions: q.questions.map(quest => ({
                            questionText: quest.questionText,
                            options: [...quest.options],
                            correctOptionIndex: quest.correctOptionIndex,
                            points: quest.points
                          }))
                        });
                        setShowModal(true);
                      }}
                    >
                      <Edit className="w-4.5 h-4.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                      onClick={() => handleDelete(q._id)}
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-indigo-800 transition-colors">{q.title}</CardTitle>
                <CardDescription className="mt-2 line-clamp-2 h-10">{q.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  {q.moodTags?.map(tag => (
                    <Badge key={tag} variant="outline" className="text-[10px] font-bold text-slate-400 border-slate-200 uppercase tracking-widest">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {q.questions.length} Questions
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                <div className="flex items-center">
                  <HelpCircle className="w-3.5 h-3.5 mr-1.5 text-indigo-300" /> Assessment Quiz
                </div>
                <span>{new Date(q.createdAt).toLocaleDateString()}</span>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showModal} onOpenChange={closeModal}>
        <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden border-none shadow-3xl">
          <div className="bg-indigo-600 px-8 py-10 text-white shrink-0 relative overflow-hidden">
            <div className="relative z-10">
              <DialogTitle className="text-3xl font-black">{editing ? 'Edit Assessment' : 'New Assessment'}</DialogTitle>
              <DialogDescription className="text-indigo-100 mt-2 text-base">
                Configure your mental health quiz. Ensure questions are clear and empathetic.
              </DialogDescription>
            </div>
            <ClipboardList className="absolute -right-6 -bottom-6 w-48 h-48 text-white/10 rotate-12" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 bg-white">
            <div className="overflow-y-auto flex-1 px-8 py-8 space-y-10 custom-scrollbar">
              <section className="space-y-6">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <span className="w-8 h-px bg-slate-200"></span> Primary Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-slate-700">Quiz Title</label>
                    <Input
                      required
                      placeholder="e.g. Cognitive Resilience Workshop"
                      value={form.title}
                      className="bg-slate-50 border-slate-100 font-medium"
                      onChange={e => setForm({ ...form, title: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-slate-700">Introduction</label>
                    <textarea
                      rows={2}
                      placeholder="Explain the purpose of this evaluation..."
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      className="w-full border border-slate-100 bg-slate-50 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Category Tag</label>
                    <Input
                      placeholder="quiz-session"
                      value={form.category}
                      className="bg-slate-50 border-slate-100"
                      onChange={e => setForm({ ...form, category: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Mood Correlation</label>
                    <Input
                      placeholder="anxious, depressed..."
                      value={form.moodTags}
                      className="bg-slate-50 border-slate-100"
                      onChange={e => setForm({ ...form, moodTags: e.target.value })}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                 <div className="flex items-center justify-between">
                   <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <span className="w-8 h-px bg-slate-200"></span> Question Set
                  </h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addQuestion}
                    className="h-8 text-xs font-bold rounded-lg border-indigo-200 text-indigo-600"
                  >
                    <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Add New Box
                  </Button>
                </div>

                <Accordion type="single" collapsible className="space-y-3">
                  {form.questions.map((q, qIndex) => (
                    <AccordionItem key={qIndex} value={`q-${qIndex}`} className="border border-slate-100 rounded-2xl bg-slate-50 overflow-hidden px-4">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-black flex items-center justify-center">
                            {qIndex + 1}
                          </span>
                          <span className="text-sm font-bold text-slate-700 text-left line-clamp-1">
                            {q.questionText || 'Empty Question'}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-6 pt-2 space-y-6">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-black text-slate-400 uppercase">Input Question</label>
                            {form.questions.length > 1 && (
                               <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeQuestion(qIndex)}
                                className="h-6 w-6 text-red-300 hover:text-red-500 hover:bg-red-50"
                              >
                                <MinusCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <Input
                            placeholder="Enter the question here..."
                            value={q.questionText}
                            onChange={e => updateQuestion(qIndex, 'questionText', e.target.value)}
                            className="bg-white"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {q.options.map((opt, oIndex) => (
                            <div key={oIndex} className={cn(
                              "relative flex items-center p-3 rounded-xl border transition-all",
                              q.correctOptionIndex === oIndex ? "bg-emerald-50 border-emerald-100 shadow-sm" : "bg-white border-slate-100"
                            )}>
                              <input
                                type="radio"
                                name={`correct-${qIndex}`}
                                checked={q.correctOptionIndex === oIndex}
                                onChange={() => updateQuestion(qIndex, 'correctOptionIndex', oIndex)}
                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                              />
                              <input
                                type="text"
                                placeholder={`Option ${oIndex + 1}`}
                                value={opt}
                                onChange={e => updateOption(qIndex, oIndex, e.target.value)}
                                className="flex-1 ml-3 bg-transparent border-none text-sm font-medium focus:ring-0 p-0"
                              />
                              {q.correctOptionIndex === oIndex && (
                                <Badge className="absolute -top-2 -right-2 bg-emerald-500 text-[8px] h-4 px-1.5 border-none">CORRECT</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-3">
                           <label className="text-xs font-black text-slate-400 uppercase">Weightage (Points)</label>
                           <Input
                            type="number"
                            min="1"
                            value={q.points}
                            onChange={e => updateQuestion(qIndex, 'points', parseInt(e.target.value) || 1)}
                            className="w-24 h-9 bg-white"
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            </div>

            <DialogFooter className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
               <Button type="button" variant="ghost" onClick={closeModal} disabled={submitting}>
                Discard
              </Button>
              <Button type="submit" disabled={submitting} className="min-w-[140px] bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
                {submitting ? (
                  <>
                    <Spinner size="sm" className="mr-2 text-white" />
                    Finalizing...
                  </>
                ) : (
                  editing ? 'Save Changes' : 'Publish Quiz'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}