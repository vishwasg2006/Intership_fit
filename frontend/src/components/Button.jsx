export default function Button({ variant = "primary", className = "", loading = false, children, ...props }) {
  const styles = {
    primary: "bg-primary text-white hover:opacity-90",
    secondary: "bg-surface text-primary border border-primary hover:bg-bg",
    ghost: "bg-transparent text-ink hover:bg-bg",
    danger: "bg-build text-white hover:opacity-90",
  };
  return (
    <button
      className={`rounded-lg px-5 py-2.5 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
      aria-busy={loading || undefined}
      disabled={loading || props.disabled}
    >{children}</button>
  );
}
