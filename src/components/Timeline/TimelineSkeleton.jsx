export default function TimelineSkeleton({ count = 3 }) {
  return (
    <div className="space-y-2 px-3 py-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center w-9 shrink-0 pt-1">
            <div className="w-9 h-9 rounded-full skeleton shrink-0" />
            {i < count - 1 && <div className="w-0.5 flex-1 skeleton mt-1 min-h-[40px]" />}
          </div>
          <div className="flex-1 pb-4">
            <div className="rounded-2xl border-2 border-border/50 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-16 rounded-full skeleton" />
                <div className="h-4 w-10 rounded-full skeleton ml-auto" />
              </div>
              <div className="h-5 w-40 rounded skeleton" />
              <div className="h-3.5 w-full rounded skeleton" />
              <div className="h-3.5 w-3/4 rounded skeleton" />
              <div className="flex gap-2 pt-1">
                <div className="h-9 flex-1 rounded-xl skeleton" />
                <div className="h-9 w-9 rounded-xl skeleton" />
                <div className="h-9 w-9 rounded-xl skeleton" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
