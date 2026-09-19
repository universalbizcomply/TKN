import React, { useState, useEffect, useMemo } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MapPin, 
  Tag, 
  CheckCircle2, 
  Play, 
  Search, 
  Camera, 
  Video, 
  Plus, 
  X, 
  Sparkles, 
  ArrowUpRight,
  RefreshCw,
  Eye
} from 'lucide-react';
import { SocialFeedPost, SocialPlatform, SocialFeedCategory, ProductItem } from '../types';
import { api } from '../lib/api';

interface ArchiveSocialFeedProps {
  products?: ProductItem[];
  onOpenStudio?: (product: ProductItem) => void;
  onToast?: (message: string) => void;
}

export const ArchiveSocialFeed: React.FC<ArchiveSocialFeedProps> = ({
  products = [],
  onOpenStudio,
  onToast = () => {},
}) => {
  const [posts, setPosts] = useState<SocialFeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState<SocialPlatform | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<SocialFeedCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalPost, setActiveModalPost] = useState<SocialFeedPost | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());

  // Submit Fit Pic form state
  const [newHandle, setNewHandle] = useState('');
  const [newPlatform, setNewPlatform] = useState<SocialPlatform>('instagram');
  const [newCategory, setNewCategory] = useState<'fit-pic' | 'bts' | 'community'>('fit-pic');
  const [newCaption, setNewCaption] = useState('');
  const [newLocation, setNewLocation] = useState('London, UK');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [newMediaPreset, setNewMediaPreset] = useState<string>(
    'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&auto=format&fit=crop&q=80'
  );

  // Load feed from API
  const fetchFeed = async () => {
    setLoading(true);
    try {
      const res = await api.getSocialFeed({
        platform: platformFilter,
        category: categoryFilter,
        search: searchQuery,
      });
      if (res.success) {
        setPosts(res.posts);
        // Track pre-liked posts
        const liked = new Set<string>();
        res.posts.forEach((p) => {
          if (p.hasLiked) liked.add(p.id);
        });
        setLikedPostIds(liked);
      }
    } catch (e) {
      console.error('Error fetching social feed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [platformFilter, categoryFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFeed();
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle like toggle
  const handleLike = async (post: SocialFeedPost, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const postId = post.id;
    const isLiked = likedPostIds.has(postId);

    // Optimistic UI update
    setLikedPostIds((prev) => {
      const next = new Set(prev);
      if (isLiked) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            likes: isLiked ? Math.max(0, p.likes - 1) : p.likes + 1,
            hasLiked: !isLiked,
          };
        }
        return p;
      })
    );

    if (activeModalPost && activeModalPost.id === postId) {
      setActiveModalPost((prev) =>
        prev
          ? {
              ...prev,
              likes: isLiked ? Math.max(0, prev.likes - 1) : prev.likes + 1,
              hasLiked: !isLiked,
            }
          : null
      );
    }

    try {
      const res = await api.likeSocialPost(postId);
      if (res.success && res.message) {
        onToast(res.message);
      }
    } catch (err) {
      console.error('Failed to like post', err);
    }
  };

  // Handle share click
  const handleShare = (post: SocialFeedPost, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const text = `Check out ${post.authorHandle}'s fit on TO KNOW NOTHING ARCHIVE: ${post.caption.slice(0, 50)}...`;
    navigator.clipboard?.writeText(window.location.href);
    onToast('ARCHIVE BROADCAST LINK COPIED [CLIPBOARD]');
  };

  // Inspect tagged garment
  const handleInspectGarment = (post: SocialFeedPost, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!post.taggedGarment) return;

    const matched = products.find(
      (p) =>
        p.id === post.taggedGarment?.productId ||
        p.title.toLowerCase() === post.taggedGarment?.productTitle.toLowerCase() ||
        post.taggedGarment?.productTitle.toLowerCase().includes(p.title.toLowerCase())
    );

    if (matched && onOpenStudio) {
      onOpenStudio(matched);
      onToast(`OPENED STUDIO: ${matched.title}`);
    } else {
      onToast(`ARCHIVE PIECE: ${post.taggedGarment.productTitle} (${post.taggedGarment.gsm || 'HEAVYWEIGHT'})`);
    }
  };

  // Handle community submission
  const handleSubmitFitPic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHandle.trim() || !newCaption.trim()) {
      onToast('PLEASE ENTER YOUR HANDLE & CAPTION');
      return;
    }

    setIsSubmitting(true);
    try {
      const taggedProduct = products.find((p) => p.id === selectedProductId);
      const res = await api.submitCommunityFitPic({
        platform: newPlatform,
        authorHandle: newHandle,
        caption: newCaption,
        location: newLocation,
        category: newCategory,
        mediaUrl: newMediaPreset,
        taggedGarment: taggedProduct
          ? {
              productId: taggedProduct.id,
              productTitle: taggedProduct.title,
              gsm: taggedProduct.gsm,
              price: taggedProduct.price,
            }
          : undefined,
      });

      if (res.success) {
        onToast('FIT PIC BROADCAST POSTED TO ARCHIVE FEED!');
        setIsSubmitModalOpen(false);
        setNewHandle('');
        setNewCaption('');
        fetchFeed();
      } else {
        onToast(res.message || 'SUBMISSION FAILED');
      }
    } catch (err) {
      onToast('NETWORK ERROR SUBMITTING FIT PIC');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="archiveSocialFeedSection" className="pt-2 pb-10">
      {/* 1. Masking Tape Header & Aesthetic Broadcaster Banner */}
      <div className="relative bg-[#feef89] border-2 border-black p-3 sm:p-4 shadow-[4px_4px_0px_#000000] mb-6 transform -rotate-0.5">
        {/* Jagged Tape ends */}
        <div className="absolute -top-3 left-8 w-24 h-4 masking-tape serrated-tape z-10 opacity-95 pointer-events-none" />
        <div className="absolute -bottom-3 right-8 w-24 h-4 masking-tape serrated-tape z-10 opacity-95 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-black text-white text-[9px] font-mono-tag font-bold px-1.5 py-0.5 tracking-widest uppercase inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                LIVE RELAY // COMMUNITY & STUDIO
              </span>
              <span className="bg-white text-black border border-black text-[9px] font-mono-tag font-extrabold px-1.5 py-0.5 uppercase shadow-xs">
                INSTAGRAM & TIKTOK ARCHIVE
              </span>
            </div>
            <h2 className="font-marker text-xl sm:text-2xl text-black tracking-wide leading-tight">
              ARCHIVE SOCIAL FEED
            </h2>
            <p className="font-typewriter text-xs text-neutral-800 italic mt-0.5">
              Live fit checks, high-density drape tests, and behind-the-scenes studio screenprinting from the London collective.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="bg-black text-yellow-300 hover:bg-neutral-800 border-2 border-black font-mono-tag font-black text-xs px-3 py-1.5 uppercase shadow-[2px_2px_0px_#000000] active:translate-y-0.5 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>SUBMIT FIT PIC</span>
            </button>

            <button
              onClick={fetchFeed}
              title="Refresh live social feed"
              className="bg-white hover:bg-neutral-100 text-black border-2 border-black p-1.5 shadow-[2px_2px_0px_#000000] active:translate-y-0.5 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-4 pt-3 border-t-2 border-dashed border-black/60 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Platform Toggle Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <span className="font-mono-tag text-[9px] font-black uppercase text-neutral-700 mr-1 shrink-0">
              PLATFORM:
            </span>
            <button
              onClick={() => setPlatformFilter('all')}
              className={`px-2.5 py-1 text-[10px] font-mono-tag font-black uppercase border border-black transition-all cursor-pointer ${
                platformFilter === 'all'
                  ? 'bg-black text-yellow-300 shadow-[2px_2px_0px_#000000]'
                  : 'bg-white text-black hover:bg-neutral-100'
              }`}
            >
              ALL ({posts.length})
            </button>
            <button
              onClick={() => setPlatformFilter('instagram')}
              className={`px-2.5 py-1 text-[10px] font-mono-tag font-black uppercase border border-black transition-all cursor-pointer flex items-center gap-1 ${
                platformFilter === 'instagram'
                  ? 'bg-gradient-to-r from-purple-700 via-pink-600 to-yellow-500 text-white shadow-[2px_2px_0px_#000000]'
                  : 'bg-white text-black hover:bg-neutral-100'
              }`}
            >
              <Camera className="w-3 h-3" />
              <span>INSTAGRAM</span>
            </button>
            <button
              onClick={() => setPlatformFilter('tiktok')}
              className={`px-2.5 py-1 text-[10px] font-mono-tag font-black uppercase border border-black transition-all cursor-pointer flex items-center gap-1 ${
                platformFilter === 'tiktok'
                  ? 'bg-black text-cyan-300 shadow-[2px_2px_0px_#ff0050]'
                  : 'bg-white text-black hover:bg-neutral-100'
              }`}
            >
              <Video className="w-3 h-3" />
              <span>TIKTOK</span>
            </button>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <span className="font-mono-tag text-[9px] font-black uppercase text-neutral-700 mr-1 shrink-0">
              CONTENT:
            </span>
            {(['all', 'fit-pic', 'bts', 'community'] as SocialFeedCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2 py-0.5 text-[9px] font-mono-tag font-bold uppercase border border-black transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-black text-white shadow-[1px_1px_0px_#000000]'
                    : 'bg-white/90 text-neutral-800 hover:bg-white'
                }`}
              >
                {cat === 'all'
                  ? 'ALL TAGS'
                  : cat === 'fit-pic'
                  ? 'FIT PICS 📸'
                  : cat === 'bts'
                  ? 'STUDIO BTS ✂️'
                  : 'COMMUNITY WEAR 🛹'}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter @handle, piece, or tag..."
              className="w-full pl-8 pr-7 py-1 text-[11px] font-mono-tag bg-white border border-black focus:outline-none focus:ring-1 focus:ring-black shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black text-xs font-mono font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Responsive Grid of Social Posts */}
      {loading && posts.length === 0 ? (
        <div className="py-16 text-center bg-white/80 border-2 border-dashed border-black max-w-md mx-auto my-6 p-6 shadow-[3px_3px_0px_#000000]">
          <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-black" />
          <p className="font-marker text-sm tracking-wide uppercase">
            CONNECTING TO LONDON ARCHIVE BROADCASTS...
          </p>
          <p className="font-mono-tag text-[10px] text-neutral-600 mt-1">
            Aggregating Instagram feed & TikTok video reels
          </p>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-12 text-center bg-white border-2 border-black max-w-md mx-auto my-6 p-6 shadow-[3px_3px_0px_#000000]">
          <p className="font-marker text-base uppercase text-black">
            NO SOCIAL BROADCASTS FOUND
          </p>
          <p className="font-mono-tag text-xs text-neutral-600 mt-1">
            Try resetting your filters or be the first to broadcast a fit pic!
          </p>
          <button
            onClick={() => {
              setPlatformFilter('all');
              setCategoryFilter('all');
              setSearchQuery('');
            }}
            className="mt-3 bg-black text-yellow-300 font-mono-tag font-bold text-xs px-3 py-1 border border-black uppercase cursor-pointer"
          >
            RESET SOCIAL FILTERS
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 items-start">
          {posts.map((post, idx) => {
            const isLiked = likedPostIds.has(post.id);
            const rotationDegree = idx % 2 === 0 ? '-rotate-0.5' : 'rotate-0.5';

            return (
              <article
                key={post.id}
                onClick={() => setActiveModalPost(post)}
                className={`group bg-white border-2 border-black shadow-[4px_4px_0px_#000000] hover:shadow-[6px_6px_0px_#000000] transition-all transform ${rotationDegree} hover:rotate-0 hover:-translate-y-1 cursor-pointer flex flex-col relative`}
              >
                {/* Masking tape strip on top edge */}
                <div
                  className={`absolute -top-2.5 ${
                    idx % 2 === 0 ? 'left-4' : 'right-4'
                  } w-16 h-3 masking-tape serrated-tape z-20 opacity-90 pointer-events-none`}
                />

                {/* Card Top: Author Bar */}
                <div className="p-2.5 pb-2 flex items-center justify-between border-b border-neutral-200 bg-neutral-50">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={post.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
                      alt={post.authorName}
                      className="w-6 h-6 rounded-full border border-black object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 leading-none">
                        <span className="font-headline font-black text-xs truncate">
                          {post.authorHandle}
                        </span>
                        {post.isVerified && (
                          <CheckCircle2 className="w-3 h-3 text-blue-500 fill-blue-500 shrink-0" />
                        )}
                      </div>
                      {post.location && (
                        <span className="font-mono-tag text-[8px] text-neutral-500 flex items-center gap-0.5 truncate mt-0.5">
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          {post.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Platform indicator badge */}
                  {post.platform === 'instagram' ? (
                    <span className="bg-gradient-to-tr from-yellow-500 via-pink-600 to-purple-700 text-white text-[8px] font-mono-tag font-bold px-1.5 py-0.5 border border-black shadow-2xs uppercase shrink-0 flex items-center gap-0.5">
                      <Camera className="w-2.5 h-2.5" />
                      <span>IG</span>
                    </span>
                  ) : (
                    <span className="bg-black text-cyan-300 text-[8px] font-mono-tag font-bold px-1.5 py-0.5 border border-black shadow-2xs uppercase shrink-0 flex items-center gap-0.5">
                      <Video className="w-2.5 h-2.5 text-pink-400" />
                      <span>TIKTOK</span>
                    </span>
                  )}
                </div>

                {/* Media Presentation Window (Polaroid/Reel Frame) */}
                <div className="relative bg-black aspect-square sm:aspect-[4/5] overflow-hidden">
                  <img
                    src={post.mediaUrl}
                    alt={post.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Video indicator overlay */}
                  {post.mediaType === 'video' && (
                    <div className="absolute top-2 left-2 bg-black/85 text-white border border-white/40 text-[9px] font-mono-tag px-1.5 py-0.5 flex items-center gap-1 backdrop-blur-xs">
                      <Play className="w-2.5 h-2.5 fill-white" />
                      <span>{post.videoDuration || 'REEL'}</span>
                    </div>
                  )}

                  {/* Category Pill on image */}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`text-[8px] font-mono-tag font-black px-1.5 py-0.5 uppercase border border-black shadow-xs ${
                        post.category === 'fit-pic'
                          ? 'bg-[#feef89] text-black'
                          : post.category === 'bts'
                          ? 'bg-[#ff7e67] text-black'
                          : 'bg-white text-black'
                      }`}
                    >
                      {post.category === 'fit-pic'
                        ? 'FIT CHECK'
                        : post.category === 'bts'
                        ? 'STUDIO BTS'
                        : 'COMMUNITY'}
                    </span>
                  </div>

                  {/* Tagged Garment Quick Overlay */}
                  {post.taggedGarment && (
                    <div
                      onClick={(e) => handleInspectGarment(post, e)}
                      className="absolute bottom-2 left-2 right-2 bg-white/95 border border-black p-1.5 shadow-[2px_2px_0px_#000000] hover:bg-yellow-200 transition-colors flex items-center justify-between"
                      title="Click to view garment in studio"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Tag className="w-3 h-3 text-black shrink-0" />
                        <span className="font-headline font-black text-[10px] truncate uppercase">
                          {post.taggedGarment.productTitle}
                        </span>
                        {post.taggedGarment.gsm && (
                          <span className="bg-black text-yellow-300 font-mono-tag text-[8px] font-bold px-1 shrink-0">
                            {post.taggedGarment.gsm}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-mono-tag font-bold text-neutral-800 flex items-center shrink-0">
                        VIEW ➔
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Bottom: Caption & Engagement */}
                <div className="p-3 flex-1 flex flex-col justify-between bg-white">
                  <div>
                    {/* Caption snippet */}
                    <p className="font-typewriter text-[11px] text-neutral-900 leading-snug line-clamp-2">
                      <span className="font-bold mr-1">{post.authorHandle}:</span>
                      {post.caption}
                    </p>

                    {/* Tag chips */}
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {post.tags.slice(0, 3).map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="font-mono-tag text-[8px] text-neutral-600 bg-neutral-100 px-1 py-0.2 border border-neutral-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-3 pt-2 border-t border-dashed border-neutral-300 flex items-center justify-between text-neutral-800">
                    <div className="flex items-center gap-3">
                      {/* Like button */}
                      <button
                        onClick={(e) => handleLike(post, e)}
                        className={`flex items-center gap-1 text-xs font-mono-tag font-bold cursor-pointer transition-transform active:scale-125 ${
                          isLiked ? 'text-red-600' : 'hover:text-red-500'
                        }`}
                        title="Like this broadcast"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            isLiked ? 'fill-red-600 text-red-600' : ''
                          }`}
                        />
                        <span>{post.likes}</span>
                      </button>

                      {/* Comments count */}
                      <span className="flex items-center gap-1 text-xs font-mono-tag font-bold text-neutral-600">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{post.commentsCount}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="font-mono-tag text-[9px] text-neutral-400">
                        {post.timestamp}
                      </span>
                      <button
                        onClick={(e) => handleShare(post, e)}
                        className="p-1 hover:bg-neutral-100 rounded text-neutral-700 hover:text-black cursor-pointer"
                        title="Copy broadcast share link"
                      >
                        <Share2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 3. Post Detail Lightbox Modal */}
      {activeModalPost && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={() => setActiveModalPost(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border-3 border-black w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-[8px_8px_0px_#000000] relative flex flex-col md:flex-row"
          >
            {/* Close button */}
            <button
              onClick={() => setActiveModalPost(null)}
              className="absolute top-3 right-3 z-30 bg-black text-white hover:bg-neutral-800 p-1.5 border border-black cursor-pointer"
              title="Close [ESC]"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Left Media Column */}
            <div className="md:w-1/2 bg-black flex items-center justify-center relative min-h-[300px]">
              <img
                src={activeModalPost.mediaUrl}
                alt={activeModalPost.caption}
                className="w-full h-full object-contain max-h-[500px]"
              />

              {activeModalPost.mediaType === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black/75 border-2 border-white text-white p-3 rounded-full">
                    <Play className="w-6 h-6 fill-white" />
                  </div>
                </div>
              )}

              {/* Platform watermark */}
              <div className="absolute bottom-3 left-3 bg-black/80 text-white font-mono-tag text-[9px] px-2 py-0.5 border border-white/30 uppercase">
                {activeModalPost.platform === 'instagram' ? 'INSTAGRAM REEL / POST' : 'TIKTOK VIDEO BROADCAST'}
              </div>
            </div>

            {/* Right Details Column */}
            <div className="md:w-1/2 p-4 sm:p-5 flex flex-col justify-between bg-[#fbf9f3]">
              <div>
                {/* Header */}
                <div className="flex items-center gap-2 pb-3 border-b-2 border-black">
                  <img
                    src={activeModalPost.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80'}
                    alt={activeModalPost.authorName}
                    className="w-8 h-8 rounded-full border border-black object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-headline font-black text-sm">
                        {activeModalPost.authorHandle}
                      </span>
                      {activeModalPost.isVerified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                      )}
                    </div>
                    <span className="font-mono-tag text-[9px] text-neutral-500">
                      {activeModalPost.authorName} • {activeModalPost.timestamp}
                    </span>
                  </div>
                </div>

                {/* Caption */}
                <div className="py-3">
                  <p className="font-typewriter text-xs text-neutral-900 leading-relaxed whitespace-pre-wrap">
                    {activeModalPost.caption}
                  </p>

                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {activeModalPost.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="font-mono-tag text-[9px] bg-neutral-200 text-black px-1.5 py-0.5 border border-black"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tagged Garment Box */}
                {activeModalPost.taggedGarment && (
                  <div className="my-3 p-3 bg-[#feef89] border-2 border-black shadow-[2px_2px_0px_#000000]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono-tag text-[9px] font-black uppercase text-neutral-800">
                        TAGGED ARCHIVE PIECE:
                      </span>
                      {activeModalPost.taggedGarment.gsm && (
                        <span className="bg-black text-yellow-300 text-[8px] font-mono-tag font-bold px-1.5 py-0.2 uppercase">
                          {activeModalPost.taggedGarment.gsm}
                        </span>
                      )}
                    </div>
                    <div className="font-headline font-black text-sm text-black">
                      {activeModalPost.taggedGarment.productTitle}
                    </div>
                    {activeModalPost.taggedGarment.price && (
                      <div className="font-mono-tag text-xs font-bold text-neutral-800 mt-0.5">
                        £{activeModalPost.taggedGarment.price.toFixed(2)} GBP
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        handleInspectGarment(activeModalPost, e);
                        setActiveModalPost(null);
                      }}
                      className="mt-2 w-full bg-black text-yellow-300 hover:bg-neutral-800 border border-black py-1 px-2 font-mono-tag font-black text-[10px] uppercase cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>INSPECT IN PHOTO STUDIO</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Community Comments Stream */}
                <div className="pt-2 border-t border-dashed border-neutral-300">
                  <span className="font-mono-tag text-[9px] font-bold uppercase text-neutral-600">
                    COMMUNITY BANTER ({activeModalPost.commentsCount}):
                  </span>
                  <div className="mt-1.5 space-y-1 text-[10px] font-typewriter text-neutral-800">
                    <p>
                      <span className="font-bold">@hackney_skate:</span> The boxy cut on this is proper.
                    </p>
                    <p>
                      <span className="font-bold">@studio_intern:</span> 500GSM loopback will survive the apocalypse.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Bottom Actions */}
              <div className="pt-3 border-t-2 border-black flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => handleLike(activeModalPost, e)}
                    className="flex items-center gap-1 text-xs font-mono-tag font-black bg-white hover:bg-neutral-100 border border-black px-2.5 py-1 shadow-xs cursor-pointer"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        likedPostIds.has(activeModalPost.id) ? 'fill-red-600 text-red-600' : ''
                      }`}
                    />
                    <span>{activeModalPost.likes} LIKES</span>
                  </button>

                  <button
                    onClick={(e) => handleShare(activeModalPost, e)}
                    className="flex items-center gap-1 text-xs font-mono-tag font-bold bg-white hover:bg-neutral-100 border border-black px-2.5 py-1 shadow-xs cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>SHARE</span>
                  </button>
                </div>

                <span className="font-mono-tag text-[9px] font-bold text-neutral-500 uppercase">
                  ID: {activeModalPost.id}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Submit Fit Pic Modal */}
      {isSubmitModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={() => setIsSubmitModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#fbf9f3] border-3 border-black w-full max-w-lg shadow-[8px_8px_0px_#000000] p-4 sm:p-5 relative"
          >
            {/* Tape on modal */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-4 masking-tape serrated-tape z-20 opacity-95 pointer-events-none" />

            <div className="flex items-center justify-between pb-2 border-b-2 border-black mb-3">
              <div>
                <span className="bg-black text-yellow-300 text-[8px] font-mono-tag font-bold px-1.5 py-0.2 uppercase">
                  COMMUNITY BROADCAST
                </span>
                <h3 className="font-marker text-lg text-black mt-0.5">
                  SUBMIT ARCHIVE FIT PIC
                </h3>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="bg-black text-white hover:bg-neutral-800 p-1 border border-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitFitPic} className="space-y-3">
              {/* Handle & Platform */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-mono-tag text-[9px] font-bold uppercase text-neutral-700 mb-0.5">
                    YOUR HANDLE *
                  </label>
                  <input
                    type="text"
                    required
                    value={newHandle}
                    onChange={(e) => setNewHandle(e.target.value)}
                    placeholder="@your_handle"
                    className="w-full text-xs font-mono-tag p-1.5 bg-white border border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block font-mono-tag text-[9px] font-bold uppercase text-neutral-700 mb-0.5">
                    PLATFORM
                  </label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value as SocialPlatform)}
                    className="w-full text-xs font-mono-tag p-1.5 bg-white border border-black focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="instagram">Instagram [IG]</option>
                    <option value="tiktok">TikTok [TT]</option>
                  </select>
                </div>
              </div>

              {/* Category & Location */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-mono-tag text-[9px] font-bold uppercase text-neutral-700 mb-0.5">
                    CATEGORY
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full text-xs font-mono-tag p-1.5 bg-white border border-black focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="fit-pic">Fit Check (OOTD)</option>
                    <option value="bts">Studio BTS & Process</option>
                    <option value="community">Community Wear</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono-tag text-[9px] font-bold uppercase text-neutral-700 mb-0.5">
                    LOCATION / SPOT
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. Southbank, London"
                    className="w-full text-xs font-mono-tag p-1.5 bg-white border border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              {/* Tagged Garment */}
              <div>
                <label className="block font-mono-tag text-[9px] font-bold uppercase text-neutral-700 mb-0.5">
                  TAGGED ARCHIVE GARMENT
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full text-xs font-mono-tag p-1.5 bg-white border border-black focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="">None / Custom Archive Piece</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.gsm})
                    </option>
                  ))}
                </select>
              </div>

              {/* Caption */}
              <div>
                <label className="block font-mono-tag text-[9px] font-bold uppercase text-neutral-700 mb-0.5">
                  CAPTION / FIT NOTES *
                </label>
                <textarea
                  required
                  rows={2}
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="How did you style it? Fit drape notes, sizing tips, weather..."
                  className="w-full text-xs font-mono-tag p-1.5 bg-white border border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              {/* Preset Photo Selector */}
              <div>
                <label className="block font-mono-tag text-[9px] font-bold uppercase text-neutral-700 mb-1">
                  CHOOSE LOOK / MOCK FIT PHOTO
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    {
                      label: 'Skate Spot',
                      url: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&auto=format&fit=crop&q=80',
                    },
                    {
                      label: 'Acid Tee',
                      url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80',
                    },
                    {
                      label: 'Layered',
                      url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
                    },
                    {
                      label: 'Workwear',
                      url: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&auto=format&fit=crop&q=80',
                    },
                  ].map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => setNewMediaPreset(preset.url)}
                      className={`relative aspect-square border-2 border-black overflow-hidden cursor-pointer ${
                        newMediaPreset === preset.url
                          ? 'ring-2 ring-yellow-400 scale-95'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[7px] font-mono-tag text-white text-center py-0.5">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-dashed border-neutral-300">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-3 py-1 text-xs font-mono-tag font-bold border border-black bg-white hover:bg-neutral-100 cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1 text-xs font-mono-tag font-black border-2 border-black bg-yellow-300 hover:bg-yellow-400 text-black shadow-[2px_2px_0px_#000000] cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'BROADCASTING...' : 'POST BROADCAST [LIVE]'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
