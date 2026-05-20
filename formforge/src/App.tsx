/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthScope } from './lib/store';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FormBuilder from './pages/FormBuilder';
import FormPreview from './pages/FormPreview';
import FormResponses from './pages/FormResponses';
import React, { useEffect, useState, type ReactNode } from 'react';

// Protected Route wrapper
function ProtectedRoute(props: any) {
  const { children } = props as { children?: ReactNode };
  const user = useAuthScope(s => s.user);
  if (!user) return <Navigate to="/login" />;
  return children;
}

export default function App() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // If we wanted to hydrate auth from localStorage, do it here
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Router>
      <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/builder/:id" element={
            <ProtectedRoute><FormBuilder /></ProtectedRoute>
          } />
          <Route path="/responses/:id" element={
            <ProtectedRoute><FormResponses /></ProtectedRoute>
          } />
          <Route path="/f/:id" element={<FormPreview />} />
        </Routes>
      </div>
    </Router>
  );
}
