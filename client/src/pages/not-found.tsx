import { Link } from "wouter";
import { Home, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ backgroundColor: '#0d1a14' }}>
      {/* Texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Background blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-900/20 blur-3xl" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-amber-900/10 blur-3xl" />

      <div className="relative z-10 text-center px-6 max-w-lg">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-1.5 mb-8">
          <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 500, color: '#d4b56a', letterSpacing: '0.1em', fontSize: '1.5rem' }}>
            OKAPI
          </span>
          <span style={{ fontFamily: "'Cormorant', serif", fontWeight: 400, fontStyle: 'italic', color: '#f5f3ef', fontSize: '1.5rem' }}>
            Care Network
          </span>
        </Link>

        {/* 404 */}
        <h1 style={{ fontFamily: "'Cormorant', serif", fontSize: '6rem', fontWeight: 500, color: '#c9a962', marginBottom: '0.5rem', lineHeight: 1 }}>
          404
        </h1>
        <h2 style={{ fontFamily: "'Cormorant', serif", fontSize: '1.75rem', fontWeight: 500, color: '#ffffff', marginBottom: '1rem' }}>
          Page Not Found
        </h2>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '1rem', color: '#a8a49c', marginBottom: '2rem' }}>
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button
              className="w-full sm:w-auto px-6 py-3 rounded"
              style={{
                backgroundColor: '#c9a962',
                color: '#0d1a14',
                fontFamily: "'Jost', sans-serif",
                fontWeight: 500
              }}
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
          <Link href="/search">
            <Button
              variant="outline"
              className="w-full sm:w-auto px-6 py-3 rounded"
              style={{
                borderColor: 'rgba(201, 169, 98, 0.4)',
                color: '#c9a962',
                fontFamily: "'Jost', sans-serif",
                fontWeight: 500
              }}
            >
              <Search className="w-4 h-4 mr-2" />
              Find Care Homes
            </Button>
          </Link>
        </div>

        {/* Back link */}
        <button
          onClick={() => window.history.back()}
          className="mt-6 inline-flex items-center gap-1 transition-colors hover:text-amber-300"
          style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.875rem', color: '#6b7c72' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Go back to previous page
        </button>
      </div>
    </div>
  );
}
