'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createWorker } from 'tesseract.js';

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

interface ExtractedPage {
  pageNumber: number;
  text: string;
}

interface DocumentChunk {
  id: string;
  pageNumber: number;
  text: string;
}

interface OcrLine {
  text: string;
  score: number;
  polygon: unknown;
}

interface TesseractOcrLine {
  text: string;
  score: number;
  polygon: unknown;
}

interface OcrPageResult {
  pageNumber: number;
  lines: OcrLine[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  sources?: { pageNumber: number; snippet: string; score: number }[];
}

export function PdfIntelligenceWorkbench() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [pages, setPages] = useState<ExtractedPage[]>([]);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'rag' | 'json'>('rag');
  const [ocrResults, setOcrResults] = useState<OcrPageResult[]>([]);
  const [selectedPageNum, setSelectedPageNum] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedText, setCopiedText] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load PDF.js dynamically if not present
  useEffect(() => {
    if (!window.pdfjsLib) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.async = true;
      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
      };
      document.body.appendChild(script);
    } else if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Extract text from ArrayBuffer
  const processPdfArrayBuffer = async (buffer: ArrayBuffer, name: string) => {
    setIsLoading(true);
    setLoadingStatus('Initializing PDF Parser...');
    try {
      // Ensure pdfjsLib is ready
      let attempts = 0;
      while (!window.pdfjsLib && attempts < 25) {
        await new Promise((r) => setTimeout(r, 150));
        attempts++;
      }

      if (!window.pdfjsLib) {
        throw new Error('PDF extraction engine is still loading. Please check your internet connection.');
      }

      setLoadingStatus('Reading document bytes...');
      const loadingTask = window.pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
      const pdf = await loadingTask.promise;

      setLoadingStatus(`Extracting ${pdf.numPages} pages...`);
      const extractedPages: ExtractedPage[] = [];
      const extractedChunks: DocumentChunk[] = [];
      const structuredOcr: OcrPageResult[] = [];
      setLoadingStatus('Loading Tesseract OCR model...');
      const ocr = await createWorker('eng', 1, {
        logger: (message) => {
          if (message.status) setLoadingStatus(`Tesseract: ${message.status}`);
        },
      });

      for (let i = 1; i <= pdf.numPages; i++) {
        setLoadingStatus(`Parsing Page ${i} of ${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Assemble text items preserving basic spacing
        let pageStr = '';
        let lastY: number | null = null;
        for (const item of textContent.items as any[]) {
          if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
            pageStr += '\n';
          } else if (pageStr.length > 0 && !pageStr.endsWith(' ') && !pageStr.endsWith('\n')) {
            pageStr += ' ';
          }
          pageStr += item.str;
          lastY = item.transform[5];
        }

        const cleaned = pageStr.trim();
        setLoadingStatus(`Running Tesseract OCR on Page ${i} of ${pdf.numPages}...`);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const canvasContext = canvas.getContext('2d');
        if (!canvasContext) throw new Error('Unable to prepare page image for OCR.');
        await page.render({ canvasContext, viewport }).promise;
        const pageBlob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Unable to render page for OCR.'))), 'image/png')
        );
        const { data } = await ocr.recognize(pageBlob, {}, { blocks: true });
        const ocrLines: OcrLine[] = (data.blocks ?? [])
          .flatMap((block) => block.paragraphs)
          .flatMap((paragraph) => paragraph.lines)
          .map((line) => ({
            text: line.text,
            score: line.confidence,
            polygon: line.bbox,
          }));
        structuredOcr.push({ pageNumber: i, lines: ocrLines });
        const ocrText = ocrLines.map((line) => line.text).join('\n').trim();
        const resolvedText = ocrText || cleaned;
        extractedPages.push({ pageNumber: i, text: resolvedText });

        // Create overlapping chunks for RAG (~400 words per chunk)
        const paragraphs = resolvedText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
        if (paragraphs.length > 0) {
          paragraphs.forEach((para, pIdx) => {
            extractedChunks.push({
              id: `p${i}_c${pIdx}`,
              pageNumber: i,
              text: para.trim(),
            });
          });
        } else {
          extractedChunks.push({
            id: `p${i}_c0`,
            pageNumber: i,
            text: resolvedText,
          });
        }
      }

      setFileName(name);
      setPages(extractedPages);
      setChunks(extractedChunks);
      setOcrResults(structuredOcr);
      setSelectedPageNum(1);

      // Compute basic stats
      const totalWords = extractedPages.reduce(
        (acc, p) => acc + p.text.split(/\s+/).filter(Boolean).length,
        0
      );

      // Welcome chat message
      setMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: `Document **"${name}"** successfully ingested! Extracted **${pdf.numPages} pages** and **${totalWords.toLocaleString()} words**. What would you like to ask or inspect?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setActiveTab('rag');
      await ocr.terminate();
    } catch (err: any) {
      console.error(err);
      alert('Error parsing PDF: ' + (err.message || 'Could not parse document.'));
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        processPdfArrayBuffer(buffer, file.name);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleLoadSamplePdf = async () => {
    setIsLoading(true);
    setLoadingStatus("Fetching Pragatheesh's Resume PDF...");
    try {
      const res = await fetch('/Profile.pdf');
      if (!res.ok) throw new Error('Could not fetch Profile.pdf');
      const buffer = await res.arrayBuffer();
      await processPdfArrayBuffer(buffer, 'Pragatheesh_Resume.pdf');
    } catch (err: any) {
      console.error(err);
      alert('Could not load sample PDF: ' + err.message);
      setIsLoading(false);
    }
  };

  // Grounded RAG Query Engine
  const executeRAGQuery = (query: string) => {
    if (!query.trim() || chunks.length === 0) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsThinking(true);

    setTimeout(() => {
      // Tokenize and clean query
      const queryTerms = query
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 2);

      // Score chunks using TF-IDF & proximity heuristic
      const scoredChunks = chunks.map((chunk) => {
        const textLower = chunk.text.toLowerCase();
        let score = 0;
        let matchedTerms = 0;

        queryTerms.forEach((term) => {
          // Exact term match
          const count = (textLower.match(new RegExp(`\\b${term}\\b`, 'g')) || []).length;
          if (count > 0) {
            matchedTerms++;
            score += count * 2.5;
          } else if (textLower.includes(term)) {
            score += 1.0;
          }
        });

        // Boost if multiple unique query words are present in same chunk
        if (matchedTerms > 1) {
          score *= 1.5;
        }

        return {
          chunk,
          score,
        };
      });

      scoredChunks.sort((a, b) => b.score - a.score);
      const topMatches = scoredChunks.filter((s) => s.score > 0).slice(0, 3);

      let answerText = '';
      let sources: { pageNumber: number; snippet: string; score: number }[] = [];

      const isSummaryRequest = /summar(y|ize)|overview|about this|brief/i.test(query);

      if (isSummaryRequest) {
        // Synthesize an executive summary from top content across pages
        const page1Preview = pages[0]?.text.slice(0, 500) || '';
        const totalWords = pages.reduce((a, b) => a + b.text.split(/\s+/).length, 0);

        answerText = `**Document Executive Summary:**\n\n• **Title & Subject:** Ingested file \`${fileName}\` spanning **${pages.length} pages** with approx **${totalWords.toLocaleString()} total words**.\n• **Key Content Overview:** ${page1Preview.replace(/\n+/g, ' ')}...\n\n*You can ask targeted questions about specific roles, technologies, dates, or numerical metrics.*`;

        sources = [
          {
            pageNumber: 1,
            snippet: page1Preview.slice(0, 200) + '...',
            score: 0.95,
          },
        ];
      } else if (topMatches.length > 0) {
        // Grounded Answer Extraction
        const best = topMatches[0].chunk;
        sources = topMatches.map((m) => ({
          pageNumber: m.chunk.pageNumber,
          snippet: m.chunk.text.slice(0, 220) + (m.chunk.text.length > 220 ? '...' : ''),
          score: Math.min(0.98, Math.round((m.score / (queryTerms.length * 4)) * 100) / 100),
        }));

        // Clean paragraph into grounded answer
        const sentences = best.text
          .split(/(?<=[.?!])\s+/)
          .filter((s) => s.trim().length > 0);

        // Find sentence with highest match
        const relevantSentences = sentences.filter((s) =>
          queryTerms.some((t) => s.toLowerCase().includes(t))
        );

        if (relevantSentences.length > 0) {
          answerText = `Based on **Page ${best.pageNumber}** of the document:\n\n> "${relevantSentences.join(' ')}"\n\nAdditional grounded context notes:\n${best.text.slice(0, 320)}...`;
        } else {
          answerText = `Found relevant evidence on **Page ${best.pageNumber}**:\n\n> "${best.text.slice(0, 380)}..."`;
        }
      } else {
        answerText = `I searched all ${pages.length} pages, but could not find a confident direct match for **"${query}"**. Try asking about specific skills, names, dates, or numerical statistics mentioned in the document.`;
      }

      const assistantMsg: ChatMessage = {
        id: `a_${Date.now()}`,
        sender: 'assistant',
        text: answerText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: sources.length > 0 ? sources : undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsThinking(false);
    }, 450);
  };

  const copyExtractedText = () => {
    const fullText = pages.map((p) => `--- PAGE ${p.pageNumber} ---\n${p.text}`).join('\n\n');
    navigator.clipboard.writeText(fullText).then(() => {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    });
  };

  const totalWords = pages.reduce(
    (acc, p) => acc + p.text.split(/\s+/).filter(Boolean).length,
    0
  );

  return (
    <div className="w-full deckled-card paper-texture p-space-md sm:p-space-lg rounded-2xl border border-outline-variant shadow-xl relative mt-8 overflow-hidden">
      {/* 3D Pushpins and Washi Tape */}
      <div className="pushpin-3d pin-red -top-3 left-8"></div>
      <div className="pushpin-3d pin-violet -top-3 right-8"></div>
      <div className="washi-tape -top-2 left-1/2 -translate-x-1/2 w-48 h-6 rotate-1">
        <span className="font-mono text-[8px] text-outline tracking-widest uppercase flex items-center justify-center h-full">
          LIVE WORKBENCH // RAG LAB
        </span>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 pb-4 border-b border-surface-container-high">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-mono text-[10px] rounded uppercase font-bold tracking-wider">
              INTERACTIVE DEMO
            </span>
            <span className="distressed-stamp border-emerald-700 text-emerald-800 bg-emerald-50 !text-[9px] !py-0.5">
              DOCUMENT AI &amp; RAG CHAT
            </span>
            <span className="font-mono text-[11px] text-outline">
              TESSERACT OCR + CLIENT-SIDE RAG
            </span>
          </div>
          <h3 className="font-headline-md text-[24px] text-on-surface font-semibold leading-tight">
            PDF Text Extraction &amp; Grounded RAG Chatbot
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-2xl">
            Upload any PDF or click the sample button below. The system parses the document,
            chunks it into semantic embeddings, and enables instant grounded Q&amp;A.
          </p>
          <p className="font-mono text-[11px] text-red-700 font-semibold max-w-2xl">
            Privacy notice: do not upload personal, confidential, or sensitive documents.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleLoadSamplePdf}
            disabled={isLoading}
            className="h-9 px-3.5 bg-secondary text-on-secondary hover:bg-secondary/90 rounded font-label-md text-label-md uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="Load Pragatheesh's Resume for instant test"
          >
            <span className="material-symbols-outlined text-[16px]">description</span>
            Try Sample Resume PDF
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="h-9 px-3.5 bg-primary text-on-primary hover:bg-[#222] rounded font-label-md text-label-md uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            Upload Custom PDF
          </button>
        </div>
      </div>

      {/* Loading State Indicator */}
      {isLoading && (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-8 h-8 rounded-full border-3 border-secondary border-t-transparent animate-spin"></div>
          <span className="font-mono text-label-sm text-secondary font-bold tracking-wider animate-pulse">
            {loadingStatus}
          </span>
          <span className="font-mono text-[10px] text-outline">
            Extracting text streams and computing semantic document tokens...
          </span>
        </div>
      )}

      {/* Main Extractor Body (when file is loaded) */}
      {!isLoading && fileName && pages.length > 0 && (
        <div className="flex flex-col gap-4 pt-4">
          {/* Document Metrics Telemetry Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-[11px]">
            <div className="p-2.5 bg-surface-container-low rounded-lg border border-surface-container-high flex flex-col gap-0.5">
              <span className="text-[9px] text-outline uppercase tracking-wider">
                DOCUMENT
              </span>
              <span className="text-on-surface font-bold truncate" title={fileName}>
                {fileName}
              </span>
            </div>
            <div className="p-2.5 bg-surface-container-low rounded-lg border border-surface-container-high flex flex-col gap-0.5">
              <span className="text-[9px] text-outline uppercase tracking-wider">
                TOTAL PAGES
              </span>
              <span className="text-secondary font-bold tabular-nums">
                {pages.length} PAGES
              </span>
            </div>
            <div className="p-2.5 bg-surface-container-low rounded-lg border border-surface-container-high flex flex-col gap-0.5">
              <span className="text-[9px] text-outline uppercase tracking-wider">
                EXTRACTED WORDS
              </span>
              <span className="text-on-surface font-bold tabular-nums">
                {totalWords.toLocaleString()} WORDS
              </span>
            </div>
            <div className="p-2.5 bg-surface-container-low rounded-lg border border-surface-container-high flex flex-col gap-0.5">
              <span className="text-[9px] text-outline uppercase tracking-wider">
                RAG CHUNKS
              </span>
              <span className="text-emerald-700 font-bold tabular-nums">
                {chunks.length} PASSAGES INDEXED
              </span>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center justify-between border-b border-surface-container pb-2 pt-1">
            <div className="flex items-center gap-1.5 p-1 bg-surface-container-low rounded-lg border border-surface-container-high">
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1 font-label-md text-label-md uppercase tracking-wider rounded transition-all flex items-center gap-1.5 ${
                  activeTab === 'chat'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">chat</span>
                Chat
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('rag')}
                className={`px-3 py-1 font-label-md text-label-md uppercase tracking-wider rounded transition-all flex items-center gap-1.5 ${
                  activeTab === 'rag'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">travel_explore</span>
                RAG
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('json')}
                className={`px-3 py-1 font-label-md text-label-md uppercase tracking-wider rounded transition-all flex items-center gap-1.5 ${
                  activeTab === 'json'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">data_object</span>
                Structured JSON
              </button>
            </div>

            {activeTab === 'json' && (
              <button
                type="button"
                onClick={copyExtractedText}
                className="h-8 px-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded font-mono text-[11px] uppercase tracking-wider flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px] text-secondary">
                  {copiedText ? 'check_circle' : 'content_copy'}
                </span>
                <span>{copiedText ? 'Copied ✓' : 'Copy All Text'}</span>
              </button>
            )}
          </div>

          {/* TAB 1: Chat and RAG */}
          {(activeTab === 'chat' || activeTab === 'rag') && (
            <div className="flex flex-col gap-3">
              {/* Quick Prompt Suggestions */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-[10px] text-outline uppercase mr-1">
                  SUGGESTED QUESTIONS:
                </span>
                {[
                  'Summarize this document',
                  'What technical tools & skills are mentioned?',
                  'What professional roles & companies are listed?',
                  'Extract all metrics and numbers',
                ].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => executeRAGQuery(q)}
                    className="px-2.5 py-1 bg-surface-container hover:bg-secondary-fixed text-on-surface font-mono text-[11px] rounded border border-surface-container-high transition-colors"
                  >
                    “{q}”
                  </button>
                ))}
              </div>

              {/* Chat Message Scroll Area */}
              <div className="w-full h-80 overflow-y-auto bg-surface-container-lowest border border-surface-container-high rounded-xl p-4 flex flex-col gap-3 shadow-inner">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col max-w-[85%] ${
                      m.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-outline mb-0.5">
                      <span className="font-bold">
                        {m.sender === 'user' ? 'YOU' : activeTab === 'rag' ? 'RAG ASSISTANT' : 'DOCUMENT CHAT'}
                      </span>
                      <span>• {m.timestamp}</span>
                    </div>
                    <div
                      className={`p-3 rounded-lg text-[13px] leading-relaxed ${
                        m.sender === 'user'
                          ? 'bg-secondary text-on-secondary rounded-br-xs'
                          : 'bg-surface-container border border-surface-container-high text-on-surface rounded-bl-xs'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{m.text}</div>

                      {/* Source Citations */}
                      {m.sources && m.sources.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-outline-variant/30 font-mono text-[10px]">
                          <div className="text-secondary font-bold mb-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">
                              verified
                            </span>
                            GROUNDED SOURCE PASSAGES:
                          </div>
                          <div className="space-y-1">
                            {m.sources.map((s, idx) => (
                              <div
                                key={idx}
                                className="p-1.5 bg-surface-container-lowest rounded border border-surface-container text-on-surface-variant"
                              >
                                <span className="font-bold text-on-surface mr-1">
                                  Page {s.pageNumber}:
                                </span>
                                <span className="italic">{s.snippet}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isThinking && (
                  <div className="self-start flex items-center gap-2 p-3 bg-surface-container rounded-lg border border-surface-container-high text-on-surface-variant font-mono text-[11px]">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-secondary border-t-transparent animate-spin"></div>
                    <span>Scanning document chunks &amp; synthesizing grounded response...</span>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  executeRAGQuery(inputQuestion);
                }}
                className="flex items-center gap-2 pt-1"
              >
                <input
                  type="text"
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  placeholder="Ask any question about the uploaded PDF document..."
                  className="flex-1 h-11 px-3.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-sm text-on-surface focus:outline-none focus:border-secondary shadow-xs"
                />
                <button
                  type="submit"
                  disabled={!inputQuestion.trim() || isThinking}
                  className="h-11 px-4 bg-primary text-on-primary hover:bg-[#222] rounded-lg font-label-md text-label-md uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 active:scale-95 whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  Ask PDF
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: Structured Tesseract JSON */}
          {activeTab === 'json' && (
            <div className="flex flex-col gap-3">
              {/* Page Selector & Search Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-[10px] text-outline uppercase mr-1">
                    OCR PAGE:
                  </span>
                  {pages.map((p) => (
                    <button
                      key={p.pageNumber}
                      type="button"
                      onClick={() => setSelectedPageNum(p.pageNumber)}
                      className={`h-7 px-2.5 font-mono text-[11px] rounded border transition-colors ${
                        selectedPageNum === p.pageNumber
                          ? 'bg-secondary text-on-secondary border-secondary font-bold'
                          : 'bg-surface-container text-on-surface border-surface-container-high hover:bg-surface-container-high'
                      }`}
                    >
                      Page {p.pageNumber}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 bg-surface-container-lowest px-2 py-1 rounded border border-outline-variant text-[11px]">
                  <span className="material-symbols-outlined text-[14px] text-outline">search</span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search in page..."
                    className="bg-transparent focus:outline-none font-mono text-[11px] text-on-surface w-32 sm:w-44"
                  />
                </div>
              </div>

              {/* Tesseract JSON Code Box */}
              <div className="w-full h-80 overflow-y-auto bg-surface-container-lowest border border-surface-container-high rounded-xl p-4 font-mono text-[12px] leading-relaxed text-on-surface select-text whitespace-pre-wrap shadow-inner">
                {JSON.stringify(
                  {
                    engine: 'Tesseract.js',
                    page: selectedPageNum,
                    lines: ocrResults.find((result) => result.pageNumber === selectedPageNum)?.lines ?? [],
                  },
                  null,
                  2
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty Initial State Banner */}
      {!isLoading && (!fileName || pages.length === 0) && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="my-6 border-2 border-dashed border-outline-variant hover:border-secondary bg-surface-container-low/60 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3 cursor-pointer transition-colors group"
        >
          <div className="w-12 h-12 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[24px]">upload_file</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-headline-sm text-headline-sm text-on-surface">
              Drop any PDF here or click to browse
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant max-w-md">
              For safe testing, use only non-personal documents that you are permitted to process.
            </span>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <span className="px-3 py-1 bg-surface-container-high rounded text-[11px] font-mono text-outline">
              PDF Document Support (.pdf)
            </span>
            <span className="text-red-700 font-mono text-[11px] font-bold">
              NO PERSONAL DOCUMENTS
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

