import React from 'react';

/**
 * CineBadge: Biểu tượng CINE squircle màu hồng với chữ CINE trắng in hoa đậm.
 * Chuẩn nhận diện thương hiệu, không viền đen/khung tối bao quanh, trong suốt góc bo.
 */
export default function CineBadge({ className = "h-7 w-7", ...props }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient id="cineBadgeGradComp" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ff1379" />
          <stop offset="100%" stopColor="#d60064" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="26" fill="url(#cineBadgeGradComp)" />
      <text
        x="50"
        y="53"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ffffff"
        fontFamily="Outfit, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontWeight="900"
        fontSize="28"
        letterSpacing="0.5"
      >
        CINE
      </text>
    </svg>
  );
}

