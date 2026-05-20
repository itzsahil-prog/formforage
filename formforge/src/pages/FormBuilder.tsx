import React, { useEffect, useState, type ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Form, Question, QuestionType } from '../types';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Plus, Settings, Share, Trash2, Eye, LayoutTemplate, MessageSquare, ChevronLeft, Save, Copy, Sparkles, GitBranch } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function FormBuilder() {
  const { id } = useParams();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'build' | 'settings'>('build');
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<Partial<Question>[]>([]);
  const [logicOpenFor, setLogicOpenFor] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState<{ url: string; message: string } | null>(null);

  useEffect(() => {
    fetch(`/api/forms/${id}`)
      .then(res => res.json())
      .then(data => { setForm(data); setLoading(false); });
  }, [id]);

  const getPublicFormUrl = (formId: string) => new URL(`/f/${formId}`, window.location.origin).toString();

  const copyToClipboard = async (text: string) => {
    // Clipboard API is best-effort; fall back for non-secure contexts / older browsers.
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // fall through to legacy approach
    }

    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', 'true');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      ta.style.top = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  };

  const handleShare = async () => {
    if (!form) return;
    const url = getPublicFormUrl(form.id);
    setShareToast(null);

    // Prefer native share sheet when available (mobile + some desktop browsers).
    try {
      if (navigator.share) {
        await navigator.share({
          title: form.title || 'Form',
          text: 'Fill out this form',
          url
        });
        setShareToast({ url, message: 'Shared. Link is ready.' });
        return;
      }
    } catch {
      // If share is cancelled or fails, fall back to copy.
    }

    const copied = await copyToClipboard(url);
    setShareToast({ url, message: copied ? 'Link copied.' : 'Copy failed. Use the link below.' });
  };

  const saveForm = async (updates: Partial<Form>) => {
    if (!form) return;
    setSaving(true);
    const newForm = { ...form, ...updates };
    setForm(newForm);
    await fetch(`/api/forms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    setSaving(false);
  };

  const handleSuggestQuestions = async () => {
    if (!form || !form.title) return;
    setSuggesting(true);
    setSuggestedQuestions([]);
    try {
      const res = await fetch('/api/ai/suggest-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          existingQuestions: form.questions
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuggestedQuestions(data);
      } else {
        alert(data.error || 'Failed to suggest questions');
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching suggestions');
    } finally {
      setSuggesting(false);
    }
  };

  const addSuggestedQuestion = (sq: Partial<Question>) => {
    if (!form) return;
    const newQ: Question = {
      id: uuidv4(),
      type: (sq.type as QuestionType) || 'short_text',
      title: sq.title || 'New Question',
      required: false,
      options: sq.options || ['Option 1']
    };
    saveForm({ questions: [...form.questions, newQ] });
    setSuggestedQuestions(prev => prev.filter(q => q !== sq));
  };

  const addQuestion = (type: QuestionType) => {
    if (!form) return;
    const newQ: Question = {
      id: uuidv4(),
      type,
      title: 'New Question',
      required: false,
      options: ['Option 1']
    };
    saveForm({ questions: [...form.questions, newQ] });
  };

  const updateQuestion = (qId: string, updates: Partial<Question>) => {
    if (!form) return;
    const newQs = form.questions.map(q => q.id === qId ? { ...q, ...updates } : q);
    saveForm({ questions: newQs });
  };

  const removeQuestion = (qId: string) => {
    if (!form) return;
    saveForm({ questions: form.questions.filter(q => q.id !== qId) });
  };

  const duplicateQuestion = (q: Question) => {
    if (!form) return;
    const idx = form.questions.findIndex(x => x.id === q.id);
    const newQs = [...form.questions];
    newQs.splice(idx + 1, 0, { ...q, id: uuidv4() });
    saveForm({ questions: newQs });
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !form) return;
    const items = [...form.questions];
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    saveForm({ questions: items });
  };

  if (loading) return <div className="p-8 text-center">Loading builder...</div>;
  if (!form) return <div className="p-8 text-center text-red-500">Form not found</div>;

  return (
    <div className="flex flex-col h-screen bg-zinc-50">
      {/* Top Navbar */}
      <header className="h-14 border-b border-zinc-200 bg-white flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-600">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <input 
            type="text" 
            value={form.title} 
            onChange={(e) => saveForm({ title: e.target.value })}
            className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-0 text-zinc-900 w-64"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400 font-medium">{saving ? 'Saving...' : 'Saved'}</span>
          <Link 
            to={`/f/${form.id}`} 
            target="_blank"
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md transition"
          >
            <Eye className="w-4 h-4" /> Preview
          </Link>
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition shadow-sm"
          >
            <Share className="w-4 h-4" /> Share
          </button>
        </div>
      </header>
      {shareToast && (
        <div className="fixed right-4 top-16 z-50 w-[min(440px,calc(100vw-2rem))] rounded-xl border border-zinc-200 bg-white shadow-lg">
          <div className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-zinc-900">{shareToast.message}</div>
                <a
                  href={shareToast.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block text-xs text-indigo-600 hover:underline break-all"
                >
                  {shareToast.url}
                </a>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => copyToClipboard(shareToast.url)}
                  className="px-2 py-1 text-xs font-medium rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                  title="Copy link"
                >
                  Copy
                </button>
                <button
                  onClick={() => setShareToast(null)}
                  className="px-2 py-1 text-xs font-medium rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                  title="Dismiss"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Builder Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar - Elements */}
        <aside className="w-64 border-r border-zinc-200 bg-white flex-col hidden md:flex h-full">
          <div className="flex border-b border-zinc-200 shrink-0">
            <button 
              onClick={() => setActiveTab('build')} 
              className={cn("flex-1 py-3 text-sm font-medium border-b-2 transition-colors", activeTab==='build' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-zinc-500 hover:text-zinc-700')}
            >
              Elements
            </button>
            <button 
              onClick={() => setActiveTab('settings')} 
              className={cn("flex-1 py-3 text-sm font-medium border-b-2 transition-colors", activeTab==='settings' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-zinc-500 hover:text-zinc-700')}
            >
              Theme
            </button>
          </div>
          
          <div className="p-4 overflow-y-auto flex-1">
            {activeTab === 'build' ? (
              <div className="space-y-2">
                <ToolButton icon={<LayoutTemplate className="w-4 h-4"/>} label="Short Text" onClick={() => addQuestion('short_text')} />
                <ToolButton icon={<MessageSquare className="w-4 h-4"/>} label="Long Text" onClick={() => addQuestion('long_text')} />
                <ToolButton icon={<div className="font-serif w-4 text-center">@</div>} label="Email Address" onClick={() => addQuestion('email')} />
                <ToolButton icon={<div className="font-mono w-4 text-center text-sm">123</div>} label="Number" onClick={() => addQuestion('number')} />
                <div className="h-px bg-zinc-100 my-4" />
                <ToolButton icon={<div className="w-4 h-4 rounded-full border-2 border-current" />} label="Multiple Choice" onClick={() => addQuestion('multiple_choice')} />
                <ToolButton icon={<div className="w-4 h-4 rounded border-2 border-current" />} label="Checkboxes" onClick={() => addQuestion('checkbox')} />
                <ToolButton icon={<div className="w-4 h-1 border-b-2 border-current mt-2" />} label="Dropdown" onClick={() => addQuestion('dropdown')} />
                <div className="h-px bg-zinc-100 my-4" />
                <ToolButton icon={<div className="w-4 h-2 border-y-2 border-current mt-1" />} label="Section Break" onClick={() => addQuestion('section')} />
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-zinc-700 block mb-2">Theme Color</label>
                  <div className="flex flex-wrap gap-2">
                    {['#4f46e5', '#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#18181b'].map(color => (
                      <button
                        key={color}
                        onClick={() => saveForm({ theme: { ...(form.theme || { color: '#4f46e5' }), color } })}
                        className={cn("w-8 h-8 rounded-full border-2 transition-transform hover:scale-110", form.theme?.color === color ? "border-zinc-900 scale-110" : "border-transparent")}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-zinc-700 block mb-2">Background Color</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'Indigo Light', value: 'bg-indigo-50/50' },
                      { name: 'Zinc Light', value: 'bg-zinc-50' },
                      { name: 'Rose Light', value: 'bg-rose-50' },
                      { name: 'Emerald Light', value: 'bg-emerald-50' },
                      { name: 'Amber Light', value: 'bg-amber-50' },
                      { name: 'Slate Dark', value: 'bg-slate-900' },
                    ].map(bg => (
                      <button
                        key={bg.value}
                        onClick={() => saveForm({ theme: { ...(form.theme || { color: '#4f46e5' }), backgroundColor: bg.value } })}
                        className={cn("w-8 h-8 rounded-full border-2 transition-transform hover:scale-110", 
                          form.theme?.backgroundColor === bg.value ? "border-indigo-500 scale-110" : "border-zinc-200"
                        )}
                        title={bg.name}
                      >
                         <div className={cn("w-full h-full rounded-full", bg.value.replace('/50', ''))} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-700 block mb-2">Font Family</label>
                  <select 
                    value={form.theme?.fontFamily || 'font-sans'}
                    onChange={(e) => saveForm({ theme: { ...(form.theme || { color: '#4f46e5' }), fontFamily: e.target.value } })}
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="font-sans">Inter (Sans-serif)</option>
                    <option value="font-serif">Playfair Display (Serif)</option>
                    <option value="font-mono">JetBrains Mono (Monospace)</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-zinc-700 block mb-2">Banner Image URL</label>
                  <input 
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={form.theme?.bannerImage || ''}
                    onChange={(e) => saveForm({ theme: { ...(form.theme || { color: '#4f46e5' }), bannerImage: e.target.value } })}
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Leave empty to remove banner.</p>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Center Canvas */}
        <main className={cn("flex-1 overflow-y-auto p-4 md:p-8 relative", form.theme?.backgroundColor || 'bg-zinc-50/50', form.theme?.fontFamily || 'font-sans')}>
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* Banner Image */}
            {form.theme?.bannerImage && (
              <div className="w-full h-48 md:h-64 rounded-xl overflow-hidden shadow-sm bg-white">
                <img 
                  src={form.theme.bannerImage} 
                  alt="Form Banner" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            {/* Form Header Card */}
            <div 
              className="border-t-8 bg-white rounded-xl shadow-sm p-6 space-y-4"
              style={{ borderTopColor: form.theme?.color || '#4f46e5' }}
            >
              <input 
                 value={form.title}
                 onChange={e => saveForm({ title: e.target.value })}
                 className="text-4xl hover:underline underline-offset-4 decoration-zinc-200 decoration-2 focus:no-underline font-semibold w-full focus:outline-none"
                 placeholder="Form Title"
              />
              <textarea 
                 value={form.description || ''}
                 onChange={e => saveForm({ description: e.target.value })}
                 className="w-full resize-none focus:outline-none text-zinc-600"
                 placeholder="Form description"
                 rows={2}
              />
            </div>

            {/* Questions DND Area */}
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="questions">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {form.questions.map((q, index) => {
                      return (
                        // @ts-ignore
                        <Draggable key={q.id} draggableId={q.id} index={index}>
                          {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "bg-white rounded-xl shadow-sm border group transition-all",
                              q.type === 'section' ? "border-t-8" : "border-zinc-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500",
                              snapshot.isDragging && "shadow-xl border-indigo-500 ring-1 ring-indigo-500"
                            )}
                            style={q.type === 'section' ? { borderTopColor: form.theme?.color || '#4f46e5' } : undefined}
                          >
                            {/* Drag Handle Top Bar */}
                            <div 
                              {...provided.dragHandleProps}
                              className="w-full flex justify-center py-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
                            >
                              <GripVertical className="w-5 h-5 text-zinc-300" />
                            </div>

                            <div className="p-6 pt-0 space-y-4">
                              <div className="flex gap-4 items-start">
                                <input 
                                  value={q.title} 
                                  onChange={e => updateQuestion(q.id, { title: e.target.value })}
                                  className={cn("text-lg font-medium border-b border-zinc-200 focus:border-indigo-500 focus:outline-none py-1 flex-1 transition-colors", q.type === 'section' ? "text-2xl bg-transparent" : "bg-zinc-50 focus:bg-white")}
                                  placeholder={q.type === 'section' ? "Section title" : "Question text"}
                                />
                                <select 
                                  value={q.type}
                                  onChange={e => updateQuestion(q.id, { type: e.target.value as QuestionType })}
                                  className="border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                >
                                  <option value="short_text">Short answer</option>
                                  <option value="long_text">Paragraph</option>
                                  <option value="multiple_choice">Multiple choice</option>
                                  <option value="checkbox">Checkboxes</option>
                                  <option value="dropdown">Dropdown</option>
                                  <option value="section">Section</option>
                                </select>
                              </div>

                              {/* Question Preview based on Type */}
                              <div className="py-2">
                                {q.type === 'section' ? (
                                  <div className="space-y-4 pt-2">
                                    <div className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-2">Section Break</div>
                                    <textarea
                                      value={q.description || ''}
                                      onChange={e => updateQuestion(q.id, { description: e.target.value })}
                                      className="w-full border-b border-zinc-200 focus:border-indigo-500 focus:outline-none py-1 bg-transparent transition-colors resize-none text-zinc-600"
                                      placeholder="Section description (optional)"
                                      rows={2}
                                    />
                                  </div>
                                ) : (
                                  <>
                                    {(q.type === 'short_text' || q.type === 'email' || q.type === 'number') && (
                                      <div className="border-b border-dashed border-zinc-300 w-1/2 py-2 text-zinc-400 text-sm">Short answer text</div>
                                    )}
                                    {q.type === 'long_text' && (
                                      <div className="border-b border-dashed border-zinc-300 w-full py-2 text-zinc-400 text-sm">Long answer text</div>
                                    )}
                                    {(q.type === 'multiple_choice' || q.type === 'checkbox' || q.type === 'dropdown') && (
                                      <div className="space-y-2">
                                        {q.options?.map((opt, i) => (
                                          <div key={i} className="flex items-center gap-3">
                                            {q.type === 'multiple_choice' ? <div className="w-4 h-4 rounded-full border-2 border-zinc-300" /> : 
                                             q.type === 'checkbox' ? <div className="w-4 h-4 rounded border-2 border-zinc-300" /> :
                                             <div className="w-4 font-mono text-sm text-zinc-400">{i+1}.</div>}
                                            <input 
                                              value={opt}
                                              onChange={(e) => {
                                                const newOpts = [...(q.options||[])];
                                                newOpts[i] = e.target.value;
                                                updateQuestion(q.id, { options: newOpts });
                                              }}
                                              className="flex-1 focus:outline-none border-b border-transparent focus:border-indigo-500 bg-transparent"
                                            />
                                            <button 
                                              onClick={() => {
                                                const newOpts = [...(q.options||[])];
                                                newOpts.splice(i, 1);
                                                updateQuestion(q.id, { options: newOpts });
                                              }}
                                              className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 transition-colors"
                                            >
                                               ✕
                                            </button>
                                          </div>
                                        ))}
                                        <div className="flex items-center gap-3 mt-2">
                                           <div className="w-4 h-4" />
                                           <button 
                                             onClick={() => updateQuestion(q.id, { options: [...(q.options||[]), `Option ${(q.options?.length||0)+1}`] })}
                                             className="text-sm text-zinc-500 hover:text-indigo-600 border-b border-transparent hover:border-indigo-600"
                                           >
                                             Add option
                                           </button>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>

                              {/* Question Footer Actions */}
                              <div className="flex items-center justify-end gap-4 pt-4 border-t border-zinc-100 opacity-0 group-[.focus-within]:opacity-100 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => duplicateQuestion(q)} className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-full transition-colors" title="Duplicate">
                                  <Copy className="w-5 h-5" />
                                </button>
                                <button onClick={() => removeQuestion(q.id)} className="p-2 text-zinc-500 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors" title="Delete">
                                  <Trash2 className="w-5 h-5" />
                                </button>
                                {q.type !== 'section' && (
                                  <>
                                    <button 
                                      onClick={() => setLogicOpenFor(logicOpenFor === q.id ? null : q.id)} 
                                      className={cn("p-2 rounded-full transition-colors", logicOpenFor === q.id ? "bg-indigo-100 text-indigo-600" : "text-zinc-500 hover:bg-zinc-100")} 
                                      title="Logic"
                                    >
                                      <GitBranch className="w-5 h-5" />
                                    </button>
                                    <div className="w-px h-6 bg-zinc-200 mx-2" />
                                    <div className="flex items-center gap-2">
                                      <label className="text-sm font-medium text-zinc-700">Required</label>
                                      <button 
                                        onClick={() => updateQuestion(q.id, { required: !q.required })}
                                        className={cn("w-10 h-5 rounded-full relative transition-colors", q.required ? "bg-indigo-600" : "bg-zinc-200")}
                                      >
                                        <div className={cn("w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform", q.required ? "translate-x-5" : "translate-x-0.5")} />
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                              
                              {/* Logic Panel */}
                              {logicOpenFor === q.id && q.type !== 'section' && (
                                <div className="pt-4 border-t border-zinc-100 mt-4 bg-zinc-50/50 rounded-lg p-4 space-y-3">
                                  <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600 mb-2">
                                    <GitBranch className="w-4 h-4" /> Conditional Logic
                                  </div>
                                  <div className="flex flex-col gap-3">
                                    <div className="flex flex-wrap items-center gap-3">
                                      <span className="text-sm text-zinc-600">Show this question if</span>
                                      <select 
                                        value={q.condition?.targetQuestionId || ''}
                                        onChange={(e) => updateQuestion(q.id, { condition: { ...q.condition, targetQuestionId: e.target.value, operator: q.condition?.operator || 'equals', value: q.condition?.value || '' } })}
                                        className="border border-zinc-200 rounded-md px-3 py-1.5 text-sm bg-white min-w-[150px]"
                                      >
                                        <option value="">Select question...</option>
                                        {form.questions.slice(0, index).filter(prevQ => prevQ.type !== 'section' && prevQ.id !== q.id).map(prevQ => (
                                          <option key={prevQ.id} value={prevQ.id}>{prevQ.title || 'Untitled'}</option>
                                        ))}
                                      </select>
                                      
                                      {q.condition?.targetQuestionId && (
                                        <>
                                          <select
                                            value={q.condition?.operator || 'equals'}
                                            onChange={(e) => updateQuestion(q.id, { condition: { ...q.condition!, operator: e.target.value as any } })}
                                            className="border border-zinc-200 rounded-md px-3 py-1.5 text-sm bg-white"
                                          >
                                            <option value="equals">is</option>
                                            <option value="not_equals">is not</option>
                                          </select>
                                          
                                          {(() => {
                                            const targetQ = form.questions.find(x => x.id === q.condition?.targetQuestionId);
                                            if (targetQ && (targetQ.type === 'multiple_choice' || targetQ.type === 'dropdown' || targetQ.type === 'checkbox')) {
                                              return (
                                                <select
                                                  value={q.condition?.value || ''}
                                                  onChange={(e) => updateQuestion(q.id, { condition: { ...q.condition!, value: e.target.value } })}
                                                  className="border border-zinc-200 rounded-md px-3 py-1.5 text-sm bg-white min-w-[150px]"
                                                >
                                                  <option value="">Select option...</option>
                                                  {targetQ.options?.map((opt, i) => (
                                                    <option key={i} value={opt}>{opt}</option>
                                                  ))}
                                                </select>
                                              );
                                            }
                                            return (
                                              <input 
                                                type="text"
                                                value={q.condition?.value || ''}
                                                onChange={(e) => updateQuestion(q.id, { condition: { ...q.condition!, value: e.target.value } })}
                                                placeholder="Value..."
                                                className="border border-zinc-200 rounded-md px-3 py-1.5 text-sm bg-white min-w-[150px]"
                                              />
                                            );
                                          })()}
                                          
                                          <button 
                                            onClick={() => updateQuestion(q.id, { condition: null })}
                                            className="text-sm text-red-500 hover:text-red-600 font-medium ml-auto"
                                          >
                                            Remove Logic
                                          </button>
                                        </>
                                      )}
                                    </div>
                                    {!q.condition?.targetQuestionId && (
                                      <div className="text-xs text-zinc-500">
                                        Select a previous question to set up a condition for when this question should be shown.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {/* AI Suggestions Widget */}
            <div className="pt-8 pb-4">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                   <Sparkles className="w-4 h-4 text-indigo-500" /> AI Suggestions
                 </h3>
                 <button 
                   onClick={handleSuggestQuestions}
                   disabled={suggesting}
                   className="text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-md transition disabled:opacity-50"
                 >
                   {suggesting ? 'Generating...' : 'Suggest Questions'}
                 </button>
               </div>
               
               {suggestedQuestions.length > 0 && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {suggestedQuestions.map((sq, i) => (
                     <div key={i} className="bg-white border border-indigo-100 rounded-xl p-4 shadow-sm group hover:border-indigo-300 transition-colors">
                       <div className="font-medium text-zinc-900 text-sm mb-1 line-clamp-2">{sq.title}</div>
                       <div className="text-xs text-zinc-500 mb-3 capitalize bg-zinc-100 w-fit px-2 py-0.5 rounded-full">{sq.type?.replace('_', ' ')}</div>
                       <button 
                         onClick={() => addSuggestedQuestion(sq)}
                         className="text-xs font-medium text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-md w-full transition border border-indigo-100 hover:border-indigo-200"
                       >
                         Add to Form
                       </button>
                     </div>
                   ))}
                 </div>
               )}
            </div>

            {/* Mobile Add Question Button */}
            <div className="md:hidden pt-4 pb-12 flex justify-center">
               <button 
                 onClick={() => addQuestion('short_text')}
                 className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-full font-medium shadow-xl hover:bg-indigo-700"
               >
                 <Plus className="w-5 h-5" /> Add Question
               </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function ToolButton({ icon, label, onClick }: { icon: ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-zinc-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 text-zinc-700 hover:text-indigo-700 transition-all text-sm font-medium text-left"
    >
      <div className="text-indigo-600">{icon}</div>
      {label}
    </button>
  );
}
