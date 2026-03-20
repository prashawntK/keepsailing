export default function GoalsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-24 bg-surface-2 rounded-lg" />
          <div className="h-4 w-40 bg-surface-2 rounded-lg" />
        </div>
        <div className="h-9 w-28 bg-surface-2 rounded-xl" />
      </div>
      <div className="h-10 bg-surface-2 rounded-xl" />
      <div className="h-8 w-32 bg-surface-2 rounded-full" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card h-20 bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
