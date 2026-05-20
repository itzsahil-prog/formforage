import React, { useEffect, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthScope } from '../lib/store';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Sparkles, LayoutDashboard, Settings, FileText, Activity, Loader2, ArrowRight, Table, Mail, HardDrive, Presentation, FileCode2, Search, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Form } from '../types';
import { getAccessToken, signInWithGoogle } from '../lib/firebase';

export default function Dashboard() {
  const user = useAuthScope(s => s.user);
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/forms')
      .then(res => res.json())
      .then(data => {
        setForms(data);
        setLoading(false);
      })
      .catch(console.error);
      
    getAccessToken().then(token => !!token && setIsGoogleConnected(true));
  }, []);

  const handleConnectGoogle = async () => {
    try {
      await signInWithGoogle();
      setIsGoogleConnected(true);
    } catch(err) {
      console.error(err);
    }
  };

  const ConnectedButton = () => (
    <div className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-zinc-100 text-zinc-700 rounded-lg">
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
      Connected
    </div>
  );

  const ConnectAction = () => (
    <button onClick={handleConnectGoogle} className="text-xs font-medium px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors">
      Connect
    </button>
  );

  const createBlankForm = async () => {
    const res = await fetch('/api/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Untitled Form', questions: [] })
    });
    const newForm = await res.json();
    navigate(`/builder/${newForm.id}`);
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const newForm = await res.json();
      if (newForm.id) {
        navigate(`/builder/${newForm.id}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate form');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex bg-zinc-50 min-h-screen font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-200 bg-white flex flex-col hidden md:flex">
        <div className="p-6 border-b border-zinc-100 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">FF</div>
          <span className="font-semibold text-lg tracking-tight">FormForge</span>
        </div>
        <div className="p-4 flex-1 space-y-1">
          <NavItem active icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
          <NavItem icon={<FileText className="w-4 h-4" />} label="My Forms" />
          <NavItem icon={<Activity className="w-4 h-4" />} label="Analytics" />
          <NavItem icon={<Settings className="w-4 h-4" />} label="Settings" />
        </div>
        <div className="p-4 border-t border-zinc-100">
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-medium shadow-sm">
               {user?.name?.[0] || 'A'}
             </div>
             <div className="min-w-0">
               <div className="text-sm font-medium text-zinc-900 truncate">{user?.name}</div>
               <div className="text-xs text-zinc-500 truncate" title={user?.email}>{user?.email}</div>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-6xl mx-auto space-y-8">
          <header className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Workspace</h1>
              <p className="text-zinc-500 mt-1">Manage your forms and view analytics.</p>
            </div>
            <button 
              onClick={createBlankForm}
              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Form
            </button>
          </header>

          {/* AI Generator Block */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-8 relative overflow-hidden">
             <div className="relative z-10 max-w-2xl">
               <div className="flex items-center gap-2 text-indigo-600 mb-3">
                 <Sparkles className="w-5 h-5" />
                 <span className="font-semibold text-sm">AI Form Generator</span>
               </div>
               <h2 className="text-2xl font-semibold text-zinc-900 mb-2">What do you want to build?</h2>
               <p className="text-zinc-600 mb-6">Describe the form you need, and our AI will instantly generate the perfect structure for you.</p>
               
               <div className="flex gap-3">
                 <input 
                   type="text" 
                   value={aiPrompt}
                   onChange={e => setAiPrompt(e.target.value)}
                   disabled={isGenerating}
                   onKeyDown={e => e.key === 'Enter' && handleGenerateAI()}
                   placeholder="e.g. A job application form for frontend engineers..."
                   className="flex-1 bg-white border border-zinc-200 px-4 py-3 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                 />
                 <button 
                   onClick={handleGenerateAI}
                   disabled={isGenerating || !aiPrompt.trim()}
                   className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all shadow-sm"
                 >
                   {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate'}
                 </button>
               </div>
             </div>
             
             {/* Decorative background */}
             <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-500/10 blur-3xl rounded-full" />
             <div className="absolute right-20 -bottom-20 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-lg font-semibold text-zinc-900">Recent Forms</h3>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {[1,2,3,4].map(i => (
                     <div key={i} className="h-40 bg-zinc-100 rounded-2xl animate-pulse" />
                   ))}
                </div>
              ) : forms.length === 0 ? (
                <div className="text-center py-12 bg-white border border-zinc-200 border-dashed rounded-2xl">
                  <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                  <h4 className="text-zinc-900 font-medium">No forms yet</h4>
                  <p className="text-zinc-500 text-sm mt-1 mb-4">Create your first form to start collecting responses.</p>
                  <button onClick={createBlankForm} className="text-indigo-600 font-medium hover:underline">
                    Create Blank Form
                  </button>
                </div>
              ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {forms.map(form => (
                     <div key={form.id} className="bg-white border border-zinc-200 rounded-2xl p-5 hover:shadow-lg transition-all group flex flex-col cursor-default">
                       <div className="flex-1 cursor-pointer" onClick={() => navigate(`/builder/${form.id}`)}>
                         <h4 className="font-semibold text-zinc-900 mb-1">{form.title}</h4>
                         <p className="text-sm text-zinc-500 line-clamp-2">{form.description || 'No description provided.'}</p>
                       </div>
                       <div className="mt-6 flex items-center justify-between pt-4 border-t border-zinc-100">
                         <Link to={`/responses/${form.id}`} className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700">
                           <Activity className="w-4 h-4" />
                           {form.responsesCount} Responses
                         </Link>
                         <Link to={`/builder/${form.id}`} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors">
                           <ArrowRight className="w-4 h-4" />
                         </Link>
                       </div>
                     </div>
                   ))}
                 </div>
              )}
            </div>

            {/* Integrations Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-zinc-900">Workspace Integrations</h3>
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-4 shadow-sm">
                
                <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Table className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-900">Google Sheets</div>
                      <div className="text-xs text-zinc-500">Sync responses</div>
                    </div>
                  </div>
                  {isGoogleConnected ? <ConnectedButton /> : <ConnectAction />}
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-900">Gmail</div>
                      <div className="text-xs text-zinc-500">Email notifications</div>
                    </div>
                  </div>
                  {isGoogleConnected ? <ConnectedButton /> : <ConnectAction />}
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <HardDrive className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-900">Google Drive</div>
                      <div className="text-xs text-zinc-500">Save attachments</div>
                    </div>
                  </div>
                  {isGoogleConnected ? <ConnectedButton /> : <ConnectAction />}
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Presentation className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-900">Google Slides</div>
                      <div className="text-xs text-zinc-500">Generate certificates</div>
                    </div>
                  </div>
                  {isGoogleConnected ? <ConnectedButton /> : <ConnectAction />}
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                      <FileCode2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-900">Google Docs</div>
                      <div className="text-xs text-zinc-500">Generate reports</div>
                    </div>
                  </div>
                  {isGoogleConnected ? <ConnectedButton /> : <ConnectAction />}
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active }: { icon: ReactNode, label: string, active?: boolean }) {
  return (
    <button className={cn(
      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
      active ? "bg-zinc-100 text-zinc-900" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
    )}>
      {icon}
      {label}
    </button>
  );
}
