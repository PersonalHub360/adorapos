import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-full border-2 border-red-500 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <h1 className="text-5xl font-bold mb-4 text-gray-900">404</h1>
        <h2 className="text-xl font-semibold mb-3 text-gray-900">Page Not Found</h2>
        <p className="text-gray-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white font-semibold rounded-md hover:from-pink-600 hover:to-fuchsia-600 transition-all shadow-lg">
            Go Back Home
          </button>
        </Link>
      </div>
    </div>
  );
}
