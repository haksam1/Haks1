import React from 'react';
import { clsx } from 'clsx';

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  showText?: boolean;
};

const BrandLogo: React.FC<BrandLogoProps> = ({
  className,
  markClassName,
  textClassName,
  showText = false,
}) => {
  return (
    <span className={clsx('inline-flex items-center gap-2 text-slate-900', className)}>
      <img
        src="/kincore_logo_v4.svg"
        alt="KinCore logo"
        className={clsx('h-14 w-32 shrink-0 object-contain', markClassName)}
      />
      {showText && (
        <span className={clsx('font-extrabold tracking-tight', textClassName)}>
          KinCore
        </span>
      )}
    </span>
  );
};

export default BrandLogo;
