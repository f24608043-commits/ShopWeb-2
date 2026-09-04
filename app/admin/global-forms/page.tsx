'use client';

import React, { useState, useEffect } from 'react';

export default function AdminGlobalFormsPage() {
  const [forms, setForms] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [options, setOptions] = useState([{ name: '', values: '' }]);
  const [status, setStatus] = useState<string | null>(null);

  const fetchForms = async () => {
    const res = await fetch('/api/global-forms');
    const data = await res.json();
    setForms(Array.isArray(data) ? data : []);
  };

  useEffect(() => { fetchForms(); }, []);

  const addOption = () => setOptions([...options, { name: '', values: '' }]);

  const updateOption = (index: number, field: string, val: string) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: val };
    setOptions(updated);
  };

  const removeOption = (index: number) => setOptions(options.filter((_, i) => i !== index));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    const parsedOptions = options
      .filter((o) => o.name.trim() && o.values.trim())
      .map((o) => ({
        name: o.name.trim(),
        values: o.values
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean)
          .map((v) => ({ value: v, priceAdjustment: 0 })),
      }));

    try {
      const res = await fetch('/api/global-forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, options: parsedOptions }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(`✅ Global Form "${data.name}" created with ${parsedOptions.length} option groups!`);
        setName('');
        setOptions([{ name: '', values: '' }]);
        fetchForms();
      } else {
        setStatus(`❌ ${data.error}`);
      }
    } catch { setStatus('❌ Network error.'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this global form?')) return;
    await fetch(`/api/global-forms/${id}`, { method: 'DELETE' });
    fetchForms();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Global Variation Forms</h1>
        <p className="text-xs text-gray-500 mt-0.5">Create reusable option sets (Size, Fabric, Color) that power the Cartesian variation generator.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Create Form */}
        <form onSubmit={handleCreate} className="md:col-span-2 bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4 text-xs h-fit">
          <h2 className="font-bold text-gray-900 text-sm">Create Global Form</h2>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Form Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Bed Frame Specifications"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="font-bold text-gray-700">Option Groups *</label>
              <button
                type="button"
                onClick={addOption}
                className="text-xs text-amber-700 font-bold hover:underline"
              >
                + Add Option
              </button>
            </div>

            {options.map((opt, i) => (
              <div key={i} className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Option name (e.g. Size)"
                    value={opt.name}
                    onChange={(e) => updateOption(i, 'name', e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded font-bold text-gray-900"
                  />
                  {options.length > 1 && (
                    <button type="button" onClick={() => removeOption(i)} className="text-red-500 font-bold">✕</button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Values, comma-separated (e.g. 4ft, 5ft, 6ft)"
                  value={opt.values}
                  onChange={(e) => updateOption(i, 'values', e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-gray-600"
                />
              </div>
            ))}
          </div>

          <button type="submit" className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow">
            Save Global Form ➔
          </button>

          {status && <p className="font-bold text-center p-2 bg-gray-100 rounded">{status}</p>}
        </form>

        {/* Existing Global Forms */}
        <div className="md:col-span-3 space-y-4">
          {forms.map((form) => (
            <div key={form.id} className="bg-white p-5 rounded-2xl border border-gray-200 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-gray-900 text-sm">⚙️ {form.name}</h3>
                <button onClick={() => handleDelete(form.id)} className="text-xs text-red-600 hover:underline font-bold">Delete</button>
              </div>

              <div className="space-y-2">
                {form.options?.map((opt: any) => (
                  <div key={opt.id} className="text-xs">
                    <span className="font-bold text-gray-800">{opt.name}: </span>
                    <span className="text-gray-500">
                      {opt.values?.map((v: any) => v.value).join(' / ')}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-amber-700 font-bold bg-amber-50 px-3 py-1.5 rounded-lg">
                Cartesian Product: {
                  form.options?.reduce((acc: number, o: any) => acc * (o.values?.length || 1), 1)
                } possible variation combinations
              </p>
            </div>
          ))}

          {forms.length === 0 && (
            <div className="text-center py-12 text-xs text-gray-400">
              No global forms created yet. Create your first option set (Size × Fabric × Color).
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
