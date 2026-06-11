// Small shared presentational helpers.
export function PageTitle({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, accent = "bg-gov" }) {
  return (
    <div className="card">
      <div className={"mb-2 h-1 w-10 rounded " + accent} />
      <div className="text-2xl font-bold text-slate-800 dark:text-white">
        {value}
      </div>
      <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}

export function Alert({ type = "info", children }) {
  const styles = {
    info: "bg-blue-50 text-blue-800 border-blue-200",
    success: "bg-green-50 text-green-800 border-green-200",
    error: "bg-red-50 text-red-800 border-red-200",
    warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
  };
  if (!children) return null;
  return (
    <div
      className={
        "mb-3 rounded border px-3 py-2 text-sm " + (styles[type] || styles.info)
      }
    >
      {children}
    </div>
  );
}

export function Spinner() {
  return <div className="py-8 text-center text-slate-500">Loading...</div>;
}

export const inr = (n) => "\u20B9" + Number(n || 0).toLocaleString("en-IN");
