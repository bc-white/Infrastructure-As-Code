import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { 
  ChevronLeft,
  AlertTriangle,
  Calendar,
  Share2,
  Mail,
  Shield,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { fTagAPI } from "../service/api";

const FTagDetail = () => {
  const navigate = useNavigate();
  const { tag } = useParams();
  const [ftag, setFtag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Parse text into structured elements without HTML
  const parseTextToElements = (text) => {
    if (!text) return null;

    const elements = [];
    let key = 0;

    // Split text into parts, prioritizing roman numerals and bullet points with their content
    const parts = text.split(/(DEFINITIONS\s+§[\d\.]+\([^)]+\)|GUIDANCE\s+§[\d\.]+\([^)]+\)|§[\d\.]+\([^)]+\)|"[^"]+"|\([ivxlcdm]+\)\s+[^•]+?(?=\([ivxlcdm]+\)|•|DEFINITIONS|GUIDANCE|$)|•\s+[^•]+?(?=•|\([ivxlcdm]+\)|DEFINITIONS|GUIDANCE|$)|\.|!|\?)/);

    parts.forEach((part, index) => {
      if (!part.trim()) return;

      // Handle DEFINITIONS sections
      if (part.includes('DEFINITIONS')) {
        const sectionMatch = part.match(/DEFINITIONS\s+(§[\d\.]+\([^)]+\))/);
        if (sectionMatch) {
          elements.push(
            <div key={key++} className="my-4 p-3 bg-gray-50 border border-gray-200 rounded">
              <h4 className="font-bold text-gray-800 uppercase tracking-wide mb-2">DEFINITIONS</h4>
              <span className="font-bold text-blue-800 bg-blue-50 px-2 py-1 rounded text-sm">
                {sectionMatch[1]}
              </span>
            </div>
          );
          return;
        }
      }

      // Handle GUIDANCE sections
      if (part.includes('GUIDANCE')) {
        const sectionMatch = part.match(/GUIDANCE\s+(§[\d\.]+\([^)]+\))/);
        if (sectionMatch) {
          elements.push(
            <div key={key++} className="my-4 p-3 bg-green-50 border border-green-200 rounded">
              <h4 className="font-bold text-green-800 uppercase tracking-wide mb-2">GUIDANCE</h4>
              <span className="font-bold text-blue-800 bg-blue-50 px-2 py-1 rounded text-sm">
                {sectionMatch[1]}
              </span>
            </div>
          );
          return;
        }
      }

      // Handle roman numerals with their content - start on new line
      const romanMatch = part.match(/^(\([ivxlcdm]+\))\s+(.+)$/);
      if (romanMatch) {
        elements.push(
          <div key={key++} className="flex items-start mb-3">
            <span className="font-bold text-gray-800 mr-3 mt-0.5 flex-shrink-0">
              {romanMatch[1]}
            </span>
            <span className="flex-1 text-black leading-relaxed">
              {romanMatch[2].trim()}
            </span>
          </div>
        );
        return;
      }

      // Handle section references like §483.10(f)(9)
      if (part.match(/^§[\d\.]+\([^)]+\)$/)) {
        elements.push(
          <span key={key++} className="font-bold text-blue-800 bg-blue-50 px-2 py-1 rounded text-sm inline-block mr-2 mb-1">
            {part}
          </span>
        );
        return;
      }

      // Handle quoted text
      if (part.startsWith('"') && part.endsWith('"')) {
        const content = part.slice(1, -1); // Remove quotes
        elements.push(
          <span key={key++} className="italic text-gray-700 bg-yellow-50 px-2 py-1 rounded border-l-2 border-yellow-400">
            "{content}"
          </span>
        );
        return;
      }

      // Handle bullet points with their content - start on new line
      const bulletMatch = part.match(/^(•)\s+(.+)$/);
      if (bulletMatch) {
        elements.push(
          <div key={key++} className="flex items-start mb-2">
            <span className="text-blue-600 mr-3 mt-1.5 flex-shrink-0">
              {bulletMatch[1]}
            </span>
            <span className="flex-1 text-black leading-relaxed">
              {bulletMatch[2].trim()}
            </span>
          </div>
        );
        return;
      }

      // Handle punctuation and regular text
      if (part.match(/^[.!?]$/)) {
        elements.push(
          <span key={key++}>
            {part}
          </span>
        );
        return;
      }

      // Handle regular text
      if (part.trim()) {
        // Split by sentences for better formatting
        const sentences = part.split(/(?<=[.!?])\s+/);
        sentences.forEach((sentence, sentenceIndex) => {
          if (sentence.trim()) {
            elements.push(
              <span key={key++}>
                {sentence.trim()}
                {sentenceIndex < sentences.length - 1 ? ' ' : ''}
              </span>
            );
          }
        });
      }
    });

    return elements.length > 0 ? elements : <span>{text}</span>;
  };

  // Fetch F-Tag data from API
  const fetchFTagData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fTagAPI.getFTagById(tag);

      if (response.status && response.data) {
        setFtag(response.data);
      } else {
        throw new Error(response.message || "Failed to fetch F-Tag data");
      }
    } catch (err) {
    
      setError(err.message || "Failed to load F-Tag data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tag) {
      fetchFTagData();
    } 
  }, [tag]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="border-2 border-gray-300 p-8">
            <Loader2 className="w-12 h-12 animate-spin text-gray-800 mx-auto mb-4" />
            <h2 className="text-xl font-black text-black mb-2 uppercase tracking-wide">Loading F-Tag Details</h2>
            <p className="text-black font-bold">Please wait while we fetch the information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !ftag) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="border-2 border-gray-300 p-8">
            <AlertTriangle className="w-16 h-16 text-gray-800 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-black mb-2 uppercase tracking-wide">
              Error Loading F-Tag
            </h2>
            <p className="text-black font-bold mb-6">{error || "F-Tag not found"}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={fetchFTagData} variant="outline" className="flex items-center justify-center border-2 border-gray-300 font-bold uppercase tracking-wide">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={() => navigate("/f-tag-library")} className="flex items-center justify-center bg-gray-800 text-white font-bold uppercase tracking-wide">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Library
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getCategoryLabel = (category) => {
    // Return the category as-is since the API provides the full category name
    return category || "No Category";
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b-2 border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm overflow-x-auto">
            <button
              onClick={() => navigate("/f-tag-library")}
              className="text-black hover:text-gray-600 font-bold uppercase tracking-wide whitespace-nowrap transition-colors duration-200 cursor-pointer"
            >
              F-Tag Library
            </button>
            <span className="text-gray-400 flex-shrink-0">/</span>
            <span className="text-gray-600 font-bold uppercase tracking-wide min-w-0 break-words">
              {getCategoryLabel(ftag.category)}
            </span>
            <span className="text-gray-400 flex-shrink-0">/</span>
            <span className="text-black font-black whitespace-nowrap flex-shrink-0">{ftag.ftag}</span>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Article */}
          <article className="lg:col-span-8 lg:order-1">
            {/* Article Header */}
            <header className="border-b-2 border-gray-300 pb-6 mb-8">
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-gray-800 text-white text-xs font-bold uppercase tracking-wider">
                  {getCategoryLabel(ftag.category)}
                </span>
              </div>
              
              <div className="mb-6">
                <div className="flex space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gray-800 text-white font-black text-xl flex items-center justify-center mt-2">
                    {ftag.ftag}
                </div>
                <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-black leading-tight mb-4 font-serif">
                      {ftag.definitions || "No Title Available"}
                  </h1>
                    <div className="mb-6">
                      <div className="inline-block">
                        <span className="font-mono border border-gray-400 px-2 py-1 text-sm text-gray-600 uppercase tracking-wide font-bold break-words max-w-full">
                          {ftag.rev_and_date || "No Revision Date"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {(ftag.description || ftag.definitions) && (
                <div className="border-l-4 border-gray-300 pl-4">
                  <div className="text-lg text-black leading-relaxed font-serif">
                    {parseTextToElements(ftag.description || ftag.definitions)}
                  </div>
                </div>
              )}
              
             
            </header>

            {/* Article Body */}
            <div className="space-y-8">
              {/* Additional Information */}
              {(ftag.intent || ftag.guidance || ftag.procedure) && (
                <section className="border-t-2 border-gray-300 pt-8">
                  <h2 className="text-2xl font-black text-black mb-6 uppercase tracking-wide">
                    Additional Information
                  </h2>

                  <div className="space-y-8">
                    {ftag.intent && (
                      <div className="border-l-4 border-gray-300 pl-6">
                        <h3 className="font-black text-black mb-3 uppercase tracking-wide text-lg">Intent</h3>
                        <div className="text-black leading-relaxed font-serif text-base">
                          {parseTextToElements(ftag.intent)}
                        </div>
                      </div>
                    )}
                    {ftag.guidance && (
                      <div className="border-l-4 border-gray-300 pl-6">
                        <h3 className="font-black text-black mb-3 uppercase tracking-wide text-lg">Guidance</h3>
                        <div className="text-black leading-relaxed font-serif text-base">
                          {parseTextToElements(ftag.guidance)}
                        </div>
                      </div>
                    )}
                    {ftag.procedure && (
                      <div className="border-l-4 border-gray-300 pl-6">
                        <h3 className="font-black text-black mb-3 uppercase tracking-wide text-lg">Procedure</h3>
                        <div className="text-black leading-relaxed font-serif text-base">
                          {parseTextToElements(ftag.procedure)}
                        </div>
                      </div>
                    )}
                </div>
              </section>
              )}
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-4 order-first lg:order-2">
            <div className="lg:sticky lg:top-8 space-y-6 mt-8 lg:mt-0">
              {/* F-Tag Details */}
              <div className="border-2 border-gray-300 p-6">
                <h3 className="text-xl font-black text-black mb-6 uppercase tracking-wide">
                  F-Tag Details
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b-2 border-gray-300">
                    <span className="text-sm font-bold text-black uppercase tracking-wide">F-Tag Number</span>
                    <span className="font-mono font-black text-black text-lg">
                      {ftag.ftag}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between  py-3 border-b-2 border-gray-300 gap-2">
                    <span className="text-sm font-bold text-black uppercase tracking-wide">Revision Date</span>
                    <span className="font-mono text-black text-sm break-words text-right">
                      {ftag.rev_and_date || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm font-bold text-black uppercase tracking-wide">Category</span>
                    <span className="text-black text-sm text-right max-w-32 truncate font-bold">
                      {getCategoryLabel(ftag.category)}
                    </span>
                  </div>
                
                </div>
              </div>

              {/* F-Tag Information */}
              <div className="border-2 border-gray-300 p-6">
                <h3 className="text-xl font-black text-black mb-6 uppercase tracking-wide">
                  F-Tag Information
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b-2 border-gray-300">
                    <span className="text-sm font-bold text-black uppercase tracking-wide">
                      Has Intent
                    </span>
                    <span className={`px-3 py-1 text-xs font-black uppercase tracking-wide border-2 ${
                      ftag.intent ? "bg-gray-800 text-white border-gray-800" : "bg-white text-black border-gray-300"
                    }`}>
                      {ftag.intent ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b-2 border-gray-300">
                    <span className="text-sm font-bold text-black uppercase tracking-wide">
                      Has Guidance
                    </span>
                    <span className={`px-3 py-1 text-xs font-black uppercase tracking-wide border-2 ${
                      ftag.guidance ? "bg-gray-800 text-white border-gray-800" : "bg-white text-black border-gray-300"
                    }`}>
                      {ftag.guidance ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm font-bold text-black uppercase tracking-wide">
                      Has Procedure
                    </span>
                    <span className={`px-3 py-1 text-xs font-black uppercase tracking-wide border-2 ${
                      ftag.procedure ? "bg-gray-800 text-white border-gray-800" : "bg-white text-black border-gray-300"
                    }`}>
                      {ftag.procedure ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default FTagDetail;  
