export function DashboardShell({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`grid items-start gap-8 p-8 ${className || ""}`} {...props}>
      {children}
    </div>
  );
}
