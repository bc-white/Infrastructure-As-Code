import React, { useState } from "react";


const CEPathwayAssessment = ({
  probe,
  probeIndex,
  onAnswerUpdate,
  className = "",
}) => {
  const [expandedCECategories, setExpandedCECategories] = useState({});

  // Don't render if no CE pathway questions
  if (!probe.CE_pathway_questions || Object.keys(probe.CE_pathway_questions).length === 0) {
    return null;
  }

  // Format question text - handle bullet points and various list formats
  const formatQuestionText = (text) => {
    // Handle object structure from API { question: "..." }
    if (typeof text === 'object' && text !== null && text.question) {
      text = text.question;
    }

    if (typeof text !== "string") return text;

    // Handle multi-line text with potential list items
    if (text.includes('\n')) {
      const lines = text.split('\n');
      
      return (
        <div className="space-y-1">
          {lines.map((line, i) => {
            // Calculate indentation based on leading spaces
            const leadingSpaces = line.search(/\S|$/);
            const indentClass = leadingSpaces >= 2 ? "ml-4" : "";
            
            const trimmedLine = line.trim();
            if (!trimmedLine) return null;
            
            // Check for list markers
            // Ordered: 1., a., i., A., I. (e.g. "1.", "a.", "i.")
            const orderedMatch = trimmedLine.match(/^([a-zA-Z0-9]+|[ivxIVX]+)\.\s+(.*)/);
            // Unordered: -, *, •
            const unorderedMatch = trimmedLine.match(/^([-•*])\s+(.*)/);
            
            if (orderedMatch) {
              return (
                <div key={i} className={`flex items-start space-x-2 ${indentClass}`}>
                  <span className="text-gray-600 font-medium min-w-[20px]">{orderedMatch[1]}.</span>
                  <span className="flex-1 text-sm">{orderedMatch[2]}</span>
                </div>
              );
            }
            
            if (unorderedMatch) {
               return (
                <div key={i} className={`flex items-start space-x-2 ${indentClass}`}>
                  <span className="text-gray-600 font-medium min-w-[15px]">{unorderedMatch[1]}</span>
                  <span className="flex-1 text-sm">{unorderedMatch[2]}</span>
                </div>
              );
            }
            
            // Regular text line
            return (
              <div key={i} className={`text-sm ${i === 0 ? "font-medium" : ""} mb-1 ${indentClass}`}>
                {trimmedLine}
              </div>
            );
          })}
        </div>
      );
    }

    // Fallback for inline bullet points using " o " delimiter
    if (text.includes(" o ")) {
      const parts = text.split(" o ").filter((part) => part.trim());
      return (
        <div className="space-y-1">
          {parts.map((part, i) => (
            <div key={i} className="flex items-start space-x-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span className="flex-1 text-sm">{part.trim()}</span>
            </div>
          ))}
        </div>
      );
    }
    return <span className="text-sm">{text}</span>;
  };

  return (
    <div className={`mt-6 pt-4 border-t border-gray-300 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h5 className="text-sm font-semibold text-gray-900">
          Critical Element Pathway Assessment
        </h5>
        <span className="text-xs text-gray-500">
          {Object.keys(probe.CE_pathway_questions).length} categories
        </span>
      </div>

      <div className="space-y-2">
        {Object.entries(probe.CE_pathway_questions).map(
          ([category, questions], categoryIdx) => {
            if (!Array.isArray(questions) || questions.length === 0) {
              return null;
            }

            const categoryKey = `${probeIndex}_${category}`;
            const isExpanded = expandedCECategories[categoryKey] || false;
            
            // Calculate completed count based on questions checked status
            const checkedCount = questions.filter(q => q.checked).length;

            return (
              <div
                key={category}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => {
                    setExpandedCECategories((prev) => ({
                      ...prev,
                      [categoryKey]: !prev[categoryKey],
                    }));
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-700">
                      {category}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({questions.length} questions)
                    </span>
                    {checkedCount > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                        {checkedCount}/{questions.length} completed
                      </span>
                    )}
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="bg-white border-t border-gray-200">
                    <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                      {questions.map((question, questionIdx) => {
                        const isChecked = question.checked || false;
                        const notes = question.notes || "";

                        return (
                          <div
                            key={questionIdx}
                            className={`p-3 border rounded-lg transition-all ${
                              isChecked
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-start gap-3 mb-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  onAnswerUpdate(
                                    probeIndex,
                                    category,
                                    questionIdx,
                                    e.target.checked,
                                    notes
                                  );
                                }}
                                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                              />
                              <div className="flex-1">
                                <div
                                  className={`${
                                    isChecked
                                      ? "text-gray-900 font-medium"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {formatQuestionText(question)}
                                </div>
                              </div>
                            </div>

                            {/* Notes textarea */}
                            <div className="ml-7 mt-2">
                              <textarea
                                placeholder="Add notes for this question..."
                                value={notes}
                                onChange={(e) => {
                                  onAnswerUpdate(
                                    probeIndex,
                                    category,
                                    questionIdx,
                                    isChecked,
                                    e.target.value
                                  );
                                }}
                                rows={2}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          }
        )}
      </div>
    </div>
  );
};

export default CEPathwayAssessment;
