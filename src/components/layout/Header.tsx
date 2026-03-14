import { Bell, Search, UserCircle } from "lucide-react";

export function Header() {
  return (
    <header className="h-16 bg-surface border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm">
      <div className="flex-1 flex items-center">
        <div className="max-w-md w-full relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search patients, records..."
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-slate-50 placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:bg-white focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="p-1.5 rounded-full text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
          <span className="sr-only">View notifications</span>
          <Bell className="h-5 w-5" />
        </button>
        
        <div className="relative">
          <button className="flex items-center gap-2 max-w-xs bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            <span className="sr-only">Open user menu</span>
            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
              <UserCircle className="h-6 w-6" />
            </div>
            <span className="hidden sm:block text-sm font-medium text-slate-700">Dr. Smith</span>
          </button>
        </div>
      </div>
    </header>
  );
}
