"use client";

import type { CompetitorScores } from "@/lib/types";

interface ScoreComparisonTableProps {
  mainScores: CompetitorScores;
  competitorScores: CompetitorScores;
  mainLabel: string;
  competitorLabel: string;
}

const CATEGORIES = [
  { key: "performance" as keyof CompetitorScores, label: "⚡ Performance" },
  { key: "accessibility" as keyof CompetitorScores, label: "♿ Accessibility" },
  { key: "bestPractices" as keyof CompetitorScores, label: "✅ Best Practices" },
  { key: "seo" as keyof CompetitorScores, label: "🔍 SEO" },
];

function getScoreStyle(score: number): string {
  if (score >= 90) return "text-green-700 bg-green-100";
  if (score >= 50) return "text-yellow-700 bg-yellow-100";
  return "text-red-700 bg-red-100";
}

export function ScoreComparisonTable({
  mainScores,
  competitorScores,
  mainLabel,
  competitorLabel,
}: ScoreComparisonTableProps) {
  // Truncate labels for display
  const shortMain = (() => {
    try { return new URL(mainLabel).hostname; } catch { return mainLabel; }
  })();
  const shortComp = (() => {
    try { return new URL(competitorLabel).hostname; } catch { return competitorLabel; }
  })();

  return (
    <div className="neo-card bg-white overflow-hidden">
      <h3 className="text-xl font-black uppercase mb-4">Score Breakdown</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-3 font-black uppercase text-sm border-b-4 border-black bg-gray-50">
                Category
              </th>
              <th className="text-center p-3 font-black uppercase text-sm border-b-4 border-black bg-green-50 text-green-800">
                🏠 {shortMain}
              </th>
              <th className="text-center p-3 font-black uppercase text-sm border-b-4 border-black bg-red-50 text-red-800">
                ⚔️ {shortComp}
              </th>
              <th className="text-center p-3 font-black uppercase text-sm border-b-4 border-black bg-gray-50">
                Winner
              </th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map(({ key, label }, idx) => {
              const mainScore = mainScores[key];
              const compScore = competitorScores[key];
              const mainWins = mainScore > compScore;
              const tie = mainScore === compScore;
              return (
                <tr
                  key={key}
                  className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="p-3 font-bold border-b border-gray-200">
                    {label}
                  </td>
                  <td className="p-3 text-center border-b border-gray-200">
                    <span
                      className={`inline-block px-3 py-1 rounded font-black text-lg ${getScoreStyle(mainScore)}`}
                    >
                      {mainScore}
                    </span>
                  </td>
                  <td className="p-3 text-center border-b border-gray-200">
                    <span
                      className={`inline-block px-3 py-1 rounded font-black text-lg ${getScoreStyle(compScore)}`}
                    >
                      {compScore}
                    </span>
                  </td>
                  <td className="p-3 text-center border-b border-gray-200 text-xl">
                    {tie ? "🤝" : mainWins ? "✅" : "❌"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-500 font-medium">
        ✅ = Your site wins &nbsp;|&nbsp; ❌ = Competitor wins &nbsp;|&nbsp; 🤝 = Tie
      </p>
    </div>
  );
}
