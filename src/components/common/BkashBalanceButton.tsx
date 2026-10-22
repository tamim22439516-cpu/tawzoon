import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext.js';
import { RotateCw } from 'lucide-react';

interface BkashBalanceButtonProps {
  className?: string;
  compact?: boolean;
}

export const BkashBalanceButton: React.FC<BkashBalanceButtonProps> = ({
  className = '',
  compact = false,
}) => {
  const {
    lang,
    employee,
    isEmployeeAuthenticated,
    refreshEmployeeProfile,
    setActivePortal,
    showToast,
  } = useApp();

  const [isShowingBalance, setIsShowingBalance] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleTap = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // If currently showing balance, tap again hides it immediately
    if (isShowingBalance) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsShowingBalance(false);
      return;
    }

    // If not authenticated, prompt to login
    if (!isEmployeeAuthenticated || !employee) {
      showToast(
        lang === 'bn'
          ? 'ব্যালেন্স দেখতে রিসেলার অ্যাকাউন্টে লগইন করুন।'
          : 'Please login to view reseller balance.',
        'info'
      );
      setActivePortal('employee');
      return;
    }

    // Trigger refreshing animation and fetch latest balance
    setIsRefreshing(true);
    try {
      await refreshEmployeeProfile();
    } catch {
      // ignore
    } finally {
      setIsRefreshing(false);
      setIsShowingBalance(true);

      // Auto-hide balance after 4.5 seconds
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setIsShowingBalance(false);
      }, 4500);
    }
  };

  const availableBalance = employee?.wallet?.availableBalance ?? 0;

  // Format currency with Bengali or English digits
  const formattedBalance = lang === 'bn'
    ? `৳ ${availableBalance.toLocaleString('bn-BD')}`
    : `৳ ${availableBalance.toLocaleString('en-US')}`;

  return (
    <button
      type="button"
      onClick={handleTap}
      title={
        !isEmployeeAuthenticated
          ? (lang === 'bn' ? 'লগইন করে ব্যালেন্স দেখুন' : 'Login to view balance')
          : (isShowingBalance
              ? (lang === 'bn' ? 'ব্যালেন্স লুকাতে চাপুন' : 'Tap to hide balance')
              : (lang === 'bn' ? 'ব্যালেন্স দেখতে চাপুন' : 'Tap to view balance'))
      }
      aria-label="Check Balance"
      className={`group relative overflow-hidden rounded-xl border-1.5 sm:border-2 border-[#009245] bg-[#f2faf5] dark:bg-slate-800 hover:bg-[#e4f5eb] shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:scale-95 transition-all duration-200 select-none cursor-pointer flex items-center shrink-0 ${
        compact ? 'pl-1 pr-2.5 py-0.5 sm:pl-1.5 sm:pr-3 sm:py-1 gap-1.5' : 'pl-1.5 pr-3 py-1 gap-2'
      } ${className}`}
    >
      {/* Left Circular Taka/Coin Icon Badge */}
      <div
        className={`rounded-lg bg-[#009245] text-white flex items-center justify-center font-bold shadow-xs transition-transform duration-200 shrink-0 ${
          compact ? 'w-5 h-5 sm:w-6 sm:h-6 text-[11.5px] sm:text-[12.5px]' : 'w-6 h-6 text-[12.5px]'
        } ${isRefreshing ? 'animate-spin' : 'group-hover:scale-105'}`}
      >
        {isRefreshing ? (
          <RotateCw className="w-3 h-3 animate-spin" />
        ) : (
          <span className="leading-none select-none font-bold text-center">৳</span>
        )}
      </div>

      {/* Center Label / Balance Value */}
      <div className="flex items-center min-w-0 pr-0.5">
        {isRefreshing ? (
          <span className="text-[11px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-0.5 animate-pulse">
            <span>লোড হচ্ছে</span>
          </span>
        ) : isShowingBalance ? (
          <div className="flex items-center animate-in fade-in slide-in-from-left-1 duration-150">
            <span className="text-xs sm:text-sm font-black text-[#009245] dark:text-emerald-400 tracking-tight whitespace-nowrap">
              {formattedBalance}
            </span>
          </div>
        ) : (
          <div className="flex items-center">
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight whitespace-nowrap">
              {!isEmployeeAuthenticated
                ? (lang === 'bn' ? 'ব্যালেন্স' : 'Balance')
                : (lang === 'bn' ? 'ব্যালেন্স' : 'Balance')}
            </span>
          </div>
        )}
      </div>
    </button>
  );
};
