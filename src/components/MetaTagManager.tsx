import React, { useState, useEffect } from 'react';
import {
  Globe,
  Share2,
  Image as ImageIcon,
  Link as LinkIcon,
  Check,
  RotateCcw,
  Copy,
  ExternalLink,
  Search,
  Eye,
  Code,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { MetaTagConfig, ProductItem } from '../types';
import { api } from '../lib/api';
import { resolveCanonicalUrl, generateHeadHtmlSnippet, applyMetaTagsToDocument } from '../utils/seo';

interface MetaTagManagerProps {
  products: ProductItem[];
  onMetaUpdated?: (config: MetaTagConfig) => void;
  showToast: (msg: string) => void;
}

export const MetaTagManager: React.FC<MetaTagManagerProps> = ({
  products,
  onMetaUpdated,
  showToast,
}) => {
  const [config, setConfig] = useState<MetaTagConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState<'google' | 'social' | 'twitter' | 'code' | 'schema'>('google');

  // Load config on mount
  useEffect(() => {
    loadMetaTags();
  }, []);

  const loadMetaTags = async () => {
    setLoading(true);
    const data = await api.getMetaTags();
    if (data) {
      setConfig(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    const res = await api.updateMetaTags(config);
    if (res.success && res.meta) {
      setConfig(res.meta);
      applyMetaTagsToDocument(res.meta);
      if (onMetaUpdated) onMetaUpdated(res.meta);
      showToast('✓ Meta tags, OpenGraph cards & canonical structure deployed');
    } else {
      showToast(`⚠️ ${res.error || 'Failed to update meta tags'}`);
    }
    setSaving(false);
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all meta tags and OpenGraph configuration to London Studio factory defaults?')) {
      return;
    }
    setSaving(true);
    const res = await api.resetMetaTags();
    if (res.success && res.meta) {
      setConfig(res.meta);
      applyMetaTagsToDocument(res.meta);
      if (onMetaUpdated) onMetaUpdated(res.meta);
      showToast('✓ Meta tags restored to studio factory presets');
    }
    setSaving(false);
  };

  const handleCopyCode = () => {
    if (!config) return;
    const snippet = generateHeadHtmlSnippet(config);
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    showToast('✓ Raw <head> meta snippet copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !config) {
    return (
      <div className="bg-white border-2 border-black p-8 text-center font-mono-tag">
        <div className="inline-block animate-spin text-black mb-2">✦</div>
        <p className="text-xs uppercase font-bold tracking-wider">RETRIEVING STOREFRONT META TAG CONFIGURATION...</p>
      </div>
    );
  }

  // Pre-configured image presets for OpenGraph social cards
  const imagePresets = [
    {
      title: 'Studio Lookbook (Default)',
      url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: '500GSM Heavy Hoodie',
      url: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: 'Boxy Acid Heavy Tee',
      url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: 'Heavy Thermal Knit Drop',
      url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: 'Shoreditch Workshop HQ',
      url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1200&auto=format&fit=crop',
    },
  ];

  const resolvedCanonical = resolveCanonicalUrl(config);
  const titleCharCount = config.title.length;
  const descCharCount = config.description.length;

  return (
    <div className="space-y-4 font-mono-tag text-black">
      {/* Top Banner & Control Bar */}
      <div className="bg-[#fff500] border-2 border-black p-3 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-black" />
            <h3 className="font-headline font-black text-sm uppercase tracking-wider">
              META TAG & SOCIAL GRAPH ENGINE
            </h3>
            <span className="bg-black text-[#fff500] text-[9px] font-bold px-1.5 py-0.5 uppercase">
              DYNAMIC SSR / DOM
            </span>
          </div>
          <p className="text-[11px] text-neutral-800 mt-0.5">
            Synchronizes browser tab titles, OpenGraph social previews (iMessage/Discord/Twitter), search engine snippets, and canonical structure.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleReset}
            disabled={saving}
            className="bg-white hover:bg-neutral-100 text-black text-xs font-bold px-3 py-1.5 border-2 border-black uppercase flex items-center gap-1.5 cursor-pointer shadow-xs active:translate-y-0.5 disabled:opacity-50"
            title="Reset to factory preset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET PRESETS</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-black hover:bg-neutral-800 text-[#fff500] text-xs font-black px-4 py-1.5 border-2 border-black uppercase flex items-center gap-1.5 cursor-pointer shadow-xs active:translate-y-0.5 disabled:opacity-50"
          >
            {saving ? (
              <span>DEPLOYING...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>SAVE & DEPLOY TAGS</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Left Controls, Right Real-Time Simulators */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* SECTION 1: Page Title & Meta Description */}
          <div className="bg-white border-2 border-black p-3.5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-black" />
                <h4 className="font-headline font-black text-xs uppercase tracking-wider">
                  1. STOREFRONT TITLE & META DESCRIPTION
                </h4>
              </div>
              <span className="text-[10px] text-neutral-500">
                UPDATED: {new Date(config.updatedAt).toLocaleTimeString()}
              </span>
            </div>

            {/* Title Input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-black">
                  STOREFRONT TITLE (`&lt;title&gt;` &amp; `og:title`)
                </label>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 border ${
                  titleCharCount >= 30 && titleCharCount <= 60
                    ? 'bg-green-100 border-green-700 text-green-800'
                    : titleCharCount > 60
                    ? 'bg-yellow-100 border-yellow-700 text-yellow-900'
                    : 'bg-neutral-100 border-neutral-400 text-neutral-600'
                }`}>
                  {titleCharCount} / 60 CHARS {titleCharCount >= 30 && titleCharCount <= 60 ? '(OPTIMAL)' : titleCharCount > 60 ? '(LONG)' : '(SHORT)'}
                </span>
              </div>
              <input
                type="text"
                value={config.title}
                onChange={(e) => {
                  const val = e.target.value;
                  setConfig({ ...config, title: val, ogTitle: val });
                }}
                placeholder="TO KNOW NOTHING // Heavy Apparel Archive — London, UK"
                className="w-full border-2 border-black p-2 text-xs outline-none bg-yellow-50/50 font-bold focus:bg-white"
              />
              <p className="text-[10px] text-neutral-500 mt-1">
                Rendered on browser tabs, search engine results, and social cards. Optimal length is 30–60 characters.
              </p>
            </div>

            {/* Meta Description */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-black">
                  META DESCRIPTION (`&lt;meta name=&quot;description&quot;&gt;`)
                </label>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 border ${
                  descCharCount >= 120 && descCharCount <= 160
                    ? 'bg-green-100 border-green-700 text-green-800'
                    : descCharCount > 160
                    ? 'bg-yellow-100 border-yellow-700 text-yellow-900'
                    : 'bg-neutral-100 border-neutral-400 text-neutral-600'
                }`}>
                  {descCharCount} / 160 CHARS {descCharCount >= 120 && descCharCount <= 160 ? '(OPTIMAL)' : descCharCount > 160 ? '(TRUNCATED BY SEARCH)' : '(EXPANDABLE)'}
                </span>
              </div>
              <textarea
                rows={3}
                value={config.description}
                onChange={(e) => {
                  const val = e.target.value;
                  setConfig({ ...config, description: val, ogDescription: val });
                }}
                placeholder="UK-based heavy cotton streetwear archive storefront featuring 300-500GSM cut &amp; sew garments..."
                className="w-full border-2 border-black p-2 text-xs outline-none bg-yellow-50/50 font-mono-tag focus:bg-white resize-y"
              />
              <p className="text-[10px] text-neutral-500 mt-1">
                Clear summary displayed beneath your title in Google search results and messaging apps. Optimal length is 120–160 characters.
              </p>
            </div>

            {/* Keywords & Robots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  KEYWORDS
                </label>
                <input
                  type="text"
                  value={config.keywords}
                  onChange={(e) => setConfig({ ...config, keywords: e.target.value })}
                  placeholder="heavy streetwear, 500gsm, london..."
                  className="w-full border-2 border-black p-1.5 text-xs outline-none bg-white font-mono-tag"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  ROBOTS CRAWLER DIRECTIVE
                </label>
                <select
                  value={config.robots}
                  onChange={(e) => setConfig({ ...config, robots: e.target.value })}
                  className="w-full border-2 border-black p-1.5 text-xs outline-none bg-white font-mono-tag cursor-pointer"
                >
                  <option value="index, follow">index, follow (Standard Public Indexing)</option>
                  <option value="noindex, follow">noindex, follow (Do Not Index, Follow Links)</option>
                  <option value="noindex, nofollow">noindex, nofollow (Private / Staging)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: OpenGraph & Social Sharing Image */}
          <div className="bg-white border-2 border-black p-3.5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <div className="flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-black" />
                <h4 className="font-headline font-black text-xs uppercase tracking-wider">
                  2. OPENGRAPH SOCIAL SHARING IMAGES &amp; CARDS
                </h4>
              </div>
              <span className="bg-neutral-100 text-black text-[9px] font-bold px-1.5 py-0.5 border border-black uppercase">
                1200 × 630 (1.91:1)
              </span>
            </div>

            {/* Image URL Input */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                OPENGRAPH IMAGE URL (`og:image` &amp; `twitter:image`)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={config.ogImage}
                  onChange={(e) => setConfig({ ...config, ogImage: e.target.value })}
                  placeholder="https://.../social-card.jpg"
                  className="flex-1 border-2 border-black p-2 text-xs outline-none bg-yellow-50/50 font-mono-tag focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => window.open(config.ogImage, '_blank')}
                  className="px-2.5 bg-neutral-100 hover:bg-neutral-200 border-2 border-black text-black text-xs flex items-center cursor-pointer"
                  title="Open image in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Catalog Image Selector */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1.5">
                QUICK-SELECT CATALOG &amp; LOOKBOOK PRESET:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {imagePresets.map((preset, idx) => {
                  const isSelected = config.ogImage === preset.url;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setConfig({ ...config, ogImage: preset.url })}
                      className={`border-2 p-1 text-left transition-all cursor-pointer relative group ${
                        isSelected
                          ? 'border-black bg-yellow-100 shadow-[2px_2px_0px_#000]'
                          : 'border-neutral-300 hover:border-black bg-neutral-50'
                      }`}
                    >
                      <div className="aspect-video w-full overflow-hidden bg-neutral-200 border border-neutral-300 mb-1">
                        <img
                          src={preset.url}
                          alt={preset.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <p className="text-[9px] font-bold truncate uppercase">{preset.title}</p>
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-black text-yellow-300 rounded-full p-0.5">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Image Alt Text & Site Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  IMAGE ACCESSIBILITY ALT TEXT (`og:image:alt`)
                </label>
                <input
                  type="text"
                  value={config.ogImageAlt}
                  onChange={(e) => setConfig({ ...config, ogImageAlt: e.target.value })}
                  placeholder="TO KNOW NOTHING streetwear lookbook..."
                  className="w-full border-2 border-black p-1.5 text-xs outline-none bg-white font-mono-tag"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  SITE NAME (`og:site_name`)
                </label>
                <input
                  type="text"
                  value={config.siteName}
                  onChange={(e) => setConfig({ ...config, siteName: e.target.value })}
                  placeholder="TO KNOW NOTHING APPAREL LTD"
                  className="w-full border-2 border-black p-1.5 text-xs outline-none bg-white font-mono-tag"
                />
              </div>
            </div>

            {/* Twitter Card Type & Creator */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-neutral-200">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  TWITTER / X CARD FORMAT
                </label>
                <select
                  value={config.twitterCard}
                  onChange={(e) => setConfig({ ...config, twitterCard: e.target.value as any })}
                  className="w-full border-2 border-black p-1.5 text-xs outline-none bg-white font-mono-tag cursor-pointer"
                >
                  <option value="summary_large_image">summary_large_image (High Impact Lookbook)</option>
                  <option value="summary">summary (Compact Square Thumbnail)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  TWITTER / X HANDLE (`twitter:site`)
                </label>
                <input
                  type="text"
                  value={config.twitterSite}
                  onChange={(e) => setConfig({ ...config, twitterSite: e.target.value, twitterCreator: e.target.value })}
                  placeholder="@toknownothing_uk"
                  className="w-full border-2 border-black p-1.5 text-xs outline-none bg-white font-mono-tag"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Canonical URL Structure & International Locale */}
          <div className="bg-white border-2 border-black p-3.5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <div className="flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-black" />
                <h4 className="font-headline font-black text-xs uppercase tracking-wider">
                  3. CANONICAL URL STRUCTURE &amp; DOMAIN
                </h4>
              </div>
              <span className="bg-black text-yellow-300 text-[9px] font-bold px-1.5 py-0.5 uppercase">
                SEO DUPLICATE GUARD
              </span>
            </div>

            {/* Base Canonical URL */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                BASE CANONICAL DOMAIN
              </label>
              <input
                type="text"
                value={config.canonicalBaseUrl}
                onChange={(e) => setConfig({ ...config, canonicalBaseUrl: e.target.value })}
                placeholder="https://toknownothing.co.uk"
                className="w-full border-2 border-black p-2 text-xs outline-none bg-yellow-50/50 font-mono-tag font-bold focus:bg-white"
              />
              <p className="text-[10px] text-neutral-500 mt-1">
                The authoritative domain crawled by Google to avoid duplicate content penalties from preview URLs.
              </p>
            </div>

            {/* Canonical Path Strategy & Locale */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  CANONICAL PATH RESOLUTION
                </label>
                <select
                  value={config.canonicalPathRule}
                  onChange={(e) => setConfig({ ...config, canonicalPathRule: e.target.value as any })}
                  className="w-full border-2 border-black p-1.5 text-xs outline-none bg-white font-mono-tag cursor-pointer"
                >
                  <option value="preserve_path">Preserve Clean Path (e.g. /archive)</option>
                  <option value="root">Always Force Root Domain (/)</option>
                  <option value="preserve_query">Preserve Path + Search Queries (?category=)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-black mb-1">
                  CONTENT LOCALE (`og:locale`)
                </label>
                <select
                  value={config.locale}
                  onChange={(e) => setConfig({ ...config, locale: e.target.value })}
                  className="w-full border-2 border-black p-1.5 text-xs outline-none bg-white font-mono-tag cursor-pointer"
                >
                  <option value="en_GB">🇬🇧 en_GB (United Kingdom)</option>
                  <option value="en_US">🇺🇸 en_US (United States)</option>
                  <option value="de_DE">🇩🇪 de_DE (Germany)</option>
                  <option value="fr_FR">🇫🇷 fr_FR (France)</option>
                  <option value="ja_JP">🇯🇵 ja_JP (Japan)</option>
                </select>
              </div>
            </div>

            {/* Live Resolved Canonical Pill */}
            <div className="bg-neutral-100 border border-neutral-300 p-2 flex items-center justify-between text-xs">
              <div className="truncate mr-2">
                <span className="text-neutral-500 text-[10px] block">ACTIVE CANONICAL LINK:</span>
                <code className="text-[11px] font-bold text-black font-mono-tag">&lt;link rel=&quot;canonical&quot; href=&quot;{resolvedCanonical}&quot; /&gt;</code>
              </div>
              <span className="bg-green-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-xs shrink-0">
                ACTIVE
              </span>
            </div>

            {/* Schema.org toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-neutral-200">
              <div>
                <span className="text-xs font-bold uppercase block">SCHEMA.ORG JSON-LD STRUCTURED DATA</span>
                <span className="text-[10px] text-neutral-500">
                  Injects Organization, Shoreditch London HQ address, and WebSite schemas for rich Google search snippets.
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.enableStructuredData}
                onChange={(e) => setConfig({ ...config, enableStructuredData: e.target.checked })}
                className="w-4 h-4 accent-black cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time Live Simulators & Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Simulator Container */}
          <div className="bg-white border-2 border-black shadow-xs overflow-hidden">
            {/* Simulator Tabs */}
            <div className="flex border-b-2 border-black bg-neutral-100 text-[10px] font-bold overflow-x-auto">
              <button
                type="button"
                onClick={() => setPreviewMode('google')}
                className={`px-3 py-2 border-r border-black uppercase flex items-center gap-1 cursor-pointer ${
                  previewMode === 'google' ? 'bg-white text-black border-b-2 border-b-white -mb-0.5' : 'text-neutral-600 hover:text-black'
                }`}
              >
                <Search className="w-3 h-3" />
                <span>GOOGLE SERP</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('social')}
                className={`px-3 py-2 border-r border-black uppercase flex items-center gap-1 cursor-pointer ${
                  previewMode === 'social' ? 'bg-white text-black border-b-2 border-b-white -mb-0.5' : 'text-neutral-600 hover:text-black'
                }`}
              >
                <Share2 className="w-3 h-3" />
                <span>OPENGRAPH</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('twitter')}
                className={`px-3 py-2 border-r border-black uppercase flex items-center gap-1 cursor-pointer ${
                  previewMode === 'twitter' ? 'bg-white text-black border-b-2 border-b-white -mb-0.5' : 'text-neutral-600 hover:text-black'
                }`}
              >
                <span>TWITTER / X</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('code')}
                className={`px-3 py-2 border-r border-black uppercase flex items-center gap-1 cursor-pointer ${
                  previewMode === 'code' ? 'bg-white text-black border-b-2 border-b-white -mb-0.5' : 'text-neutral-600 hover:text-black'
                }`}
              >
                <Code className="w-3 h-3" />
                <span>&lt;HEAD&gt; TAGS</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('schema')}
                className={`px-3 py-2 uppercase flex items-center gap-1 cursor-pointer ${
                  previewMode === 'schema' ? 'bg-white text-black border-b-2 border-b-white -mb-0.5' : 'text-neutral-600 hover:text-black'
                }`}
              >
                <span>JSON-LD</span>
              </button>
            </div>

            {/* Preview Viewport */}
            <div className="p-4 bg-neutral-50 min-h-[360px] flex flex-col justify-center">

              {/* 1. GOOGLE SERP PREVIEW */}
              {previewMode === 'google' && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                    GOOGLE SEARCH RESULT PREVIEW (DESKTOP &amp; MOBILE)
                  </span>

                  <div className="bg-white border border-neutral-300 p-4 rounded-md shadow-xs space-y-1.5 font-sans text-left">
                    {/* Breadcrumb / URL */}
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-5 h-5 rounded-full bg-black text-[#fff500] font-black text-[9px] flex items-center justify-center font-mono">
                        TK
                      </div>
                      <div className="flex flex-col leading-tight">
                        <span className="text-neutral-800 font-medium text-[12px]">{config.siteName}</span>
                        <span className="text-neutral-500 text-[11px] truncate max-w-[280px]">
                          {resolvedCanonical}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-[#1a0dab] hover:underline text-base sm:text-lg font-medium leading-snug cursor-pointer line-clamp-1">
                      {config.title}
                    </h3>

                    {/* Description */}
                    <p className="text-neutral-600 text-[13px] leading-relaxed line-clamp-2">
                      {config.description}
                    </p>
                  </div>

                  <div className="text-[10px] text-neutral-500 flex items-center gap-1.5 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-700" />
                    <span>Google snippet width constrained to ~600px boundary simulation</span>
                  </div>
                </div>
              )}

              {/* 2. OPENGRAPH SOCIAL PREVIEW */}
              {previewMode === 'social' && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                    OPENGRAPH CARD (iMESSAGE / DISCORD / SLACK / FACEBOOK)
                  </span>

                  <div className="bg-white border border-neutral-300 rounded-lg overflow-hidden shadow-sm max-w-sm mx-auto font-sans">
                    {/* Social Image */}
                    <div className="aspect-[1.91/1] w-full bg-neutral-200 overflow-hidden relative">
                      <img
                        src={config.ogImage}
                        alt={config.ogImageAlt || config.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-xs backdrop-blur-xs uppercase font-mono">
                        {config.locale}
                      </div>
                    </div>

                    {/* Metadata Content */}
                    <div className="p-3 bg-neutral-50 border-t border-neutral-200 text-left">
                      <span className="text-[11px] text-neutral-500 uppercase font-semibold block tracking-wider truncate">
                        {new URL(config.canonicalBaseUrl.startsWith('http') ? config.canonicalBaseUrl : `https://${config.canonicalBaseUrl}`).hostname}
                      </span>
                      <h4 className="font-bold text-sm text-neutral-900 leading-snug line-clamp-1 mt-0.5">
                        {config.ogTitle || config.title}
                      </h4>
                      <p className="text-xs text-neutral-600 line-clamp-2 mt-1">
                        {config.ogDescription || config.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. TWITTER / X CARD PREVIEW */}
              {previewMode === 'twitter' && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                    TWITTER / X SUMMARY CARD (FEED SIMULATION)
                  </span>

                  <div className="bg-black text-white p-3 rounded-xl border border-neutral-800 max-w-sm mx-auto font-sans text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs">
                        TKN
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-xs text-white">{config.siteName}</span>
                          <span className="text-neutral-400 text-[11px]">{config.twitterSite}</span>
                        </div>
                        <span className="text-[10px] text-neutral-400">Archival heavy streetwear dispatch</span>
                      </div>
                    </div>

                    {/* Embedded Card */}
                    <div className="border border-neutral-700 rounded-xl overflow-hidden bg-neutral-900">
                      {config.twitterCard === 'summary_large_image' ? (
                        <div>
                          <div className="aspect-[1.91/1] w-full overflow-hidden bg-neutral-800">
                            <img
                              src={config.ogImage}
                              alt={config.ogImageAlt || config.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-2.5">
                            <span className="text-[10px] text-neutral-400 block truncate">
                              {new URL(config.canonicalBaseUrl.startsWith('http') ? config.canonicalBaseUrl : `https://${config.canonicalBaseUrl}`).hostname}
                            </span>
                            <h5 className="text-xs font-bold text-white truncate mt-0.5">
                              {config.title}
                            </h5>
                            <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                              {config.description}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex p-2 items-center gap-3">
                          <div className="w-16 h-16 rounded-md overflow-hidden bg-neutral-800 shrink-0">
                            <img
                              src={config.ogImage}
                              alt={config.ogImageAlt || config.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="overflow-hidden">
                            <span className="text-[10px] text-neutral-400 block truncate">
                              {config.siteName}
                            </span>
                            <h5 className="text-xs font-bold text-white truncate">
                              {config.title}
                            </h5>
                            <p className="text-[11px] text-neutral-400 line-clamp-1">
                              {config.description}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. RAW HTML HEAD TAGS */}
              {previewMode === 'code' && (
                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                      GENERATED HTML &lt;HEAD&gt; DIRECTIVES
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="bg-black hover:bg-neutral-800 text-yellow-300 text-[10px] font-bold px-2 py-0.5 border border-black uppercase flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'COPIED' : 'COPY TAGS'}</span>
                    </button>
                  </div>
                  <pre className="bg-neutral-900 text-green-400 p-3 rounded-md text-[10px] font-mono overflow-x-auto max-h-[300px] border border-black selection:bg-yellow-300 selection:text-black">
                    {generateHeadHtmlSnippet(config)}
                  </pre>
                </div>
              )}

              {/* 5. JSON-LD STRUCTURED DATA */}
              {previewMode === 'schema' && (
                <div className="space-y-2 text-left">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                    SCHEMA.ORG STRUCTURED DATA (JSON-LD)
                  </span>
                  <pre className="bg-neutral-900 text-yellow-300 p-3 rounded-md text-[10px] font-mono overflow-x-auto max-h-[300px] border border-black selection:bg-white selection:text-black">
                    {JSON.stringify(
                      {
                        '@context': 'https://schema.org',
                        '@graph': [
                          {
                            '@type': 'Organization',
                            '@id': `${config.canonicalBaseUrl}/#organization`,
                            name: config.siteName,
                            url: config.canonicalBaseUrl,
                            logo: config.ogImage,
                            description: config.description,
                            address: {
                              '@type': 'PostalAddress',
                              streetAddress: 'Studio 4B, Redchurch Street, Shoreditch',
                              addressLocality: 'London',
                              postalCode: 'E2 7DD',
                              addressCountry: 'GB',
                            },
                          },
                          {
                            '@type': 'WebSite',
                            '@id': `${config.canonicalBaseUrl}/#website`,
                            url: config.canonicalBaseUrl,
                            name: config.siteName,
                            description: config.description,
                            publisher: {
                              '@id': `${config.canonicalBaseUrl}/#organization`,
                            },
                          },
                        ],
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}

            </div>
          </div>

          {/* Quick Technical Architecture Info Box */}
          <div className="bg-white border-2 border-black p-3 space-y-2 text-xs">
            <h4 className="font-headline font-black text-xs uppercase tracking-wider border-b border-neutral-300 pb-1">
              ARCHITECTURAL PIPELINE SUMMARY
            </h4>
            <div className="space-y-1.5 text-[11px] text-neutral-700">
              <div className="flex items-start gap-2">
                <span className="text-black font-bold">1. REST API:</span>
                <span>Updates stored in Node backend memory via PUT /api/meta-tags.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-black font-bold">2. Client DOM:</span>
                <span>Reactive DOM injector updates document.title, &lt;meta&gt;, and &lt;link rel=&quot;canonical&quot;&gt; immediately without reload.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-black font-bold">3. Crawler Delivery:</span>
                <span>Production static server (app.get(&apos;*&apos;)) dynamically injects updated title and tags directly into served HTML strings.</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
