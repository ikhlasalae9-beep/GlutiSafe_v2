export default function Button({
  children,
  className = '',
  icon: Icon,
  variant = 'primary',
  ...props
}) {
  const variants = {
    primary:
      'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-cyan-500/20 hover:from-teal-400 hover:to-cyan-400',
    secondary:
      'border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-teal-200 hover:text-teal-700',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-4 focus:ring-cyan-200 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
