interface LogoProps {
  className?: string;
}

export default function Logo({ className = '' }: LogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <img
        src="/assets/tadilatyap-logo.png"
        alt="tadilatyap.com"
        className="h-8 md:h-10 w-auto object-contain"
        draggable={false}
      />
    </div>
  );
}
