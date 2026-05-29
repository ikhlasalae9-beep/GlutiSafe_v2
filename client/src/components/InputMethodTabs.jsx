import { Camera, FileImage, Keyboard } from 'lucide-react';

const methods = [
  { id: 'upload', label: 'Importer une image', icon: FileImage },
  { id: 'camera', label: 'Prendre une photo', icon: Camera },
  { id: 'manual', label: 'Saisie manuelle', icon: Keyboard },
];

export default function InputMethodTabs({ value, onChange }) {
  return (
    <div className="grid gap-2 rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] p-2 sm:grid-cols-3" role="tablist">
      {methods.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={value === id}
          onClick={() => onChange(id)}
          className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-[#a8cfa5]/35 ${
            value === id ? 'bg-[#008f45] text-white shadow-[0_12px_28px_rgba(0,143,69,0.22)]' : 'text-slate-600 hover:bg-white hover:text-[#008f45]'
          }`}
        >
          <Icon size={18} aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}
