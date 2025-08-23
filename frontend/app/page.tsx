import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SEO Health Scanner - Free Website SEO Analysis Tool',
  description: 'Analyze your website for SEO issues and get AI-powered recommendations for improvement. Free SEO audit tool with Lighthouse integration.',
  keywords: ['SEO', 'website analysis', 'SEO audit', 'Lighthouse', 'AI recommendations', 'website optimization'],
  openGraph: {
    title: 'SEO Health Scanner - Free Website SEO Analysis',
    description: 'Get AI-powered insights to boost your website performance with our free SEO analysis tool.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SEO Health Scanner - Free Website SEO Analysis',
    description: 'Get AI-powered insights to boost your website performance with our free SEO analysis tool.',
  },
};

export default function HomePage() {
  return (
    <main className="min-h-screen p-4 md:p-8 bg-[#ffe26d] flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto text-center">

        <div className="mb-12 space-y-2">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight uppercase">
            SEO Health Scanner
          </h1>
          <p className="text-xl font-bold">
            Get AI-powered insights to boost your website&apos;s performance.
          </p>
        </div>

        <div className="neo-card -rotate-1 bg-white p-8">
          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <Link href="/login">
              <button className="neo-button bg-blue-500 text-lg uppercase w-full md:w-auto">
                Login
              </button>
            </Link>
            <Link href="/signup">
              <button className="neo-button bg-[#FF5757] text-lg uppercase w-full md:w-auto">
                Sign Up for Free
              </button>
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}