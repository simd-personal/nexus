export function ChatLoadingShell() {
  return (
    <div className="flex h-[calc(100vh-4rem)] rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm animate-pulse">
      <div className="w-56 border-r border-gray-200 bg-gray-50 p-3 space-y-2 hidden sm:block">
        <div className="h-9 bg-gray-200 rounded-lg" />
        <div className="h-8 bg-gray-200 rounded-lg" />
        <div className="h-8 bg-gray-200 rounded-lg" />
        <div className="h-8 bg-gray-200 rounded-lg" />
      </div>
      <div className="flex-1 flex flex-col">
        <div className="h-12 border-b border-gray-100 bg-gray-50" />
        <div className="flex-1 p-6 space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
        </div>
        <div className="h-24 border-t border-gray-200 bg-gray-50 m-4 rounded-2xl" />
      </div>
    </div>
  );
}
