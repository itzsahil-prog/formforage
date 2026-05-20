import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Form, Question } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function FormPreview() {
  const { id } = useParams();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const { register, handleSubmit, trigger, watch, formState: { errors } } = useForm();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const formAnswers = watch();

  useEffect(() => {
    fetch(`/api/forms/${id}`)
      .then(res => res.json())
      .then(data => { setForm(data); setLoading(false); });
  }, [id]);

  const pages = useMemo(() => {
    if (!form) return [];
    
    const _pages: { title: string, description?: string, questions: Question[] }[] = [];
    let currentQuestions: Question[] = [];
    
    let currentTitle = form.title;
    let currentDesc = form.description;
    
    form.questions.forEach(q => {
      // Evaluate condition
      if (q.condition) {
        const targetValue = formAnswers[q.condition.targetQuestionId];
        let isMet = false;
        if (q.condition.operator === 'equals') {
          const valStr = targetValue == null ? '' : String(targetValue);
          isMet = valStr === q.condition.value || (Array.isArray(targetValue) && targetValue.includes(q.condition.value));
        } else if (q.condition.operator === 'not_equals') {
          const valStr = targetValue == null ? '' : String(targetValue);
          isMet = valStr !== q.condition.value && (!Array.isArray(targetValue) || !targetValue.includes(q.condition.value));
        }
        if (!isMet) return; // Skip adding this question if condition is not met
      }

      if (q.type === 'section') {
        _pages.push({ title: currentTitle, description: currentDesc, questions: currentQuestions });
        currentQuestions = [];
        currentTitle = q.title || 'Untitled Section';
        currentDesc = q.description;
      } else {
        currentQuestions.push(q);
      }
    });
    
    _pages.push({ title: currentTitle, description: currentDesc, questions: currentQuestions });
    
    // Filter out completely empty pages unless it's the only page
    const filteredPages = _pages.filter(p => p.questions.length > 0 || _pages.length === 1);
    return filteredPages;
  }, [form, formAnswers]);

  useEffect(() => {
    if (pages.length > 0 && currentPageIndex >= pages.length) {
      setCurrentPageIndex(Math.max(0, pages.length - 1));
    }
  }, [pages.length, currentPageIndex]);

  const handleNext = async () => {
    const fieldsToValidate = pages[currentPageIndex].questions.map(q => q.id);
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentPageIndex(p => p + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentPageIndex(p => Math.max(0, p - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (data: any) => {
    const fieldsToValidate = pages[currentPageIndex].questions.map(q => q.id);
    const isValid = await trigger(fieldsToValidate);
    if (!isValid) return;

    // Filter data to only include visible questions across all pages
    const filteredData: Record<string, any> = {};
    const visibleQuestionIds = new Set(pages.flatMap(p => p.questions.map(q => q.id)));
    for (const key in data) {
      if (visibleQuestionIds.has(key)) {
        filteredData[key] = data[key];
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/forms/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: filteredData })
      });
      if (res.ok) setSubmitted(true);
    } catch (err) {
      alert('Failed to submit response.');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-indigo-50/50"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  if (!form) return <div className="p-8 text-center text-red-500">Form not found</div>;

  if (submitted) {
    return (
      <div className="min-h-screen bg-indigo-50/50 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border-t-8 border-indigo-500"
        >
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">Response recorded</h2>
          <p className="text-zinc-600 mb-6">Your response has been successfully submitted. Thank you!</p>
          <button 
             onClick={() => window.location.reload()}
             className="text-indigo-600 font-medium hover:underline"
          >
            Submit another response
          </button>
        </motion.div>
      </div>
    );
  }

  const currentPageData = pages[currentPageIndex] || pages[0];

  if (!currentPageData) return <div className="p-8 text-center text-red-500">No questions to display</div>;

  return (
    <div className={cn("min-h-screen py-12 px-4 text-zinc-900", form.theme?.fontFamily || 'font-sans', form.theme?.backgroundColor || 'bg-indigo-50/50')}>
      <div className="max-w-2xl mx-auto space-y-6">
        
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

        {/* Header */}
        <motion.div 
          key={`header-${currentPageIndex}`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden"
        >
          <div className="h-3 w-full" style={{ backgroundColor: form.theme?.color || '#4f46e5' }} />
          <div className="p-8">
            <h1 className="text-3xl font-bold text-zinc-900 mb-3">{currentPageData.title}</h1>
            {currentPageData.description && <p className="text-zinc-600 text-lg whitespace-pre-wrap">{currentPageData.description}</p>}
            <div className="mt-6 text-sm text-red-500 flex gap-1">* Indicates required question</div>
            {pages.length > 1 && (
              <div className="mt-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Section {currentPageIndex + 1} of {pages.length}
              </div>
            )}
          </div>
        </motion.div>

        {/* Questions Form */}
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          <AnimatePresence mode="popLayout">
            {currentPageData.questions.map((q, idx) => (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                transition={{ delay: idx * 0.05 }}
                key={q.id} 
                className={cn(
                  "bg-white p-8 rounded-2xl shadow-sm border  transition-colors",
                  errors[q.id] ? "border-red-300 ring-1 ring-red-300" : "border-zinc-200 hover:border-indigo-200"
                )}
              >
                <div className="mb-4">
                  <span className="text-lg font-medium text-zinc-900">{q.title}</span>
                  {q.required && <span className="text-red-500 ml-1 text-lg">*</span>}
                </div>
                
                {/* Inputs based on type */}
                {q.type === 'short_text' && (
                  <input type="text" {...register(q.id, { required: q.required })} className="w-full border-b border-zinc-300 focus:border-indigo-600 py-2 focus:outline-none bg-transparent transition-colors text-lg" placeholder="Your answer" />
                )}
                {q.type === 'email' && (
                  <input type="email" {...register(q.id, { required: q.required })} className="w-full border-b border-zinc-300 focus:border-indigo-600 py-2 focus:outline-none bg-transparent transition-colors text-lg" placeholder="Your email" />
                )}
                {q.type === 'number' && (
                  <input type="number" {...register(q.id, { required: q.required })} className="w-full border-b border-zinc-300 focus:border-indigo-600 py-2 focus:outline-none bg-transparent transition-colors text-lg" placeholder="Your answer" />
                )}
                {q.type === 'long_text' && (
                  <textarea {...register(q.id, { required: q.required })} rows={3} className="w-full border-b border-zinc-300 focus:border-indigo-600 py-2 resize-none focus:outline-none bg-transparent transition-colors text-lg" placeholder="Your answer" />
                )}
                
                {q.type === 'multiple_choice' && (
                   <div className="space-y-3 mt-2">
                     {q.options?.map((opt, i) => (
                       <label key={i} className="flex items-center gap-3 cursor-pointer group">
                         <div className="relative flex items-center justify-center w-5 h-5">
                           <input type="radio" value={opt} {...register(q.id, { required: q.required })} className="peer sr-only" />
                           <div className="w-5 h-5 rounded-full border-2 border-zinc-300 peer-checked:border-indigo-600 transition-colors" />
                           <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 absolute opacity-0 peer-checked:opacity-100 transition-opacity scale-50 peer-checked:scale-100" />
                         </div>
                         <span className="text-zinc-700 text-lg leading-none pt-0.5">{opt}</span>
                       </label>
                     ))}
                   </div>
                )}

                {q.type === 'checkbox' && (
                   <div className="space-y-3 mt-2">
                     {q.options?.map((opt, i) => (
                       <label key={i} className="flex items-center gap-3 cursor-pointer group">
                         <div className="relative flex items-center justify-center w-5 h-5">
                           <input type="checkbox" value={opt} {...register(q.id, { required: q.required })} className="peer sr-only" />
                           <div className="w-5 h-5 rounded border-2 border-zinc-300 peer-checked:border-indigo-600 peer-checked:bg-indigo-600 transition-colors flex items-center justify-center text-white" >
                             <svg className="w-3.5 h-3.5 opacity-0 peer-checked:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                           </div>
                         </div>
                         <span className="text-zinc-700 text-lg leading-none pt-0.5">{opt}</span>
                       </label>
                     ))}
                   </div>
                )}
                
                {q.type === 'dropdown' && (
                  <select {...register(q.id, { required: q.required })} className="w-full md:w-1/2 border border-zinc-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-lg">
                    <option value="">Choose</option>
                    {q.options?.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                  </select>
                )}

                {errors[q.id] && (
                  <div className="text-red-500 text-sm mt-3 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    This is a required question
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

           <div className="pt-4 flex justify-between items-center pb-12">
             <div className="flex gap-3">
               {currentPageIndex > 0 && (
                 <button 
                   type="button" 
                   onClick={handleBack}
                   className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 px-6 py-3 rounded-lg font-medium transition-colors"
                 >
                   Back
                 </button>
               )}
               {currentPageIndex < pages.length - 1 ? (
                 <button 
                   type="button" 
                   onClick={handleNext}
                   className="text-white px-8 py-3 rounded-lg font-medium tracking-wide transition-colors flex items-center gap-2"
                   style={{ backgroundColor: form.theme?.color || '#4f46e5' }}
                 >
                   Next <ChevronRight className="w-4 h-4" />
                 </button>
               ) : (
                 <button 
                   type="button" 
                   onClick={handleSubmit(onSubmit)}
                   disabled={submitting}
                   className="disabled:opacity-50 text-white px-8 py-3 rounded-lg font-medium tracking-wide transition-colors flex items-center gap-2 shadow-sm"
                   style={{ backgroundColor: form.theme?.color || '#4f46e5' }}
                 >
                   {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit'}
                 </button>
               )}
             </div>
             
             <div className="text-xs text-zinc-400 font-medium tracking-widest uppercase hidden md:block">
               {pages.length > 1 && (
                 <div className="flex w-full max-w-[120px] bg-zinc-200 rounded-full h-1.5 mt-2">
                   <div 
                     className="h-1.5 rounded-full transition-all duration-500" 
                     style={{ 
                       width: `${((currentPageIndex + 1) / pages.length) * 100}%`,
                       backgroundColor: form.theme?.color || '#4f46e5' 
                     }}
                   />
                 </div>
               )}
             </div>
          </div>
        </form>
      </div>
    </div>
  );
}
