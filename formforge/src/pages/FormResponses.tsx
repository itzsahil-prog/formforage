import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Form } from '../types';
import { ChevronLeft, BarChart3, List, Download, Share, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function FormResponses() {
  const { id } = useParams();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'individual'>('summary');
  const [shareToast, setShareToast] = useState<{ url: string; message: string } | null>(null);

  useEffect(() => {
    fetch(`/api/forms/${id}`)
      .then(res => res.json())
      .then(data => { setForm(data); setLoading(false); });
  }, [id]);

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading responses...</div>;
  if (!form) return <div className="p-8 text-center text-red-500">Form not found</div>;

  const getPublicFormUrl = (formId: string) => new URL(`/f/${formId}`, window.location.origin).toString();

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // fall through
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
    const url = getPublicFormUrl(form.id);
    setShareToast(null);

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
      // share cancelled/failed -> fall back to copy
    }

    const copied = await copyToClipboard(url);
    setShareToast({ url, message: copied ? 'Link copied.' : 'Copy failed. Use the link below.' });
  };

  const exportCSV = () => {
    if (!form || form.responses.length === 0) return;

    const escapeCSV = (field: string) => {
      if (field == null) return '';
      const str = String(field);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = ['Submitted At', ...form.questions.map(q => q.title)].map(escapeCSV);
    
    const rows = form.responses.map(resp => {
      const row = [escapeCSV(new Date(resp.submittedAt).toLocaleString())];
      form.questions.forEach(q => {
        const ans = resp.answers[q.id];
        let strAns = '';
        if (ans) {
           strAns = Array.isArray(ans) ? ans.join('; ') : String(ans);
        }
        row.push(escapeCSV(strAns));
      });
      return row;
    });

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${form.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const responseCount = form.responses.length;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50">
      <header className="h-14 border-b border-zinc-200 bg-white flex items-center px-4 shrink-0 gap-4">
        <Link to="/dashboard" className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-600">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="font-semibold text-zinc-900 truncate flex-1">{form.title} - Responses</div>
        <div className="flex bg-zinc-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'summary' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Summary
          </button>
          <button 
            onClick={() => setActiveTab('individual')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'individual' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Individual
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

      <main className="max-w-4xl mx-auto w-full p-4 md:p-8 space-y-8 flex-1">
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-4xl font-light text-zinc-900 mb-1">{responseCount}</div>
            <div className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Total Responses</div>
          </div>
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {responseCount === 0 ? (
          <div className="text-center py-20 text-zinc-400">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium text-zinc-600">Waiting for responses</p>
            <p className="text-sm">Share your form link to start collecting data.</p>
            <div className="mt-5 flex flex-col items-center gap-3">
              <a
                href={getPublicFormUrl(form.id)}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-600 hover:underline break-all max-w-[min(560px,calc(100vw-2rem))]"
              >
                {getPublicFormUrl(form.id)}
              </a>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm"
                >
                  <Share className="w-4 h-4" /> Share
                </button>
                <button
                  onClick={async () => {
                    const url = getPublicFormUrl(form.id);
                    const copied = await copyToClipboard(url);
                    setShareToast({ url, message: copied ? 'Link copied.' : 'Copy failed. Use the link above.' });
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg transition"
                >
                  <Copy className="w-4 h-4" /> Copy link
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === 'summary' ? (
           <div className="space-y-6">
             {form.questions.map((q) => (
               <div key={q.id} className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                 <h3 className="font-medium text-lg text-zinc-900 mb-4">{q.title}</h3>
                 <div className="space-y-2">
                   {form.responses.map(r => r.answers[q.id]).filter(Boolean).map((ans, i) => (
                     <div key={i} className="py-2 border-b border-zinc-100 last:border-0 text-zinc-700">
                       {Array.isArray(ans) ? ans.join(', ') : String(ans)}
                     </div>
                   ))}
                 </div>
               </div>
             ))}
           </div>
        ) : (
          <div className="space-y-6">
            {form.responses.map((resp, i) => (
              <div key={resp.id} className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-100">
                  <div className="font-semibold text-lg">Response {i + 1}</div>
                  <div className="text-sm text-zinc-400">{new Date(resp.submittedAt).toLocaleString()}</div>
                </div>
                <div className="space-y-6">
                  {form.questions.map(q => (
                    <div key={q.id}>
                      <div className="font-medium text-zinc-900 mb-1">{q.title}</div>
                      <div className="text-zinc-700">
                        {resp.answers[q.id] ? (
                          Array.isArray(resp.answers[q.id]) 
                            ? resp.answers[q.id].join(', ') 
                            : String(resp.answers[q.id])
                        ) : <span className="text-zinc-400 italic">No answer provided</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
