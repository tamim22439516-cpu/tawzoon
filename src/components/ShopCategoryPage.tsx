import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext.js';
import { Product, HeroSlideItem } from '../types/index.js';
import { ProductCard } from './ProductCard.js';
import { ProductDetailsPage } from './ProductDetailsPage.js';
import { SLIDE_THEMES } from './HeroSection.js';
import { api } from '../services/api.js';
import { ScrollReveal } from './common/ScrollReveal.js';
import {
  Home,
  ChevronLeft,
  ChevronRight,
  Shirt,
  ShoppingBag,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Star,
  Check,
  X,
  Filter,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const isCategoryMatch = (slugA?: string, slugB?: string): boolean => {
  if (!slugA || !slugB) return false;
  const a = slugA.toLowerCase().trim();
  const b = slugB.toLowerCase().trim();
  if (a === b) return true;
  // Handle gajet / gadgets / gadget / tech
  if (['gajet', 'gadget', 'gadgets', 'tech'].includes(a) && ['gajet', 'gadget', 'gadgets', 'tech'].includes(b)) {
    return true;
  }
  // Handle other / others
  if (['other', 'others'].includes(a) && ['other', 'others'].includes(b)) {
    return true;
  }
  // Handle shop / fashion / lifestyle / style
  if (['shop', 'style', 'fashion', 'lifestyle'].includes(a) && ['shop', 'style', 'fashion', 'lifestyle'].includes(b)) {
    return true;
  }
  return false;
};

const normalizeBengali = (str: string | undefined | null): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/\u09DF/g, '\u09AF') // Replace য় (U+09DF) with য (U+09AF)
    .replace(/\u09DC/g, '\u09A1') // Replace ড় with ড
    .replace(/\u09DD/g, '\u09A2') // Replace ঢ় with ঢ
    .trim();
};

const DEFAULT_HERO_SLIDES: HeroSlideItem[] = [
  {
    id: 1,
    tagBn: 'গুণগত মানের পণ্য',
    tagEn: 'QUALITY ASSURED PRODUCTS',
    titleLine1Bn: 'আপনার প্রতিদিনের',
    titleLine1En: 'Everything For Your',
    titleLine2Bn: 'প্রয়োজনের সবকিছু',
    titleLine2En: 'Daily Needs',
    titleLine3Bn: 'এক জায়গায়',
    titleLine3En: 'In One Place',
    subheadBn: 'নির্বাচিত, মানসম্মত এবং নির্ভরযোগ্য পণ্য এখন আরও সহজে',
    subheadEn: 'Carefully curated, premium, and authentic products delivered with trust',
    ctaBn: 'পণ্যসমূহ দেখুন',
    ctaEn: 'Explore Products',
    category: 'all',
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1000&auto=format&fit=crop&q=80',
  },
  {
    id: 2,
    tagBn: 'স্মার্ট গ্যাজেটস ও টেক',
    tagEn: 'SMART GADGETS & TECH',
    titleLine1Bn: 'আধুনিক লাইফস্টাইলের',
    titleLine1En: 'Modern Lifestyle',
    titleLine2Bn: 'সেরা টেকনোলজি ও স্মার্ট',
    titleLine2En: 'Smart Tech &',
    titleLine3Bn: 'এক্সেসরিজ',
    titleLine3En: 'Accessories',
    subheadBn: 'স্মার্ট ওয়াচ, হেডফোন ও প্রিমিয়াম গ্যাজেট এখন বিশেষ অফারে',
    subheadEn: 'Explore cutting-edge audio, smart wearables, and essentials',
    ctaBn: 'গ্যাজেট দেখুন',
    ctaEn: 'Explore Gadgets',
    category: 'gadgets',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&auto=format&fit=crop&q=80',
  },
  {
    id: 3,
    tagBn: 'নতুন ট্রেন্ডি কালেকশন',
    tagEn: 'PREMIUM FASHION & HOME',
    titleLine1Bn: 'মার্জিত ও আকর্ষণীয়',
    titleLine1En: 'Refined Quality &',
    titleLine2Bn: 'নতুন ফ্যাশন ও লাইফস্টাইল',
    titleLine2En: 'Trendy Seasonal',
    titleLine3Bn: 'পণ্য সম্ভার',
    titleLine3En: 'Collection',
    subheadBn: 'দৈনন্দিন পোশাক ও হোম ডেকোরে সেরা মান ও সাশ্রয়ী দাম',
    subheadEn: 'Apparel, travel gear, and household essentials designed for living',
    ctaBn: 'কালেকশন দেখুন',
    ctaEn: 'Explore Collection',
    category: 'shop',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1000&auto=format&fit=crop&q=80',
  },
];

interface ShopCategoryPageProps {
  categorySlug?: string;
  products: Product[];
  loading?: boolean;
}

interface SubCatItem {
  id: string;
  nameBn: string;
  nameEn: string;
  count: number;
  image: string;
}

interface CategoryGroup {
  id: string;
  titleBn: string;
  titleEn: string;
  subtitleBn: string;
  subtitleEn: string;
  bgColor: string;
  borderColor: string;
  accentColor: string;
  items: SubCatItem[];
}

export const ShopCategoryPage: React.FC<ShopCategoryPageProps> = ({
  categorySlug = 'shop',
  products,
  loading,
}) => {
  const { lang, setPublicCategory, showPromo, subsections, brandSettings, categories } = useApp();

  const currentSlug = categorySlug.toLowerCase().trim();

  // If null -> Category Overview Page
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);

  const isAllOrShopTab = currentSlug === 'shop_tab' || currentSlug === 'all';
  const isGadget = currentSlug === 'gadgets' || currentSlug === 'gajet' || currentSlug.includes('gadget') || currentSlug.includes('tech');
  const isShop = currentSlug === 'shop' || currentSlug === 'fashion' || currentSlug === 'lifestyle' || currentSlug.includes('cloth') || currentSlug.includes('wear') || currentSlug === 'style';
  const isOther = currentSlug === 'other' || currentSlug === 'others';

  const matchedCatObj = useMemo(() => {
    return (categories || []).find(
      c => isCategoryMatch(c.slug, currentSlug) || c.id === currentSlug
    );
  }, [categories, currentSlug]);

  // Get active hero slide & theme for this category
  const heroSlides = useMemo(() => {
    return (brandSettings?.heroSlides && brandSettings.heroSlides.length > 0)
      ? brandSettings.heroSlides
      : DEFAULT_HERO_SLIDES;
  }, [brandSettings]);

  const activeSlideIndex = useMemo(() => {
    if (isGadget) {
      return 1;
    }
    if (isShop) {
      return 2;
    }
    if (isOther) {
      return 0;
    }
    const idx = heroSlides.findIndex(s => isCategoryMatch(s.category, currentSlug));
    if (idx !== -1) return idx;
    return 0;
  }, [currentSlug, heroSlides, isGadget, isShop, isOther]);

  const activeSlide = heroSlides[activeSlideIndex] || DEFAULT_HERO_SLIDES[activeSlideIndex] || DEFAULT_HERO_SLIDES[0];
  const activeTheme = SLIDE_THEMES[activeSlideIndex % SLIDE_THEMES.length];

  // Filters state
  const [maxPrice, setMaxPrice] = useState<number>(1000000); // Default very high to ensure no premium products are filtered out initially
  const [selectedBrands, setSelectedBrands] = useState<string[]>(['Premium']);
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [sortBy, setSortBy] = useState<string>('popular');
  const [itemsPerPage, setItemsPerPage] = useState<number>(24);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Find the highest product price in this category to set filter slider dynamically
  const maxProductPrice = useMemo(() => {
    const list = (products || []).filter(
      p => (isAllOrShopTab ? true : isCategoryMatch(p.categorySlug, currentSlug)) && p.isActive !== false && !p.isArchived
    );
    if (list.length === 0) return 10000;
    const maxVal = Math.max(...list.map(p => p.sellingPrice || 0));
    return Math.ceil(maxVal / 1000) * 1000; // Round up to nearest 1,000
  }, [products, currentSlug, isAllOrShopTab]);

  // Sync maxPrice with maximum loaded product price
  useEffect(() => {
    if (maxProductPrice > 0) {
      setMaxPrice(maxProductPrice);
    }
  }, [maxProductPrice]);

  // Drawers
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState<boolean>(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState<boolean>(false);

  // If viewing a product -> Product Details Page
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  // Dynamic calculation of products matching subcategory / keyword
  const getSubCatCount = (subcatBn: string, subcatEn: string, catSlug?: string) => {
    const isAll = !catSlug || catSlug === 'all' || catSlug === 'shop_tab';
    const activeList = (products || []).filter(
      p => p.isActive !== false && !p.isArchived && (isAll ? true : isCategoryMatch(p.categorySlug, catSlug))
    );

    const sBn = normalizeBengali(subcatBn);
    const sEn = (subcatEn || '').toLowerCase().trim();

    return activeList.filter((p) => {
      const pSubBn = normalizeBengali(p.subcategoryBn);
      const pSubEn = (p.subcategoryEn || '').toLowerCase().trim();
      const pNameBn = normalizeBengali(p.nameBn);
      const pNameEn = (p.nameEn || '').toLowerCase();

      return (
        (pSubBn && (pSubBn.includes(sBn) || sBn.includes(pSubBn))) ||
        (pSubEn && (pSubEn.includes(sEn) || sEn.includes(pSubEn))) ||
        pNameBn.includes(sBn) ||
        pNameEn.includes(sEn)
      );
    }).length;
  };

  // Dynamic Category Configuration from backend Database / Subsections
  const categoryConfig = useMemo(() => {
    const activeSubs = (subsections || []).filter(
      s => s.isActive !== false && (isAllOrShopTab ? true : isCategoryMatch(s.parentSlug, currentSlug))
    );

    // Find parent group subsections (those without parentSub)
    const parentGroups = activeSubs.filter(s => !s.parentSub);

    let groups: CategoryGroup[] = [];

    if (parentGroups.length > 0) {
      groups = parentGroups
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(pg => {
          // Find child items where parentSub matches pg.name
          const childItems = activeSubs
            .filter(s => s.parentSub && s.parentSub.trim() === pg.name.trim())
            .sort((a, b) => (a.order || 0) - (b.order || 0));

          const items = childItems.length > 0
            ? childItems.map(item => ({
                id: item.id,
                nameBn: item.name,
                nameEn: item.name,
                count: getSubCatCount(item.name, item.name, currentSlug),
                image: item.imageUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80',
              }))
            : [{
                id: pg.id,
                nameBn: pg.name,
                nameEn: pg.name,
                count: getSubCatCount(pg.name, pg.name, currentSlug),
                image: pg.imageUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80',
              }];

          return {
            id: pg.id,
            titleBn: pg.name,
            titleEn: pg.name,
            subtitleBn: pg.description || '',
            subtitleEn: pg.description || '',
            bgColor: 'bg-[#f0faf3]',
            borderColor: 'border-[#d8f0e0]',
            accentColor: '#009245',
            items,
          };
        });
    } else if (activeSubs.length > 0) {
      // Direct subcategories without parent group
      groups = [
        {
          id: 'direct-subs',
          titleBn: matchedCatObj?.name || (isAllOrShopTab ? 'সকল পণ্য' : currentSlug.toUpperCase()),
          titleEn: matchedCatObj?.name || (isAllOrShopTab ? 'ALL PRODUCTS' : currentSlug.toUpperCase()),
          subtitleBn: 'সাব-ক্যাটাগরি সমূহ',
          subtitleEn: 'Subcategories',
          bgColor: 'bg-[#f0faf3]',
          borderColor: 'border-[#d8f0e0]',
          accentColor: '#009245',
          items: activeSubs.map(item => ({
            id: item.id,
            nameBn: item.name,
            nameEn: item.name,
            count: getSubCatCount(item.name, item.name, currentSlug),
            image: item.imageUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80',
          })),
        },
      ];
    }

    // Fallback if no subsections configured for this category yet
    if (groups.length === 0) {
      const allCategoryProducts = (products || []).filter(
        p => p.isActive !== false && !p.isArchived && (isAllOrShopTab ? true : isCategoryMatch(p.categorySlug, currentSlug))
      );
      const uniqueSubs = Array.from(new Set(allCategoryProducts.map(p => p.subcategoryBn).filter(Boolean)));
      if (uniqueSubs.length > 0) {
        groups = [
          {
            id: 'default-group',
            titleBn: matchedCatObj?.name || (isAllOrShopTab ? 'সকল পণ্য' : currentSlug.toUpperCase()),
            titleEn: matchedCatObj?.name || (isAllOrShopTab ? 'ALL PRODUCTS' : currentSlug.toUpperCase()),
            subtitleBn: 'সকল প্রোডাক্ট কালেকশন',
            subtitleEn: 'All product collections',
            bgColor: 'bg-[#f0faf3]',
            borderColor: 'border-[#d8f0e0]',
            accentColor: '#009245',
            items: uniqueSubs.map((sub, idx) => ({
              id: `sub-${idx}`,
              nameBn: sub,
              nameEn: sub,
              count: getSubCatCount(sub, sub, currentSlug),
              image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80',
            })),
          },
        ];
      }
    }

    const titleStr = isAllOrShopTab
      ? (lang === 'bn' ? 'সকল পণ্য' : 'ALL PRODUCTS')
      : isShop
      ? 'SHOP — STYLE'
      : isGadget
      ? 'GADGET — STYLE'
      : isOther
      ? 'OTHER — STYLE'
      : (matchedCatObj?.name ? `${matchedCatObj.name.toUpperCase()} — STYLE` : `${currentSlug.toUpperCase()} — STYLE`);

    const headlineStr = isAllOrShopTab
      ? (lang === 'bn' ? 'সকল মানসম্মত পণ্য এক জায়গায়' : 'All Products in One Place')
      : isShop
      ? (lang === 'bn' ? 'পোশাক, ফ্যাশন ও লাইফস্টাইল কালেকশন' : 'Fashion & Lifestyle Collection')
      : isGadget
      ? (lang === 'bn' ? 'স্মার্ট গ্যাজেটস ও টেকনোলজি কালেকশন' : 'Smart Gadgets & Tech Collection')
      : isOther
      ? (lang === 'bn' ? 'বই, নিত্যপ্রয়োজনীয় ও লাইফস্টাইল কালেকশন' : 'Books, Essentials & Lifestyle Collection')
      : (matchedCatObj?.description || `${matchedCatObj?.name || currentSlug} কালেকশন`);

    return {
      title: titleStr,
      titleBn: isAllOrShopTab
        ? 'সকল পণ্য'
        : isShop
        ? 'SHOP — STYLE'
        : isGadget
        ? (lang === 'bn' ? 'গ্যাজেট — স্টাইল' : 'GADGET — STYLE')
        : isOther
        ? (lang === 'bn' ? 'আদার — স্টাইল' : 'OTHER — STYLE')
        : (matchedCatObj?.name ? `${matchedCatObj.name} — STYLE` : `${currentSlug} — STYLE`),
      bannerHeadlineBn: headlineStr,
      bannerHeadlineEn: 'Curated Collection',
      bannerSubtitleBn: 'মানসম্মত ও ট্রেন্ডি পণ্য এখন এক জায়গায়',
      bannerSubtitleEn: 'Quality products delivered nationwide',
      sloganBn: isGadget
        ? 'স্মার্ট\nলাইফে সেরা\nটেকনোলজি'
        : isOther
        ? 'প্রতিদিনের\nপ্রয়োজনে\nসবকিছু'
        : 'স্টাইলে\nআপনার\nআত্মবিশ্বাস',
      sloganEn: 'Style\nIn Your\nConfidence',
      bannerImage: isGadget
        ? 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&auto=format&fit=crop&q=80'
        : isOther
        ? 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1000&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1000&auto=format&fit=crop&q=80',
      groups,
    };
  }, [currentSlug, subsections, products, lang, isAllOrShopTab, isGadget, isShop, isOther, matchedCatObj]);

  // Database driven products list
  const displayProducts = useMemo(() => {
    let list = (products || []).filter(
      p => p.isActive !== false && !p.isArchived && (isAllOrShopTab ? true : isCategoryMatch(p.categorySlug, currentSlug))
    );

    if (selectedSubCategory) {
      const sBn = normalizeBengali(selectedSubCategory);
      list = list.filter(p => {
        const pSubBn = normalizeBengali(p.subcategoryBn);
        const pSubEn = (p.subcategoryEn || '').toLowerCase();
        const pNameBn = normalizeBengali(p.nameBn);
        const pNameEn = (p.nameEn || '').toLowerCase();
        return (
          pSubBn.includes(sBn) ||
          sBn.includes(pSubBn) ||
          pSubEn.includes(sBn) ||
          pNameBn.includes(sBn) ||
          pNameEn.includes(sBn)
        );
      });
    }

    if (maxPrice) {
      list = list.filter(p => p.sellingPrice <= maxPrice);
    }

    return list;
  }, [currentSlug, products, selectedSubCategory, maxPrice, isAllOrShopTab]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  // If a product is clicked, render Image 4: Dedicated Product Details Page!
  if (viewingProduct) {
    return (
      <ProductDetailsPage
        product={viewingProduct}
        onBack={() => setViewingProduct(null)}
        categoryProducts={displayProducts}
        onSelectRelated={(prod) => {
          setViewingProduct(prod);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-2 sm:px-6 lg:px-8 pt-2.5 sm:pt-4 pb-4 space-y-2.5 sm:space-y-4">
      <ScrollReveal className="space-y-2.5 sm:space-y-4" delay={0} duration={300}>
      
      {/* ------------------------------------------------------------- */}
      {/* CASE 1: CATEGORY OVERVIEW PAGE (Matches Image 2 Exactly)       */}
      {/* ------------------------------------------------------------- */}
      {selectedSubCategory === null ? (
        <div className="space-y-2 sm:space-y-4">
          
          {/* Top Strip Bar: Conditional layer depending on whether opened from 'সকল পণ্য' bottom tab or Homepage explore */}
          {currentSlug === 'shop_tab' ? (
            <div className="bg-white dark:bg-slate-900 py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl shadow-2xs border border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setPublicCategory('all')}
                  className="px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg inline-flex items-center gap-1 transition-colors shadow-2xs cursor-pointer shrink-0 active:scale-95"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'ফিরে যান' : 'Back'}</span>
                </button>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  <ShoppingBag className="w-4 h-4 text-[#009245]" />
                  <span>{lang === 'bn' ? 'সকল পণ্য' : 'All Products'}</span>
                </div>
              </div>
              <div className="bg-emerald-50 text-[#009245] font-extrabold text-xs px-2.5 py-1 rounded-lg border border-emerald-200/80 shadow-2xs shrink-0">
                {categoryConfig.groups.length} {lang === 'bn' ? 'টি ক্যাটাগরি' : 'Categories'}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl shadow-2xs border border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  onClick={() => setPublicCategory('all')}
                  className="px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg inline-flex items-center gap-1 transition-colors shadow-2xs cursor-pointer shrink-0 active:scale-95"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'ফিরে যান' : 'Back'}</span>
                </button>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase truncate">
                  <span>{categoryConfig.title}</span>
                </div>
              </div>
              <div className="bg-emerald-50 text-[#009245] font-extrabold text-xs px-2.5 py-1 rounded-lg border border-emerald-200/80 shadow-2xs shrink-0">
                {categoryConfig.groups.length} {lang === 'bn' ? 'টি ক্যাটাগরি' : 'Categories'}
              </div>
            </div>
          )}

          {/* Category Groups / Subsections */}
          <div className="space-y-3 sm:space-y-4">
            {categoryConfig.groups.length === 0 ? (
              loading ? (
                <div className="bg-[#f0faf3] border border-[#d8f0e0] rounded-2xl p-4 sm:p-5 space-y-3 animate-pulse">
                  <div className="h-5 w-40 bg-emerald-200/60 rounded-md" />
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="bg-white rounded-xl border border-slate-100 p-2 space-y-2">
                        <div className="aspect-square bg-slate-100 rounded-lg" />
                        <div className="h-2.5 bg-slate-100 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-8 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-[#009245] flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    {lang === 'bn' ? `${categoryConfig.title} এ এখনো কোনো পণ্য বা সাব-ক্যাটাগরি নেই` : `No items in ${categoryConfig.title} yet`}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {lang === 'bn'
                      ? 'অ্যাডমিন প্যানেল থেকে এই ক্যাটাগরিতে সাব-ক্যাটাগরি বা পণ্য যোগ করলে তা এখানে স্বয়ংক্রিয়ভাবে লাইভ হবে।'
                      : 'Adding products or subcategories to this category in the admin panel will automatically show them here.'}
                  </p>
                  <button
                    onClick={() => setPublicCategory('all')}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#009245] hover:bg-[#007a3a] rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'হোম পেজে ফিরে যান' : 'Back to Home'}</span>
                  </button>
                </div>
              )
            ) : (
              categoryConfig.groups.map((group) => (
                <div
                  key={group.id}
                  className={`${group.bgColor} border ${group.borderColor} rounded-2xl sm:rounded-3xl p-3 sm:p-5 space-y-2.5 sm:space-y-3.5 shadow-2xs`}
                >
                  {/* Group Header */}
                  <div className="flex items-center justify-between pb-0.5 sm:pb-1">
                    <div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span
                          className="w-3 sm:w-4 h-1 sm:h-1.5 rounded-full inline-block"
                          style={{ backgroundColor: group.accentColor }}
                        />
                        <h2 className="text-sm sm:text-2xl font-black text-slate-900 tracking-tight">
                          {lang === 'bn' ? group.titleBn : group.titleEn}
                        </h2>
                      </div>
                      <p className="text-[10px] sm:text-xs text-slate-600 font-normal mt-0.5 line-clamp-1">
                        {lang === 'bn' ? group.subtitleBn : group.subtitleEn}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        if (group.items && group.items.length > 0 && group.items[0]?.nameBn) {
                          setSelectedSubCategory(group.items[0].nameBn);
                        } else {
                          setSelectedSubCategory(group.titleBn || 'all');
                        }
                      }}
                      className="text-[10px] sm:text-xs font-bold text-slate-800 hover:text-[#009245] transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <span>{lang === 'bn' ? 'সব ক্যাটাগরি দেখুন' : 'View All'}</span>
                      <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>

                  {/* Sub-categories Grid (Exact Card Layout from Image 2) */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedSubCategory(item.nameBn)}
                        className="group cursor-pointer bg-white rounded-xl border border-slate-200/90 p-1.5 sm:p-2.5 hover:shadow-xs hover:border-[#009245] transition-all duration-200 flex flex-col justify-between active:scale-95"
                      >
                        {/* Image container */}
                        <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-slate-50 mb-1 flex items-center justify-center">
                          <img
                            src={item.image}
                            alt={item.nameBn}
                            className="w-full h-full object-cover object-center rounded-lg group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Category Title (Full 1-Line without any truncation) */}
                        <div className="pt-0.5 pb-1">
                          <h4 className="text-[8.5px] sm:text-xs font-black text-slate-900 group-hover:text-[#009245] transition-colors leading-tight whitespace-nowrap overflow-visible tracking-tight">
                            {lang === 'bn' ? item.nameBn : item.nameEn}
                          </h4>
                        </div>

                        {/* Bottom Row: Highlighted Product Count & Arrow Button */}
                        <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                          {/* Highlighted Product Count Badge */}
                          <span className="bg-emerald-50 text-[#009245] font-extrabold text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded-md border border-emerald-200/60 shadow-2xs">
                            {item.count} {lang === 'bn' ? 'পণ্য' : 'items'}
                          </span>

                          {/* Arrow Button */}
                          <div className="w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full bg-slate-100 group-hover:bg-[#009245] text-slate-500 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                            <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* CASE 2: CATEGORY / PRODUCT LISTING PAGE (No Banner, 1-Line Filters) */
        /* ------------------------------------------------------------- */
        <div className="space-y-2 sm:space-y-3">
          
          {/* Top Strip Bar when Subcategory is active */}
          {currentSlug === 'shop_tab' ? (
            <div className="bg-white dark:bg-slate-900 py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl shadow-2xs border border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  onClick={() => setSelectedSubCategory(null)}
                  className="px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg inline-flex items-center gap-1 transition-colors shadow-2xs cursor-pointer shrink-0 active:scale-95"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'ফিরে যান' : 'Back'}</span>
                </button>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                  <button
                    onClick={() => setSelectedSubCategory(null)}
                    className="hover:text-[#009245] transition-colors flex items-center gap-1 shrink-0"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-[#009245]" />
                    <span>{lang === 'bn' ? 'সকল পণ্য' : 'All Products'}</span>
                  </button>
                  <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="text-slate-900 dark:text-white font-black truncate">{selectedSubCategory}</span>
                </div>
              </div>
              <div className="bg-emerald-50 text-[#009245] font-extrabold text-xs px-2.5 py-1 rounded-lg border border-emerald-200/80 shadow-2xs shrink-0">
                {displayProducts.length} {lang === 'bn' ? 'টি পণ্য' : 'Items'}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 py-1 sm:py-1.5 px-2.5 sm:px-3 rounded-xl shadow-2xs border border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <button
                  onClick={() => setSelectedSubCategory(null)}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg inline-flex items-center gap-1 transition-colors shadow-2xs cursor-pointer shrink-0 active:scale-95"
                >
                  <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>{lang === 'bn' ? 'ফিরে যান' : 'Back'}</span>
                </button>
                <nav className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-slate-500 truncate">
                  <button
                    onClick={() => setPublicCategory('all')}
                    className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors shrink-0"
                  >
                    <Home className="w-3 h-3 text-slate-400" />
                    <span>{lang === 'bn' ? 'হোম' : 'Home'}</span>
                  </button>
                  <ChevronRight className="w-2.5 h-2.5 text-slate-300 shrink-0" />
                  <button
                    onClick={() => setSelectedSubCategory(null)}
                    className="hover:text-slate-900 dark:hover:text-white transition-colors uppercase font-bold text-slate-500 shrink-0 truncate max-w-[80px] sm:max-w-none"
                  >
                    {categoryConfig.title}
                  </button>
                  <ChevronRight className="w-2.5 h-2.5 text-slate-300 shrink-0" />
                  <span className="text-slate-900 dark:text-white font-black truncate">{selectedSubCategory}</span>
                </nav>
              </div>
            </div>
          )}

          {/* Section Bar: Title & Count + Non-Scrollable 100% Fit 1-Line Action Bar */}
          <div className="bg-white dark:bg-slate-900 p-2 sm:p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-1.5 sm:space-y-2">
            
            {/* Title & Count */}
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                {selectedSubCategory}
              </h2>
              <span className="bg-emerald-50 text-[#009245] border border-emerald-200 text-[9.5px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                {displayProducts.length} {lang === 'bn' ? 'টি পণ্য' : 'items'}
              </span>
            </div>

            {/* Exact 100% Width Fit (Zero Scrollbar on any screen) */}
            <div className="flex items-center justify-between gap-1 sm:gap-2 w-full text-xs">
              
              {/* Category Button */}
              <button
                onClick={() => {
                  setCategoryDrawerOpen(true);
                  setFilterDrawerOpen(false);
                }}
                className="flex-1 min-w-0 inline-flex items-center justify-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/90 py-1.5 px-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
              >
                <Shirt className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#009245] shrink-0" />
                <span className="truncate">{lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}</span>
              </button>

              {/* Filter Button */}
              <button
                onClick={() => {
                  setFilterDrawerOpen(true);
                  setCategoryDrawerOpen(false);
                }}
                className="flex-1 min-w-0 inline-flex items-center justify-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/90 py-1.5 px-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
              >
                <SlidersHorizontal className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#009245] shrink-0" />
                <span className="truncate">{lang === 'bn' ? 'ফিল্টার' : 'Filter'}</span>
              </button>

              {/* Sort Dropdown */}
              <div className="flex-[1.2] min-w-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/90 rounded-lg py-1.5 px-1 text-slate-700 font-bold focus:outline-none focus:border-[#009245] shadow-2xs cursor-pointer text-[10px] sm:text-xs truncate"
                >
                  <option value="popular">{lang === 'bn' ? 'জনপ্রিয়তা' : 'Popular'}</option>
                  <option value="newest">{lang === 'bn' ? 'নতুন পণ্য' : 'Newest'}</option>
                  <option value="price_asc">{lang === 'bn' ? 'দাম: কম' : 'Price: Low'}</option>
                  <option value="price_desc">{lang === 'bn' ? 'দাম: বেশি' : 'Price: High'}</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center border border-slate-200/90 rounded-lg p-0.5 bg-slate-50 shadow-2xs shrink-0">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded ${
                    viewMode === 'grid'
                      ? 'bg-[#009245] text-white'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded ${
                    viewMode === 'list'
                      ? 'bg-[#009245] text-white'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="List View"
                >
                  <List className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>

              {/* Items Per Page Dropdown (Desktop Only) */}
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200/90 rounded-lg px-2 py-1.5 text-slate-700 font-semibold focus:outline-none focus:border-[#009245] shadow-2xs cursor-pointer text-[11px] hidden md:block shrink-0"
              >
                <option value={24}>{lang === 'bn' ? '২৪ টি প্রতি পেজ' : '24 per page'}</option>
                <option value={36}>{lang === 'bn' ? '৩৬ টি প্রতি পেজ' : '36 per page'}</option>
                <option value={48}>{lang === 'bn' ? '৪৮ টি প্রতি পেজ' : '48 per page'}</option>
              </select>

            </div>
          </div>

          {/* 5-Column Full-Width Clean Product Grid or Empty State */}
          {displayProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
              {displayProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  compact={true}
                  onCardClick={() => setViewingProduct(product)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 text-center max-w-lg mx-auto my-6 shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#009245] mx-auto shadow-2xs">
                <Shirt className="w-7 h-7" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {lang === 'bn' ? `"${selectedSubCategory}" এ বর্তমানে কোনো পণ্য নেই` : `No products found in "${selectedSubCategory}"`}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                {lang === 'bn'
                  ? 'এই সাব-ক্যাটাগরিতে শীঘ্রই নতুন স্টক যুক্ত করা হবে। এই ক্যাটাগরির অন্যান্য সকল পণ্য দেখতে নিচের বাটনে ক্লিক করুন।'
                  : 'New stocks will be added soon. Click below to view all available products in this category.'}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSubCategory(null)}
                  className="bg-[#009245] hover:bg-[#007a3a] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{lang === 'bn' ? `সকল ${categoryConfig.title} পণ্য দেখুন` : `View All ${categoryConfig.title} Products`}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SIDE DRAWER 1: CATEGORY DRAWER (Compact on Mobile)            */}
      {/* ------------------------------------------------------------- */}
      {categoryDrawerOpen && (
        <div className="fixed inset-0 z-[1000] flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-2xs"
            onClick={() => setCategoryDrawerOpen(false)}
          />
          <div className="relative w-[78%] max-w-[270px] bg-white h-full shadow-2xl z-10 flex flex-col p-3 sm:p-4 rounded-r-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-3.5 bg-[#009245] rounded-full inline-block" />
                <h3 className="font-black text-slate-900 text-xs sm:text-sm">
                  {lang === 'bn' ? 'ক্যাটাগরি সমূহ' : 'All Categories'}
                </h3>
              </div>
              <button
                onClick={() => setCategoryDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2 space-y-2">
              <button
                onClick={() => {
                  setSelectedSubCategory(null);
                  setCategoryDrawerOpen(false);
                }}
                className="w-full text-left py-1.5 px-2.5 rounded-lg text-xs font-bold text-slate-800 hover:bg-slate-50 flex items-center justify-between border border-slate-100"
              >
                <div className="flex items-center gap-1.5">
                  <Shirt className="w-3.5 h-3.5 text-[#009245]" />
                  <span>{categoryConfig.title} (সকল)</span>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-400" />
              </button>

              {categoryConfig.groups.map((group) => (
                <div key={group.id} className="space-y-0.5">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    {group.titleBn}
                  </h5>
                  {group.items.map((subcat) => (
                    <button
                      key={subcat.id}
                      onClick={() => {
                        setSelectedSubCategory(subcat.nameBn);
                        setCategoryDrawerOpen(false);
                      }}
                      className={`w-full text-left py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-between transition-all ${
                        selectedSubCategory === subcat.nameBn
                          ? 'bg-[#009245] text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Shirt className={`w-3 h-3 ${selectedSubCategory === subcat.nameBn ? 'text-white' : 'text-slate-400'}`} />
                        <span>{subcat.nameBn}</span>
                      </div>
                      <span className={`text-[9.5px] ${selectedSubCategory === subcat.nameBn ? 'text-emerald-100' : 'text-slate-400'}`}>
                        ({subcat.count})
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <div className="pt-2 pb-2 sm:pb-0 border-t border-slate-100">
              <button
                onClick={() => setCategoryDrawerOpen(false)}
                className="w-full py-1.5 bg-slate-100 text-slate-800 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SIDE DRAWER 2: FILTER DRAWER (Sleek, Compact & Small on Mobile) */}
      {/* ------------------------------------------------------------- */}
      {filterDrawerOpen && (
        <div className="fixed inset-0 z-[1000] flex justify-end animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-2xs"
            onClick={() => setFilterDrawerOpen(false)}
          />
          <div className="relative w-[78%] max-w-[270px] bg-white h-full shadow-2xl z-10 flex flex-col p-3 sm:p-4 rounded-l-2xl animate-in slide-in-from-right duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-3.5 bg-[#009245] rounded-full inline-block" />
                <h3 className="font-black text-slate-900 text-xs sm:text-sm">
                  {lang === 'bn' ? 'ফিল্টার করুন' : 'Filter Products'}
                </h3>
              </div>
              <button
                onClick={() => setFilterDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto py-2 space-y-3 text-xs">
              
              {/* Max Price */}
              <div className="space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800 text-[11px]">
                  <span>{lang === 'bn' ? 'সর্বোচ্চ দাম (৳)' : 'Max Price (৳)'}</span>
                  <span className="font-mono text-[#009245]">৳{maxPrice.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max={Math.max(10000, maxProductPrice)}
                  step={maxProductPrice > 50000 ? "1000" : "250"}
                  value={maxPrice > Math.max(10000, maxProductPrice) ? Math.max(10000, maxProductPrice) : maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#009245] cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>৳ ৫০০</span>
                  <span>৳ {Math.max(10000, maxProductPrice).toLocaleString()}+</span>
                </div>
              </div>

              {/* Brand */}
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 text-[11px]">{lang === 'bn' ? 'ব্র্যান্ড' : 'Brand'}</h4>
                <div className="space-y-0.5">
                  {['Premium', 'Original', 'Local', 'Imported'].map((brand) => (
                    <label
                      key={brand}
                      onClick={() => toggleBrand(brand)}
                      className="flex items-center justify-between cursor-pointer text-slate-600 hover:text-slate-900 select-none py-0.5"
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${
                            selectedBrands.includes(brand)
                              ? 'bg-[#009245] border-[#009245] text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {selectedBrands.includes(brand) && <Check className="w-2 h-2 stroke-3" />}
                        </div>
                        <span className="text-[11px]">{brand}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 text-[11px]">{lang === 'bn' ? 'রেটিং' : 'Rating'}</h4>
                <div className="space-y-0.5">
                  {[5, 4, 3].map((stars) => (
                    <label
                      key={stars}
                      onClick={() => setSelectedRating(stars)}
                      className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900 select-none py-0.5"
                    >
                      <div
                        className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${
                          selectedRating === stars
                            ? 'bg-[#009245] border-[#009245] text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {selectedRating === stars && <Check className="w-2 h-2 stroke-3" />}
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[...Array(stars)].map((_, i) => (
                          <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        ))}
                        <span className="text-[10px] text-slate-400 ml-1 font-normal">
                          {stars} {lang === 'bn' ? 'স্টার ও উপরে' : 'Stars & up'}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions with comfortable bottom safe padding */}
            <div className="pt-2 pb-2 sm:pb-0 border-t border-slate-100 flex items-center gap-1.5">
              <button
                onClick={() => {
                  setMaxPrice(10000);
                  setSelectedBrands(['Premium']);
                  setSelectedRating(5);
                }}
                className="py-2 px-2.5 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold hover:bg-slate-200 transition-colors flex items-center gap-1 shrink-0 active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{lang === 'bn' ? 'রিসেট' : 'Reset'}</span>
              </button>

              <button
                onClick={() => setFilterDrawerOpen(false)}
                className="flex-1 py-2 bg-[#009245] hover:bg-[#007a3a] text-white rounded-lg text-[11px] font-bold shadow-2xs transition-colors flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
              >
                <Filter className="w-3 h-3" />
                <span>{lang === 'bn' ? 'প্রয়োগ করুন' : 'Apply'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      </ScrollReveal>
    </div>
  );
};
