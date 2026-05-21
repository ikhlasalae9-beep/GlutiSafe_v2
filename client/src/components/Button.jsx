export default function Button({
  children,
  className = '',
  icon: Icon,
  variant = 'primary',
  ...props
}) {
  const variants = {
    primary: 'primary-btn',
    secondary: 'secondary-btn',
    ghost: 'ghost-btn',
  };

  return (
    <button className={`${variants[variant] || variants.primary} ${className}`} {...props}>
      {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
