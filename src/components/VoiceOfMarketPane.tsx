import React, { useState, useEffect, useCallback, useRef } from "react";
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
import { 
  Users, 
  Target, 
  BarChart2, 
  Globe, 
  DollarSign, 
  UserCheck, 
  Compass, 
  GitMerge, 
  Lightbulb, 
  Handshake, 
  MoreHorizontal,
  Bookmark,
  FileText,
  Download,
  Maximize2,
  Play,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Loader2,
  AlertTriangle,
  Layers
} from "lucide-react";
import { API_URL } from "../constants";

interface VoiceOfMarketPaneProps {
  onReturn?: () => void;
  clientId?: string;
  userId?: string;
}

interface CategoryItem {
  id: string;
  name: string;
  sort_order: number;
  count: number;
}

interface AttachmentItem {
  id: string;
  attachment_type: "pdf" | "slide" | "image" | "video_link";
  file_url?: string;
  file_name?: string;
  sort_order: number;
  url?: string;
}

interface PostItem {
  id: string;
  category_id: string;
  category_name: string;
  title: string;
  body: string;
  published_at: string;
  published_day: string;
  attachments?: AttachmentItem[];
}

function getCategoryIcon(nameOrId: string) {
  const s = (nameOrId || "").toLowerCase();
  if (s.includes("customer") || s.includes("client")) return Users;
  if (s.includes("compet") || s.includes("target")) return Target;
  if (s.includes("market") || s.includes("dynamic")) return BarChart2;
  if (s.includes("industry") || s.includes("global") || s.includes("development")) return Globe;
  if (s.includes("fund") || s.includes("invest") || s.includes("capital") || s.includes("dollar")) return DollarSign;
  if (s.includes("lead") || s.includes("hire") || s.includes("talent")) return UserCheck;
  if (s.includes("expans") || s.includes("business") || s.includes("compass")) return Compass;
  if (s.includes("merger") || s.includes("acquis") || s.includes("git")) return GitMerge;
  if (s.includes("product") || s.includes("innov") || s.includes("light")) return Lightbulb;
  if (s.includes("partner") || s.includes("handshake")) return Handshake;
  return MoreHorizontal;
}

function formatGroupHeader(publishedDay: string) {
  if (!publishedDay) return "TODAY";
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
    const todayStr = formatter.format(now);

    const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = formatter.format(yesterdayDate);

    const dayStr = publishedDay.split('T')[0];

    const displayDateObj = new Date(publishedDay);
    const displayDateStr = !isNaN(displayDateObj.getTime())
      ? displayDateObj.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
      : publishedDay.toUpperCase();

    if (dayStr === todayStr) {
      return `TODAY ${displayDateStr}`;
    } else if (dayStr === yesterdayStr) {
      return `YESTERDAY ${displayDateStr}`;
    } else {
      return displayDateStr;
    }
  } catch {
    return publishedDay.toUpperCase();
  }
}

function getEmbedVideoUrl(rawUrl: string) {
  if (!rawUrl) return null;
  const ytMatch = rawUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }
  const vimeoMatch = rawUrl.match(/(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?))/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  return null;
}

function SlideCarousel({ slides }: { slides: AttachmentItem[] }) {
  const [index, setIndex] = useState(0);
  if (!slides || slides.length === 0) return null;
  const current = slides[index];
  const slideUrl = current.url || current.file_url;

  return (
    <div className="w-full border border-zinc-200 rounded-[4px] overflow-hidden bg-white shadow-xs">
      <div className="relative w-full h-[300px] sm:h-[425px] bg-zinc-950 flex items-center justify-center overflow-hidden">
        {/* Top-left semi-transparent badge */}
        <div className="absolute top-3 left-3 z-20">
          <span className="text-[10.5px] font-semibold bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded text-white border border-white/20">
            Slide {index + 1} of {slides.length}
          </span>
        </div>

        {slideUrl ? (
          <img 
            src={slideUrl} 
            alt={current.file_name || `Slide ${index + 1}`} 
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-zinc-400 text-xs">Slide content unavailable</div>
        )}
      </div>

      <div className="h-11 bg-zinc-50 border-t border-zinc-200 px-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setIndex(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                index === idx ? "w-6 bg-[#2563eb]" : "w-2 bg-zinc-300 hover:bg-zinc-400"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIndex(i => (i === 0 ? slides.length - 1 : i - 1))}
            className="p-1 rounded hover:bg-zinc-200/80 text-zinc-600 transition-colors cursor-pointer"
            title="Previous Slide"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setIndex(i => (i === slides.length - 1 ? 0 : i + 1))}
            className="p-1 rounded hover:bg-zinc-200/80 text-zinc-600 transition-colors cursor-pointer"
            title="Next Slide"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PdfViewer({ file, onLinkError }: { file: AttachmentItem; onLinkError?: () => void }) {
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const pdfUrl = file.url || file.file_url;
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const onLinkErrorRef = useRef(onLinkError);
  useEffect(() => {
    onLinkErrorRef.current = onLinkError;
  }, [onLinkError]);

  const hasReloadedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    if (!pdfUrl) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setPageNum(1);
    setNumPages(0);

    async function loadPdf() {
      try {
        const res = await fetch(pdfUrl, { credentials: 'omit' });
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        const arrayBuffer = await res.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const doc = await loadingTask.promise;

        if (!isMounted) return;
        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load PDF with pdfjs:", err);
        if (!isMounted) return;
        setIsLoading(false);
        setHasError(true);
        if (onLinkErrorRef.current && !hasReloadedRef.current) {
          hasReloadedRef.current = true;
          onLinkErrorRef.current();
        }
      }
    }

    loadPdf();

    return () => {
      isMounted = false;
      pdfDocRef.current = null;
    };
  }, [pdfUrl]);

  useEffect(() => {
    let isMounted = true;

    async function renderPage() {
      const doc = pdfDocRef.current;
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!doc || !canvas || !container || numPages === 0) return;

      try {
        const page = await doc.getPage(pageNum);
        if (!isMounted) return;

        const containerWidth = container.clientWidth || 600;
        const availableWidth = containerWidth - 24 - 16;
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const scale = availableWidth / unscaledViewport.width;
        const viewport = page.getViewport({ scale: Math.max(scale, 0.3) });

        const context = canvas.getContext('2d');
        if (!context) return;

        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(outputScale, 0, 0, outputScale, 0, 0);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.error("Error rendering PDF page:", err);
      }
    }

    renderPage();

    return () => {
      isMounted = false;
    };
  }, [pageNum, numPages]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [pageNum, isLoading]);

  return (
    <div className="w-full border border-zinc-300 rounded-[4px] overflow-hidden bg-zinc-900 text-white font-sans shadow-sm">
      <div className="h-9 bg-zinc-900 px-3 flex items-center justify-between border-b border-zinc-800 text-[11px]">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <FileText className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="font-medium text-zinc-200 truncate max-w-[180px] sm:max-w-xs">
            {file.file_name || "Document.pdf"}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {!isLoading && !hasError && numPages > 0 && (
            <div className="flex items-center gap-1.5 text-zinc-400 text-[10.5px]">
              <button 
                onClick={() => setPageNum(p => Math.max(1, p - 1))}
                disabled={pageNum <= 1}
                className="px-1.5 py-0.5 hover:bg-zinc-800 rounded text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Previous Page"
              >
                ‹
              </button>
              <span>Page {pageNum} of {numPages}</span>
              <button 
                onClick={() => setPageNum(p => Math.min(numPages, p + 1))}
                disabled={pageNum >= numPages}
                className="px-1.5 py-0.5 hover:bg-zinc-800 rounded text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Next Page"
              >
                ›
              </button>
            </div>
          )}

          <div className="h-3.5 w-px bg-zinc-700 hidden sm:block"></div>

          <div className="flex items-center gap-1.5">
            {pdfUrl && (
              <>
                <a href={pdfUrl} download={file.file_name || "document.pdf"} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white cursor-pointer" title="Download PDF">
                  <Download className="w-3.5 h-3.5" />
                </a>
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white cursor-pointer" title="Expand View">
                  <Maximize2 className="w-3.5 h-3.5" />
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      <div 
        ref={containerRef}
        className={`bg-zinc-100 h-[420px] overflow-y-auto overflow-x-hidden relative p-3 flex flex-col ${
          isLoading || hasError ? "items-center justify-center" : "items-start justify-start"
        }`}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-2 py-20 text-zinc-600 my-auto mx-auto">
            <Loader2 className="w-6 h-6 animate-spin text-[#2d39d2]" />
            <span className="text-xs font-medium">Loading PDF...</span>
          </div>
        ) : hasError ? (
          <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center text-zinc-700 my-auto mx-auto">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-[13px] font-semibold text-zinc-900">{file.file_name || "Document.pdf"}</p>
              <p className="text-[11.5px] text-zinc-500">Unable to preview PDF document. You can open or download it below.</p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              {pdfUrl && (
                <>
                  <a 
                    href={pdfUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-[#2d39d2] hover:bg-[#242ea8] text-white rounded-[4px] text-xs font-medium transition-colors cursor-pointer"
                  >
                    Open PDF
                  </a>
                  <a 
                    href={pdfUrl} 
                    download={file.file_name || "document.pdf"}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-[4px] text-xs font-medium transition-colors cursor-pointer"
                  >
                    Download
                  </a>
                </>
              )}
            </div>
          </div>
        ) : (
          <canvas ref={canvasRef} className="shadow-sm bg-white rounded-[2px] mx-auto max-w-full" />
        )}
      </div>
    </div>
  );
}

function VideoPlayer({ file }: { file: AttachmentItem }) {
  const link = file.file_url || file.url || "";
  const embedUrl = getEmbedVideoUrl(link);

  if (embedUrl) {
    return (
      <div className="w-full h-[360px] sm:h-[420px] rounded-[4px] overflow-hidden relative bg-zinc-950 border border-zinc-800 shadow-sm">
        <iframe 
          src={embedUrl} 
          className="w-full h-full border-0" 
          title={file.file_name || "Video"} 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="w-full p-6 rounded-[4px] bg-zinc-900 text-white flex flex-col items-center justify-center space-y-4 border border-zinc-800">
      <div className="flex items-center gap-2 text-zinc-300">
        <Play className="w-8 h-8 text-[#2d39d2] fill-[#2d39d2]" />
        <span className="font-medium text-sm truncate max-w-md">{file.file_name || "Video Briefing"}</span>
      </div>
      {link ? (
        <a 
          href={link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-4 py-2 bg-[#2d39d2] hover:bg-[#242ea8] text-white rounded-[4px] text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer"
        >
          <span>Watch video</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      ) : (
        <span className="text-zinc-500 text-xs">Video link unavailable</span>
      )}
    </div>
  );
}

export default function VoiceOfMarketPane({ onReturn, clientId }: VoiceOfMarketPaneProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [allCategories, setAllCategories] = useState<CategoryItem[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string | null>(null); // null means All
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [hasReloaded, setHasReloaded] = useState(false);

  const fetchPosts = useCallback(async (isRetry = false) => {
    if (!clientId) {
      setIsLoading(false);
      setErrorMessage("No client ID configured.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      let url = `${API_URL}/voice-of-market/posts/${clientId}`;
      if (activeCategory) {
        url += `?categoryId=${encodeURIComponent(activeCategory)}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch Voice of Market posts (${res.status})`);
      }

      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || "Failed to load Voice of Market data.");
      }

      setCategories(data.categories || []);
      if (!activeCategory && data.categories) {
        setAllCategories(data.categories);
      }
      if (allCategories.length === 0 && data.categories && data.categories.length > 0) {
        setAllCategories(data.categories);
      }
      setPosts(data.posts || []);
      setTotalPosts(data.total || 0);
    } catch (err: any) {
      console.error("Voice of Market fetch error:", err);
      setErrorMessage(err.message || "Unable to load Voice of Market posts. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [clientId, activeCategory]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // If a file link fails (e.g. expired link), reload posts once automatically
  const handleLinkExpiredOrError = () => {
    if (!hasReloaded) {
      setHasReloaded(true);
      fetchPosts(true);
    }
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Group posts by published_day
  const groupedPosts = React.useMemo(() => {
    const groups: { dayKey: string; headerLabel: string; items: PostItem[] }[] = [];
    const map = new Map<string, PostItem[]>();

    posts.forEach(post => {
      const dayKey = post.published_day || post.published_at?.split('T')[0] || "Recent";
      if (!map.has(dayKey)) {
        map.set(dayKey, []);
      }
      map.get(dayKey)!.push(post);
    });

    map.forEach((items, dayKey) => {
      groups.push({
        dayKey,
        headerLabel: formatGroupHeader(dayKey),
        items: items
      });
    });

    return groups;
  }, [posts]);

  return (
    <div className="flex-1 h-full flex bg-white overflow-hidden relative justify-center select-none">
      <div className="w-full max-w-[1178px] mx-auto h-full flex flex-col bg-white flex-shrink-0 animate-fade-in border-x border-zinc-200 overflow-hidden">
        {/* Header Section */}
        <div className="h-[53px] px-4 border-b border-zinc-100 flex items-center justify-between flex-shrink-0 bg-white">
          <div className="flex items-center gap-4">
            <h2 
              style={{ fontFamily: "'Source Serif 4', Georgia, Cambria, 'Times New Roman', Times, serif" }}
              className="text-[19px] font-semibold tracking-tight text-zinc-900 select-none font-serif-source"
            >
              Voice of Market
            </h2>
          </div>
          {totalPosts > 0 && (
            <span className="text-[11.5px] text-zinc-500 font-medium">
              {totalPosts} {totalPosts === 1 ? 'post' : 'posts'} available
            </span>
          )}
        </div>

        {/* Main content divided in 20% - 80% ratio */}
        <div className="flex-1 flex w-full overflow-hidden">
          {/* 20% Sidebar Pane with Categories */}
          <div className="w-[20%] h-full border-r border-zinc-200 bg-white flex flex-col overflow-y-auto py-1.5 shrink-0">
            <div className="px-3 py-1.5 text-[12.5px] font-medium text-zinc-500 tracking-tight">
              Categories
            </div>

            <div className="flex flex-col gap-[2px] px-1.5">
              {/* All Option */}
              {(() => {
                const allCategoriesCount = (allCategories.length > 0 ? allCategories : categories).reduce((acc, cat) => acc + (cat.count || 0), 0);
                return (
                  <button
                    onClick={() => setActiveCategory(null)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-[5px] transition-all cursor-pointer text-left select-none group ${
                      activeCategory === null 
                        ? "bg-[#eef1fe] text-[#2d39d2] font-medium" 
                        : "hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 font-normal"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-1">
                      <Layers className={`w-3.5 h-3.5 shrink-0 transition-colors ${activeCategory === null ? "text-[#2d39d2]" : "text-zinc-500 group-hover:text-zinc-700"}`} />
                      <span className="text-[11.5px] leading-tight truncate">All Categories</span>
                    </div>
                    <span className={`text-[11px] font-normal ${activeCategory === null ? "text-[#2d39d2]/80" : "text-zinc-400"}`}>
                      {allCategoriesCount}
                    </span>
                  </button>
                );
              })()}

              {categories.map((cat) => {
                const IconComponent = getCategoryIcon(cat.name);
                const isActive = activeCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(isActive ? null : cat.id)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-[5px] transition-all cursor-pointer text-left select-none group ${
                      isActive 
                        ? "bg-[#eef1fe] text-[#2d39d2] font-medium" 
                        : "hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 font-normal"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-1">
                      <IconComponent 
                        className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                          isActive ? "text-[#2d39d2]" : "text-zinc-500 group-hover:text-zinc-700"
                        }`} 
                      />
                      <span className="text-[11.5px] leading-tight truncate">{cat.name}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`text-[11px] font-normal ${isActive ? "text-[#2d39d2]/80" : "text-zinc-400"}`}>
                        {cat.count}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 80% Main Content Market Intelligence Feed */}
          <div className="w-[80%] h-full bg-[#fafafa] flex flex-col overflow-y-auto p-6 md:p-8 space-y-8 select-text">
            {isLoading ? (
              <div className="w-full h-96 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-7 h-7 animate-spin text-[#2d39d2]" />
                <p className="text-zinc-500 text-[12.5px]">Loading Voice of Market insights...</p>
              </div>
            ) : errorMessage ? (
              <div className="w-full p-8 bg-rose-50 border border-rose-200 rounded-[6px] text-rose-800 flex flex-col items-center text-center space-y-3 my-auto">
                <AlertTriangle className="w-8 h-8 text-rose-600" />
                <p className="text-[13.5px] font-medium">{errorMessage}</p>
                <button 
                  onClick={() => fetchPosts()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-[4px] text-xs font-medium transition-colors cursor-pointer"
                >
                  Retry Loading
                </button>
              </div>
            ) : posts.length === 0 ? (
              <div className="w-full h-96 flex flex-col items-center justify-center space-y-2 text-zinc-400 my-auto">
                <FileText className="w-10 h-10 stroke-1" />
                <p className="text-[14px] font-medium text-zinc-700">No posts yet</p>
                <p className="text-[12px] text-zinc-500">There are no market insights available for this selection.</p>
              </div>
            ) : (
              groupedPosts.map((group) => (
                <div key={group.dayKey} className="flex flex-col gap-4 w-full">
                  <div className="flex items-center px-0.5">
                    <span className="text-[7.8px] font-bold text-black uppercase tracking-wider">
                      {group.headerLabel}
                    </span>
                  </div>

                  {group.items.map((post) => {
                    const isBookmarked = bookmarkedIds.has(post.id);

                    // Sort attachments by sort_order
                    const sortedAttachments = [...(post.attachments || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

                    // Group consecutive slide attachments into ONE carousel
                    const renderedContentNodes: React.ReactNode[] = [];
                    let slideBuffer: AttachmentItem[] = [];

                    const flushSlideBuffer = () => {
                      if (slideBuffer.length > 0) {
                        renderedContentNodes.push(
                          <SlideCarousel key={`carousel-${slideBuffer[0].id}`} slides={[...slideBuffer]} />
                        );
                        slideBuffer = [];
                      }
                    };

                    sortedAttachments.forEach((file) => {
                      if (file.attachment_type === "slide") {
                        slideBuffer.push(file);
                      } else {
                        flushSlideBuffer();
                        if (file.attachment_type === "pdf") {
                          renderedContentNodes.push(<PdfViewer key={`pdf-${file.id}`} file={file} onLinkError={handleLinkExpiredOrError} />);
                        } else if (file.attachment_type === "video_link") {
                          renderedContentNodes.push(<VideoPlayer key={`video-${file.id}`} file={file} />);
                        } else if (file.attachment_type === "image") {
                          const imgUrl = file.url || file.file_url;
                          renderedContentNodes.push(
                            <div key={`img-${file.id}`} className="w-full rounded-[4px] overflow-hidden bg-zinc-100 border border-zinc-200">
                              <img 
                                src={imgUrl} 
                                alt={file.file_name || "Attachment"} 
                                className="w-full h-auto object-cover max-h-[480px]"
                                onError={handleLinkExpiredOrError}
                              />
                            </div>
                          );
                        }
                      }
                    });
                    flushSlideBuffer();

                    return (
                      <div 
                        key={post.id}
                        style={{ fontWeight: 350 }} 
                        className="bg-white border border-zinc-200/90 rounded-[4px] p-6 shadow-2xs space-y-4 text-zinc-800 text-[12.5px] leading-relaxed font-sans relative"
                      >
                        {/* Header Row: Tag & Bookmark Icon */}
                        <div className="flex items-center justify-between w-full">
                          <span className="px-2 py-0.5 rounded-[4px] bg-blue-50 text-[#2d39d2] text-[10px] font-medium border border-blue-100/80">
                            {post.category_name || "Market Intelligence"}
                          </span>
                          <button 
                            onClick={() => toggleBookmark(post.id)}
                            className="p-1 text-zinc-400 hover:text-[#2d39d2] transition-colors rounded-[4px] hover:bg-zinc-100 cursor-pointer"
                            title="Bookmark note"
                          >
                            <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-[#2d39d2] text-[#2d39d2]" : ""}`} />
                          </button>
                        </div>

                        {post.title && (
                          <h3 className="text-[17px] font-bold text-zinc-900 tracking-tight">
                            {post.title}
                          </h3>
                        )}

                        {/* Attachments */}
                        {renderedContentNodes.length > 0 && (
                          <div className="space-y-4 pb-2">
                            {renderedContentNodes}
                          </div>
                        )}

                        {/* Post HTML Body */}
                        {post.body && (
                          <div 
                            className="vom-content-view text-zinc-800"
                            dangerouslySetInnerHTML={{ __html: post.body }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
