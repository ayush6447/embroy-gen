import { Outlet, Link, useLocation } from "react-router";
import { Upload } from "lucide-react";
import { useState } from "react";
import { UploadModal } from "./UploadModal";
import { Button } from "./ui/button";

export function RootLayout() {
  const location = useLocation();
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Clinical header */}
      <header className="bg-slate-900 text-white border-b border-slate-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="bg-white p-0.5 rounded-md flex items-center justify-center w-8 h-8">
                <img src="/src/assets/logo.svg" alt="EmbryoGen Logo" className="w-full h-full" />
              </div>
              <div>
                <div className="text-lg font-semibold tracking-tight">Embryogen</div>
                <div className="text-xs text-slate-400">IVF Decision Support System</div>
              </div>
            </Link>

            <nav className="flex items-center gap-6 text-sm">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded ${location.pathname === '/' ? 'bg-slate-700' : 'hover:bg-slate-800'}`}
              >
                Cohort View
              </Link>
              <Link
                to="/compare"
                className={`px-3 py-1.5 rounded ${location.pathname === '/compare' ? 'bg-slate-700' : 'hover:bg-slate-800'}`}
              >
                Compare Embryos
              </Link>
              <Button
                onClick={() => setShowUploadModal(true)}
                variant="outline"
                size="sm"
                className="bg-white text-slate-900 hover:bg-slate-100"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Data
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>
        <Outlet />
      </main>

      {/* Upload modal */}
      <UploadModal open={showUploadModal} onClose={() => setShowUploadModal(false)} />
    </div>
  );
}