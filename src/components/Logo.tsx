interface LogoProps {
  className?: string;
}

export default function Logo({ className = '' }: LogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <svg
        viewBox="0 0 260 42"
        className="h-7 md:h-9 w-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* "tadilat" — thin, architectural spacing */}
        <text
          x="0"
          y="32"
          fontFamily="Raleway, sans-serif"
          fontWeight="300"
          fontSize="28"
          fill="white"
          letterSpacing="7"
        >
          tadilat
        </text>

        {/* Subtle dot separator */}
        <circle cx="138" cy="27" r="1.5" fill="white" opacity="0.4" />

        {/* "yap" — bold, steel blue accent */}
        <text
          x="148"
          y="32"
          fontFamily="Raleway, sans-serif"
          fontWeight="700"
          fontSize="28"
          fill="#74B9FF"
          letterSpacing="5"
        >
          yap
        </text>

        {/* ".com" — muted, smaller */}
        <text
          x="222"
          y="32"
          fontFamily="Raleway, sans-serif"
          fontWeight="300"
          fontSize="15"
          fill="white"
          opacity="0.45"
          letterSpacing="2"
        >
          .com
        </text>
      </svg>
    </div>
  );
}
