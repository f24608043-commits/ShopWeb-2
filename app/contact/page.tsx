'use client';

import React, { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('✅ Thank you! Your message has been sent successfully.');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setStatus(`❌ ${data.error || 'Failed to send message'}`);
      }
    } catch {
      setStatus('❌ Network error sending message.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-black text-gray-900">Contact Support & Sales</h1>
        <p className="text-xs text-gray-500 mt-1">Have a custom furniture request or inquiry? Drop us a message.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-gray-200 space-y-4 shadow-sm text-xs">
        <div>
          <label className="font-bold text-gray-700 block mb-1">Your Full Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="font-bold text-gray-700 block mb-1">Your Email Address *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="font-bold text-gray-700 block mb-1">Subject *</label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="font-bold text-gray-700 block mb-1">Message *</label>
          <textarea
            rows={5}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </div>

        <button type="submit" className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow">
          Send Message
        </button>

        {status && <p className="text-xs font-semibold text-center mt-2">{status}</p>}
      </form>
    </div>
  );
}
