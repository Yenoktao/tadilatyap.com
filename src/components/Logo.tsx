interface LogoProps {
  className?: string;
}

export default function Logo({ className = '' }: LogoProps) {
  return (
    <div className={`flex items-center bg-[#002D72] px-3 py-1.5 rounded ${className}`}>
      <img
        src="/assets/tadilatyap-logo.png"
        alt="tadilatyap.com"
        className="h-8 md:h-10 w-auto object-contain"
        draggable={false}
      />
    </div>
  );
}
