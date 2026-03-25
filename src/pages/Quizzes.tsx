import { useEffect, useState } from 'react';
import { quizService } from '../services/quiz.service';
import { Plus, Edit, Trash2, X, ClipboardList, PlusCircle, MinusCircle } from 'lucide-react';

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

export default function Quizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Quiz | null>(null);

  const initialForm = {
    title: '',
    description: '',
    category: 'quiz-session',
    moodTags: '',
    questions: [
      { questionText: '', options: ['', '', '', ''], correctOptionIndex: 0, points: 1 }
    ]
  };

  const [form, setForm] = useState(initialForm);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const data = await quizService.getAll();
      setQuizzes(Array.isArray(data) ? data : data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      moodTags: form.moodTags.split(',').map(t => t.trim()).filter(t => t),
    };
    try {
      if (editing) await quizService.update(editing._id, payload);
      else await quizService.create(payload);
      setShowModal(false);
      setEditing(null);
      setForm(initialForm);
      fetchQuizzes();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this quiz?')) return;
    try {
      await quizService.delete(id);
      fetchQuizzes();
    } catch (e) {
      console.error(e);
    }
  };

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

  const addQuestion = () => {
    setForm({
      ...form,
      questions: [...form.questions, { questionText: '', options: ['', '', '', ''], correctOptionIndex: 0, points: 1 }]
    });
  };

  const removeQuestion = (index: number) => {
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quizzes</h2>
          <p className="text-sm text-gray-500">Manage mental health assessments and trivia.</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" /> Add Quiz
        </button>
      </div>

      {/* Quiz Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-gray-400">Loading…</div>
        ) : quizzes.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-400">No quizzes yet.</div>
        ) : (
          quizzes.map(q => (
            <div
              key={q._id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-1 bg-sky-50 text-sky-700 text-[10px] font-bold uppercase rounded tracking-wider">
                      {q.category}
                    </span>
                    {q.moodTags?.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold uppercase rounded tracking-wider">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <button
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
                      className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-md"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(q._id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h4 className="font-bold text-gray-900 leading-tight mb-2">{q.title}</h4>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{q.description}</p>
                <div className="text-xs text-gray-400 mb-4">{q.questions.length} Questions</div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-50 uppercase tracking-widest font-semibold">
                <div className="flex items-center">
                  <ClipboardList className="w-3 h-3 mr-1" /> Quiz
                </div>
                <span>{new Date(q.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        /*
         * Backdrop: full-screen flex centering.
         * We do NOT make the backdrop itself scrollable — the panel handles its own scroll.
         */
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          {/*
           * Panel: fixed max height (90vh) with flex-col so:
           *   - header is always visible at top
           *   - footer button is always visible at bottom
           *   - only the middle content area scrolls
           */}
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

            {/* ── Sticky Header ── */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 shrink-0">
              <h3 className="text-xl font-bold text-gray-900">
                {editing ? 'Edit Quiz' : 'New Quiz'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* ── Scrollable Body ── */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

                {/* Basic fields */}
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
                    <input
                      type="text"
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-1 focus:ring-sky-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Mood Tags <span className="text-gray-400 font-normal">(comma separated)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. anxious, stressed"
                      value={form.moodTags}
                      onChange={e => setForm({ ...form, moodTags: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-1 focus:ring-sky-500 outline-none"
                    />
                  </div>
                </div>

                {/* Questions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 underline decoration-sky-500 underline-offset-4">
                      Questions
                    </h4>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="flex items-center text-sm font-bold text-sky-600 hover:text-sky-700"
                    >
                      <PlusCircle className="w-4 h-4 mr-1" /> Add Question
                    </button>
                  </div>

                  <div className="space-y-4">
                    {form.questions.map((q, qIndex) => (
                      <div
                        key={qIndex}
                        className="p-4 bg-gray-50 rounded-xl space-y-3 relative border border-gray-100"
                      >
                        {form.questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeQuestion(qIndex)}
                            className="absolute top-3 right-3 text-red-400 hover:text-red-600"
                          >
                            <MinusCircle className="w-5 h-5" />
                          </button>
                        )}
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                            Question {qIndex + 1}
                          </label>
                          <input
                            type="text"
                            required
                            value={q.questionText}
                            onChange={e => updateQuestion(qIndex, 'questionText', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-sky-500 outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {q.options.map((opt, oIndex) => (
                            <div key={oIndex} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${qIndex}`}
                                checked={q.correctOptionIndex === oIndex}
                                onChange={() => updateQuestion(qIndex, 'correctOptionIndex', oIndex)}
                                className="text-sky-600 focus:ring-sky-500 shrink-0"
                              />
                              <input
                                type="text"
                                required
                                placeholder={`Option ${oIndex + 1}`}
                                value={opt}
                                onChange={e => updateOption(qIndex, oIndex, e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-sky-500 outline-none"
                              />
                            </div>
                          ))}
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Points</label>
                          <input
                            type="number"
                            min="1"
                            value={q.points}
                            onChange={e => updateQuestion(qIndex, 'points', parseInt(e.target.value))}
                            className="w-20 border border-gray-200 rounded-lg px-3 py-1 text-sm focus:ring-1 focus:ring-sky-500 outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Sticky Footer ── */}
              <div className="px-6 py-4 border-t border-gray-100 shrink-0">
                <button
                  type="submit"
                  className="w-full py-3 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition-all shadow-lg shadow-sky-100"
                >
                  {editing ? 'Save Changes' : 'Create Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}