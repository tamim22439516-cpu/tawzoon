import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.js';
import { getAdjustedSellingPrice, getAdjustedRegularPrice, getResellerProfitPerUnit } from '../utils/pricing.js';
import { getProductSizes } from '../utils/productSizes.js';
import {
  X,
  Copy,
  Share2,
  Check,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2,
  Phone,
  ChevronLeft,
  ChevronRight,
  Home,
  Package,
  Plus,
  Minus
} from 'lucide-react';
import { ProductGallery } from './ProductGallery.js';

export const ProductDetailsModal: React.FC = () => {
  const { lang, t, selectedProduct, setSelectedProduct, showToast, employee, brandSettings, setActivePortal, addToCart, openCheckoutModal } = useApp();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [isAddingToOrder, setIsAddingToOrder] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAddingToOrder(sessionStorage.getItem('tawzoon_is_adding_to_order') === 'true');
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (selectedProduct) {
      const primary =
        selectedProduct.images?.find(i => i.isPrimary)?.url ||
        selectedProduct.images?.[0]?.url ||
        selectedProduct.imageUrl ||
        '/images/product_shop_dress_1790244714775.jpg';
      setSelectedImageUrl(primary);
      const availableSizes = getProductSizes(selectedProduct);
      setSelectedSize(availableSizes.length > 0 ? availableSizes[0] : 'স্ট্যান্ডার্ড');
      setSelectedQuantity(1);
    }
  }, [selectedProduct]);

  if (!selectedProduct) return null;

  const title = lang === 'bn' ? selectedProduct.nameBn : selectedProduct.nameEn;
  const subcat = lang === 'bn' ? selectedProduct.subcategoryBn : selectedProduct.subcategoryEn;
  const sellingPrice = getAdjustedSellingPrice(selectedProduct, employee, brandSettings);
  const regularPrice = getAdjustedRegularPrice(selectedProduct, employee, brandSettings);
  const discountPercent = regularPrice > sellingPrice
    ? Math.round(((regularPrice - sellingPrice) / regularPrice) * 100)
    : 0;
  const shortDesc = lang === 'bn' ? selectedProduct.shortDescBn : selectedProduct.shortDescEn;
  const fullDesc = lang === 'bn' ? selectedProduct.fullDescBn : selectedProduct.fullDescEn;

  // Calculate freelancer commission preview
  const commissionPreview =
    selectedProduct.commissionType === 'percentage'
      ? Math.round((selectedProduct.sellingPrice * (employee?.customCommissionRate || selectedProduct.commissionRate)) / 100)
      : selectedProduct.commissionRate;

  // Referral URL
  const referralUrl = employee
    ? `${window.location.origin}/?ref=${employee.id}&product=${selectedProduct.productCode}`
    : `${window.location.origin}/?product=${selectedProduct.productCode}`;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(t.copiedToast);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyMarketingCaption = () => {
    const customCaption = lang === 'bn' ? selectedProduct.marketingCaptionBn : selectedProduct.marketingCaptionEn;
    const caption =
      customCaption ||
      `🔥 ${title} 🔥\n\n${shortDesc}\n\n📌 পণ্যের কোড: ${selectedProduct.productCode}\n💰 বিশেষ অফার মূল্য: ৳${sellingPrice.toLocaleString()}\n📦 ডেলিভারি: সমগ্র বাংলাদেশে ক্যাশ অন হোম ডেলিভারি।\n\nঅর্ডার করতে এখনি মেসেজ দিন বা আমাদের সাথে যোগাযোগ করুন!`;
    handleCopy(caption, 'caption');
  };

  const handleCopyFullDetails = () => {
    const specsText =
      selectedProduct.specifications
        ?.map(s => `• ${lang === 'bn' ? s.keyBn : s.keyEn}: ${lang === 'bn' ? s.valBn : s.valEn}`)
        .join('\n') || '';

    const text = `${title}\n${t.productCode}: ${selectedProduct.productCode}\n${t.sellingPrice}: ৳${sellingPrice}\n\n${fullDesc}\n\n${specsText}`;
    handleCopy(text, 'specs');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title,
          text: `${title} - ৳${sellingPrice}`,
          url: referralUrl,
        })
        .catch(() => {});
    } else {
      handleCopy(referralUrl, 'share');
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setSelectedProduct(null)}
              className="px-2.5 py-1 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200/80 inline-flex items-center gap-1 transition-colors shadow-2xs cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
              <span>{lang === 'bn' ? 'ফিরে যান' : 'Back'}</span>
            </button>

            <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 whitespace-nowrap">
              <button
                onClick={() => setSelectedProduct(null)}
                className="hover:text-[#009245] transition-colors flex items-center gap-1 text-slate-600"
              >
                <Home className="w-3.5 h-3.5 text-slate-400" />
                <span>{lang === 'bn' ? 'হোম' : 'Home'}</span>
              </button>
              <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
              <span className="uppercase font-bold text-slate-600">{selectedProduct.categorySlug || 'SHOP'}</span>
              {subcat && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                  <span className="text-slate-600">{subcat}</span>
                </>
              )}
              <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
              <span className="text-slate-900 font-black truncate max-w-[120px] sm:max-w-[180px]">{title}</span>
            </nav>
          </div>

          <button
            onClick={() => setSelectedProduct(null)}
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors shrink-0 ml-auto"
            title={t.closeModal}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Gallery Column (6 cols) with Video & Multi-image carousel */}
            <div className="md:col-span-6">
              <ProductGallery
                product={selectedProduct}
                lang={lang}
                onImageChange={(url) => setSelectedImageUrl(url)}
              />
            </div>

            {/* Product Details Column (6 cols) */}
            <div className="md:col-span-6 space-y-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  {title}
                </h2>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs text-slate-500 font-mono">
                    {t.productCode}: {selectedProduct.productCode}
                  </span>
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {selectedProduct.stockStatus === 'in_stock' ? t.stockInStock : t.stockLowStock}
                  </span>
                </div>
              </div>

              {/* Pricing & Commission Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs text-slate-500 font-medium block">{t.sellingPrice}</span>
                    {discountPercent > 0 && (
                      <span className="text-[10px] font-bold text-white bg-rose-600 px-1.5 py-0.2 rounded-md leading-none">
                        -{discountPercent}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                      ৳{sellingPrice.toLocaleString()}
                    </span>
                    {regularPrice > sellingPrice && (
                      <span className="text-sm text-slate-400 line-through font-mono font-normal">
                        ৳{regularPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right pl-4 border-l border-slate-200">
                  <span className="text-xs text-slate-500 font-medium block">
                    {lang === 'bn' ? 'মার্কেটার কমিশন' : 'Marketer Payout'}
                  </span>
                  <span className="text-lg font-bold text-emerald-600 font-mono">
                    +৳{commissionPreview.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    ({selectedProduct.commissionType === 'percentage' ? `${selectedProduct.commissionRate}%` : 'Fixed'})
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {lang === 'bn' ? 'বিবরণ' : 'Description'}
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {fullDesc || shortDesc}
                </p>
              </div>

              {/* Marketing Highlights Bullets */}
              {selectedProduct.marketingHighlights && selectedProduct.marketingHighlights.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {lang === 'bn' ? 'মূল বিক্রয় বৈশিষ্ট্য' : 'Key Selling Highlights'}
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {selectedProduct.marketingHighlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Colors & Sizes Selection */}
              <div className="space-y-3 pt-1">
                {/* Size Selection */}
                {getProductSizes(selectedProduct).length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        {lang === 'bn' ? 'সাইজ নির্বাচন করুন:' : 'Select Size:'}
                      </h4>
                      <span className="text-xs font-bold text-[#009245]">
                        {lang === 'bn' ? `সিলেক্টেড: ${selectedSize}` : `Selected: ${selectedSize}`}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-xs font-medium">
                      {getProductSizes(selectedProduct).map(sz => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedSize(sz)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                            selectedSize === sz
                              ? 'bg-[#009245] text-white border-[#009245] shadow-xs scale-102 ring-2 ring-[#009245]/20'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-xs font-bold text-slate-700">
                    {lang === 'bn' ? 'পরিমাণ:' : 'Quantity:'}
                  </span>
                  <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-3xs">
                    <button
                      type="button"
                      onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                      className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-black font-mono">{selectedQuantity}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                      className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Specifications Table */}
              {selectedProduct.specifications && selectedProduct.specifications.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {t.specifications}
                  </h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                    {selectedProduct.specifications.map((spec, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2 ${
                          idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'
                        } border-b border-slate-100 last:border-0`}
                      >
                        <span className="font-medium text-slate-500">
                          {lang === 'bn' ? spec.keyBn : spec.keyEn}
                        </span>
                        <span className="font-semibold text-slate-800">
                          {lang === 'bn' ? spec.valBn : spec.valEn}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Actions */}
              <div className="pt-2 space-y-2">
                {isAddingToOrder ? (
                  /* Adding to Order Mode Action */
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        const activeImg =
                          selectedImageUrl ||
                          selectedProduct.images?.find(i => i.isPrimary)?.url ||
                          selectedProduct.images?.[0]?.url ||
                          selectedProduct.imageUrl ||
                          '/images/product_shop_dress_1790244714775.jpg';

                        let currentItems: any[] = [];
                        try {
                          const saved = sessionStorage.getItem('tawzoon_pending_order_items');
                          if (saved) currentItems = JSON.parse(saved);
                        } catch {}

                        const newItem = {
                          productId: selectedProduct.id,
                          originalProduct: {
                            ...selectedProduct,
                            imageUrl: activeImg,
                            selectedImageUrl: activeImg,
                          },
                          productName: lang === 'bn' ? selectedProduct.nameBn : (selectedProduct.nameEn || selectedProduct.nameBn),
                          productCode: selectedProduct.productCode,
                          imageUrl: activeImg,
                          size: selectedSize || 'M',
                          quantity: selectedQuantity || 1,
                          unitPrice: sellingPrice,
                        };

                        const existingIdx = currentItems.findIndex(
                          it => it.productId === newItem.productId && it.size === newItem.size && it.imageUrl === newItem.imageUrl
                        );

                        let updatedItems: any[] = [];
                        if (existingIdx >= 0) {
                          updatedItems = [...currentItems];
                          updatedItems[existingIdx].quantity += newItem.quantity;
                        } else {
                          updatedItems = [...currentItems, newItem];
                        }

                        sessionStorage.setItem('tawzoon_pending_order_items', JSON.stringify(updatedItems));
                        sessionStorage.removeItem('tawzoon_is_adding_to_order');
                        window.dispatchEvent(new Event('tawzoon_order_mode_changed'));

                        showToast(lang === 'bn' ? `✓ '${title}' (${selectedSize}) সফলভাবে অর্ডারে যুক্ত হয়েছে!` : `✓ Added '${title}' (${selectedSize}) to Order!`, 'success');
                        setSelectedProduct(null);
                        openCheckoutModal(
                          updatedItems.map(it => ({
                            product: it.originalProduct || it.product || selectedProduct,
                            size: it.size,
                            quantity: it.quantity,
                          }))
                        );
                      }}
                      className="w-full bg-[#009245] hover:bg-[#007a38] text-white py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
                    >
                      <Package className="w-4 h-4" />
                      <span>{lang === 'bn' ? '+ অর্ডারে এই পণ্যটি যুক্ত করুন' : '+ Add This Product to Order'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const activeImg =
                          selectedImageUrl ||
                          selectedProduct.images?.find(i => i.isPrimary)?.url ||
                          selectedProduct.imageUrl ||
                          '/images/product_shop_dress_1790244714775.jpg';
                        addToCart({
                          ...selectedProduct,
                          imageUrl: activeImg,
                        } as any);
                        showToast(lang === 'bn' ? 'পণ্যটি কার্টেও যুক্ত হয়েছে' : 'Added to cart as well');
                      }}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>{lang === 'bn' ? 'কার্টেও যোগ করুন' : 'Add to Cart as Well'}</span>
                    </button>
                  </div>
                ) : (
                  /* Standard Public Order Actions */
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const activeImg =
                          selectedImageUrl ||
                          selectedProduct.images?.find(i => i.isPrimary)?.url ||
                          selectedProduct.images?.[0]?.url ||
                          selectedProduct.imageUrl ||
                          '/images/product_shop_dress_1790244714775.jpg';
                        addToCart({
                          ...selectedProduct,
                          imageUrl: activeImg,
                        } as any);
                        showToast(lang === 'bn' ? 'পণ্যটি কার্টে যোগ করা হয়েছে' : 'Added to cart');
                      }}
                      className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-[#009245] border border-emerald-300 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>{lang === 'bn' ? 'কার্টে যোগ করুন' : 'Add to Cart'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProduct(null);
                        const activeImg =
                          selectedImageUrl ||
                          selectedProduct.images?.find(i => i.isPrimary)?.url ||
                          selectedProduct.images?.[0]?.url ||
                          selectedProduct.imageUrl ||
                          '/images/product_shop_dress_1790244714775.jpg';
                        openCheckoutModal([{
                          product: {
                            ...selectedProduct,
                            imageUrl: activeImg,
                          } as any,
                          size: selectedSize || 'M',
                          quantity: selectedQuantity || 1,
                        }]);
                      }}
                      className="w-full bg-[#009245] hover:bg-[#007a38] text-white py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer active:scale-95"
                    >
                      <span>{lang === 'bn' ? 'এখনই অর্ডার করুন' : 'Order Now'}</span>
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 pt-1 text-slate-400 text-xs">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'প্রয়োজনে কল দিন: ' : 'Helpline: '}</span>
                  <a href={`tel:${brandSettings?.helplinePhone || '01800000000'}`} className="font-mono font-bold text-slate-600 hover:text-[#009245]">
                    {brandSettings?.helplinePhone || '01800000000'}
                  </a>
                </div>
              </div>

            </div>
          </div>

          {/* Freelancer Referral Link & Marketing Hub */}
          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-slate-900" />
                <span>{t.marketingTools}</span>
              </div>
              <span className="text-xs text-slate-500">
                {employee
                  ? (lang === 'bn' ? `আপনার রেফারেল কোড: ${employee.name}` : `Referral Active: ${employee.name}`)
                  : (lang === 'bn' ? 'সোশ্যাল মিডিয়ায় শেয়ার ও বিক্রির জন্য প্রস্তুত' : 'Ready for marketing & resale')}
              </span>
            </div>

            {/* Unique Referral Link Box */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-600 truncate w-full">
                <LinkIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono text-[11px] truncate">{referralUrl}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  onClick={() => handleCopy(referralUrl, 'referral')}
                  className="w-full sm:w-auto px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-md inline-flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  {copiedField === 'referral' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>{lang === 'bn' ? 'কপি হয়েছে' : 'Copied'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>{employee ? (lang === 'bn' ? 'রেফারেল লিংক কপি' : 'Copy Referral') : (lang === 'bn' ? 'প্রোডাক্ট লিংক কপি' : 'Copy Link')}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleShare}
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-md inline-flex items-center gap-1.5"
                  title="Share"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{t.shareProduct}</span>
                </button>
              </div>
            </div>

            {/* If not logged in as employee, invite to join */}
            {!employee && (
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-3 flex items-center justify-between gap-3">
                <div className="text-xs text-emerald-900">
                  <span className="font-bold block">
                    {lang === 'bn' ? 'রিসেলার বা অ্যাফিলিয়েট মার্কেটার হতে চান?' : 'Want to earn from this product?'}
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    {lang === 'bn'
                      ? `প্রতি সেলে ৳${commissionPreview.toLocaleString()} পর্যন্ত নিশ্চিত কমিশন আয় করুন।`
                      : `Earn up to ৳${commissionPreview.toLocaleString()} on every successful sale.`}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedProduct(null);
                    setActivePortal('employee');
                  }}
                  className="shrink-0 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs transition-colors"
                >
                  {lang === 'bn' ? 'একাউন্ট খুলুন' : 'Join as Marketer'}
                </button>
              </div>
            )}

            {/* Quick Copy Toolkit */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <button
                onClick={() => handleCopy(title, 'title')}
                className="py-2.5 px-3 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedField === 'title' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{t.copyProductName}</span>
              </button>

              <button
                onClick={handleCopyMarketingCaption}
                className="py-2.5 px-3 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedField === 'caption' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{t.copyMarketingCaption}</span>
              </button>

              <button
                onClick={handleCopyFullDetails}
                className="py-2.5 px-3 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedField === 'specs' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{t.copyProductDetails}</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
