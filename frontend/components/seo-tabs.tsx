"use client";

import React from "react";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useState } from "react";

import type { AISuggestions } from "@/lib/types";

// Add a check to ensure results and its properties exist.
export function TabsContainer({ results }: { results?: AISuggestions }) {
  const [activeTab, setActiveTab] = useState("issues");

  // If there are no results from the AI, display a message.
  if (!results) {
    return (
      <div className="neo-card bg-white -rotate-1 p-6 text-center">
        <p className="text-xl font-bold">No AI analysis data available.</p>
      </div>
    );
  }

  // Safely access arrays, providing empty arrays as fallbacks.
  const issues = results.issues || [];
  const recommendations = results.recommendations || [];
  const metaTagsDetails = results.metaTagsDetails || [];
  const contentDetails = results.contentDetails || [];
  const technicalDetails = results.technicalDetails || [];

  return (
    <div className="neo-card bg-white -rotate-1">
      <div className="p-4 border-b-4 border-black">
        <h2 className="text-2xl font-bold mb-4">Analysis Results</h2>
        <div className="flex flex-wrap gap-4">
          <button
            className={`tab-button py-2 px-4 rounded-lg font-bold text-lg transition-all duration-200 
              ${activeTab === "issues"
                ? "bg-[#FF5757] text-white shadow-lg transform -translate-y-0.5"
                : "bg-gray-100 hover:bg-gray-200"}`}
            onClick={() => setActiveTab("issues")}
          >
            Issues
            <span className={`ml-2 px-2 py-0.5 rounded-full ${activeTab === "issues" ? "bg-white text-[#FF5757]" : "bg-gray-200"
              }`}>
              {issues.length}
            </span>
          </button>
          <button
            className={`tab-button py-2 px-4 rounded-lg font-bold text-lg transition-all duration-200 
              ${activeTab === "recommendations"
                ? "bg-[#FF5757] text-white shadow-lg transform -translate-y-0.5"
                : "bg-gray-100 hover:bg-gray-200"}`}
            onClick={() => setActiveTab("recommendations")}
          >
            Recommendations
            <span className={`ml-2 px-2 py-0.5 rounded-full ${activeTab === "recommendations" ? "bg-white text-[#FF5757]" : "bg-gray-200"
              }`}>
              {recommendations.length}
            </span>
          </button>
          <button
            className={`tab-button py-2 px-4 rounded-lg font-bold text-lg transition-all duration-200 
              ${activeTab === "details"
                ? "bg-[#FF5757] text-white shadow-lg transform -translate-y-0.5"
                : "bg-gray-100 hover:bg-gray-200"}`}
            onClick={() => setActiveTab("details")}
          >
            Details
          </button>
        </div>
      </div>

      {activeTab === "issues" && (
        <div className="tab-content p-6 space-y-6">
          {issues.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-16 w-16 text-[#00C853] mx-auto mb-4" />
              <p className="text-2xl font-bold">No critical issues found!</p>
              <p className="text-lg">
                Your website is doing well, but check the recommendations for
                further improvements.
              </p>
            </div>
          ) : (
            issues.map(
              (
                issue: {
                  title: string;
                  description: string;
                  severity: "high" | "medium" | "low";
                },
                index: number
              ) => (
                <IssueCard
                  key={index}
                  issue={issue}
                  rotation={index % 2 === 0 ? "rotate-1" : "-rotate-1"}
                />
              )
            )
          )}
        </div>
      )}

      {activeTab === "recommendations" && (
        <div className="tab-content p-6 space-y-6">
          {recommendations.map(
            (
              recommendation: {
                title: string;
                description: string;
                impact: "high" | "medium" | "low";
              },
              index: number
            ) => (
              <RecommendationCard
                key={index}
                recommendation={recommendation}
                rotation={index % 2 === 0 ? "-rotate-1" : "rotate-1"}
              />
            )
          )}
        </div>
      )}

      {activeTab === "details" && (
        <div className="tab-content p-6 space-y-8">
          <DetailSection title="Meta Tags" items={metaTagsDetails} />
          <DetailSection
            title="Content Analysis"
            items={contentDetails}
          />
          <DetailSection
            title="Technical SEO"
            items={technicalDetails}
          />
        </div>
      )}
    </div>
  );
}

// ... (IssueCard and RecommendationCard components remain the same) ...
function IssueCard({
  issue,
  rotation,
}: {
  issue: {
    title: string;
    description: string;
    severity: "high" | "medium" | "low";
  };
  rotation: string;
}) {
  const severityConfig = {
    high: {
      icon: <XCircle className="h-6 w-6 text-red-600" />,
      bg: "bg-red-600",
      text: "text-red-700",
      bgLight: "bg-red-50",
      border: "border-red-200",
      label: "High Priority",
    },
    medium: {
      icon: <AlertCircle className="h-6 w-6 text-amber-600" />,
      bg: "bg-amber-500",
      text: "text-amber-700",
      bgLight: "bg-amber-50",
      border: "border-amber-200",
      label: "Medium Priority",
    },
    low: {
      icon: <AlertCircle className="h-6 w-6 text-blue-600" />,
      bg: "bg-blue-600",
      text: "text-blue-700",
      bgLight: "bg-blue-50",
      border: "border-blue-200",
      label: "Low Priority",
    },
  };

  const config = severityConfig[issue.severity];

  return (
    <div className={`neo-card ${rotation} transform transition-all duration-300 hover:scale-[1.02]`}>
      <div className={`absolute top-0 right-0 ${config.bg} text-white px-3 py-1 text-sm font-bold rounded-bl-lg rounded-tr-lg`}>
        {config.label}
      </div>
      <div className="pt-8 px-6 pb-6">
        <div className="flex items-start gap-4 mb-4">
          <div className={`p-2 rounded-full ${config.bgLight}`}>
            {config.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{issue.title}</h3>
            <p className="text-gray-700 leading-relaxed">{issue.description}</p>
          </div>
        </div>
        <div className={`mt-4 p-4 rounded-lg ${config.bgLight} border ${config.border}`}>
          <p className={`${config.text} font-medium text-sm`}>
            This issue {issue.severity === 'high'
              ? 'requires immediate attention and could significantly impact your SEO performance.'
              : issue.severity === 'medium'
                ? 'should be addressed to improve your SEO ranking.'
                : 'can be addressed to optimize your SEO performance further.'}
          </p>
        </div>
      </div>
    </div>
  );
}

function RecommendationCard({
  recommendation,
  rotation,
}: {
  recommendation: {
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
  };
  rotation: string;
}) {
  const impactConfig = {
    high: {
      bg: "bg-emerald-600",
      text: "text-emerald-700",
      border: "border-emerald-200",
      bgLight: "bg-emerald-50",
      label: "High Impact",
      icon: "⭐⭐⭐",
    },
    medium: {
      bg: "bg-blue-600",
      text: "text-blue-700",
      border: "border-blue-200",
      bgLight: "bg-blue-50",
      label: "Medium Impact",
      icon: "⭐⭐",
    },
    low: {
      bg: "bg-gray-600",
      text: "text-gray-700",
      border: "border-gray-200",
      bgLight: "bg-gray-50",
      label: "Low Impact",
      icon: "⭐",
    },
  };

  const config = impactConfig[recommendation.impact];

  return (
    <div className={`neo-card ${rotation} transform transition-all duration-300 hover:scale-[1.02]`}>
      <div className={`absolute top-0 right-0 ${config.bg} text-white px-3 py-1 text-sm font-bold rounded-bl-lg rounded-tr-lg`}>
        {config.label}
      </div>
      <div className="pt-8 px-6 pb-6">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-xl font-bold text-gray-900">{recommendation.title}</h3>
              <span className="text-amber-500">{config.icon}</span>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">{recommendation.description}</p>
            <div className={`p-4 rounded-lg ${config.bgLight} border ${config.border}`}>
              <p className={`${config.text} font-medium text-sm`}>
                {recommendation.impact === 'high'
                  ? 'Implementing this change could significantly improve your SEO performance.'
                  : recommendation.impact === 'medium'
                    ? 'This improvement will have a noticeable impact on your SEO ranking.'
                    : 'This change will help optimize your SEO strategy.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// THE FIX IS HERE: Provide a default empty array for the 'items' prop.
function DetailSection({
  title,
  items = [],
}: {
  title: string;
  items?: { name: string; value: string; status: "good" | "warning" | "bad" }[];
}) {
  const statusConfig = {
    good: {
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
      bg: "bg-emerald-600",
      text: "text-emerald-700",
      border: "border-emerald-200",
      bgLight: "bg-emerald-50",
      label: "Good",
    },
    warning: {
      icon: <AlertCircle className="h-5 w-5 text-amber-600" />,
      bg: "bg-amber-500",
      text: "text-amber-700",
      border: "border-amber-200",
      bgLight: "bg-amber-50",
      label: "Needs Attention",
    },
    bad: {
      icon: <XCircle className="h-5 w-5 text-red-600" />,
      bg: "bg-red-600",
      text: "text-red-700",
      border: "border-red-200",
      bgLight: "bg-red-50",
      label: "Critical",
    },
  };

  if (items.length === 0) {
    return (
      <div className="neo-card rotate-1 p-6">
        <h3 className="text-2xl font-bold mb-4 uppercase">{title}</h3>
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-gray-500">No specific details to show for this section.</p>
        </div>
      </div>
    );
  }

  const groupedItems = {
    bad: items.filter(item => item.status === 'bad'),
    warning: items.filter(item => item.status === 'warning'),
    good: items.filter(item => item.status === 'good'),
  };

  return (
    <div className="neo-card rotate-1 p-6">
      <h3 className="text-2xl font-bold mb-6 uppercase">{title}</h3>
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([status, statusItems]) =>
          statusItems.length > 0 && (
            <div key={status} className="space-y-3">
              <h4 className={`text-sm font-bold ${statusConfig[status as keyof typeof statusConfig].text} uppercase`}>
                {statusConfig[status as keyof typeof statusConfig].label}
              </h4>
              {statusItems.map((item, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${statusConfig[item.status].bgLight} border ${statusConfig[item.status].border
                    } hover:bg-opacity-75 transition-all duration-200`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-2 rounded-full ${statusConfig[item.status].bgLight}`}>
                        {statusConfig[item.status].icon}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{item.name}</p>
                        <p className="text-gray-700 text-sm mt-1">{item.value}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}