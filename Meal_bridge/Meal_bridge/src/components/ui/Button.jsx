const variants = {
  primary:
    'bg-primary-600 text-white shadow-md shadow-primary-600/25 hover:bg-primary-700',
  secondary:
    'border border-primary-600 bg-white text-primary-700 hover:bg-primary-50',
  outline:
    'border border-primary-600 bg-white text-primary-700 hover:bg-primary-50',
  light:
    'bg-white text-primary-800 shadow-md hover:bg-primary-50',
  ghost:
    'border border-primary-300 bg-transparent text-white hover:bg-white/10',
}

const sizes = {
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  type = 'button',
  onClick,
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
      {children}
    </button>
  )
}
