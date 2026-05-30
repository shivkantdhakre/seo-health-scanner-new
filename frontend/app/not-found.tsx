import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFDE59] p-4">
      <div
        className="bg-white text-center p-10 md:p-16 max-w-lg w-full -rotate-1"
        style={{
          border: "4px solid black",
          boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)",
        }}
      >
        {/* Error code badge */}
        <div
          className="inline-block bg-[#FF5757] text-white text-sm font-black uppercase tracking-widest px-4 py-1 mb-6"
          style={{ border: "2px solid black" }}
        >
          Error 404
        </div>

        <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter mb-2 leading-none">
          404
        </h1>
        <p className="text-2xl font-black uppercase tracking-tight mb-3">
          Page Not Found
        </p>
        <p className="text-gray-600 font-medium mb-8 max-w-sm mx-auto">
          This URL doesn't exist in our system. It may have moved, expired, or you may have mistyped it.
        </p>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 font-black uppercase text-sm px-6 py-3"
          style={{
            border: "4px solid black",
            boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
            backgroundColor: "#FFDE59",
            transition: "all 0.2s",
          }}
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
