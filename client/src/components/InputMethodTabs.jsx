import { Camera, FileImage, Keyboard } from 'lucide-react';

const methods = [
  { id: 'upload', label: 'Importer une image', icon: FileImage },
  { id: 'camera', label: 'Prendre une photo', icon: Camera },
  { id: 'manual', label: 'Saisie manuelle', icon: Keyboard },
];

export default function InputMethodTabs({ value, onChange }) {
  return (
    <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-2 sm:grid-cols-3">
      {methods.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-black transition ${
            value === id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-600 hover:bg-emerald-50'
          }`}
        >
          <Icon size={18} />
          {label}
        </button>
      ))}
    </div>
  );
}
