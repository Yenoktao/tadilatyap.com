import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

/* ── Shader code ── */
const vertexShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uScrollSpeed;
  uniform vec2 uMouse;

  // Simplex 3D Noise
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  float snoise(vec3 v){ 
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod(i, 289.0); 
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0/7.0;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vUv = uv;
    float time = uTime * 0.2;
    float mouseRipple = smoothstep(0.5, 0.0, distance(uv, uMouse)) * 0.5;
    float noise = snoise(vec3(position.x * 0.02, position.y * 0.02, time)) * 15.0;
    float newZ = position.z + noise + (sin(time * 2.0 + position.x) * uScrollSpeed * 5.0) + mouseRipple;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position.x, position.y, newZ, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  uniform vec3 uColor1;
  uniform vec3 uColor2;

  void main() {
    vec3 finalColor = mix(uColor1, uColor2, vUv.y + (sin(vUv.x * 10.0) * 0.1));
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

/* ── Topographic Mesh Component ── */
function TopographicMesh({ scrollSpeed }: { scrollSpeed: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const timerRef = useRef<THREE.Timer | null>(null);

  const uniforms = useRef({
    uTime: { value: 0 },
    uScrollSpeed: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uColor1: { value: new THREE.Color('#2D3436') },
    uColor2: { value: new THREE.Color('#636E72') },
  });

  useEffect(() => {
    timerRef.current = new THREE.Timer();
    timerRef.current.start();
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      mouseRef.current = {
        x: clientX / innerWidth,
        y: 1 - clientY / innerHeight,
      };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      timerRef.current?.dispose();
    };
  }, []);

  useFrame(() => {
    timerRef.current?.update();
    if (materialRef.current && timerRef.current) {
      materialRef.current.uniforms.uTime.value = timerRef.current.getElapsed();
      materialRef.current.uniforms.uScrollSpeed.value +=
        (scrollSpeed - materialRef.current.uniforms.uScrollSpeed.value) * 0.08;
      materialRef.current.uniforms.uMouse.value.lerp(
        new THREE.Vector2(mouseRef.current.x, mouseRef.current.y),
        0.05
      );
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2.5, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[20, 20, 100, 100]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms.current}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export default function AIAssistant() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const [scrollSpeed, setScrollSpeed] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Track scroll velocity
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const delta = window.scrollY - lastScrollY;
          setScrollSpeed(Math.abs(delta) * 0.01);
          lastScrollY = window.scrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Section entrance animation
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        section.querySelector('.ai-content'),
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    setIsSubmitting(true);
    setResult(null);

    // Simulate AI processing
    setTimeout(() => {
      setIsSubmitting(false);
      setResult(
        `Tadilat analizi tamamlandı!
        
📊 Maliyet Tahmini: ₺45.000 - ₺65.000
⏱️ Süre: 3-4 hafta
🎨 Önerilen Stil: Modern Minimal
📋 Malzeme Önerileri:
   • Mutfak tezgahı: Quartz kompozit
   • Dolaplar: Lake MDF, mat beyaz
   • Aydınlatma: Gömme LED + Pendant
   • Zemin: Seramik 60x120 cm, gri ton
   
👷 Önerilen Uzmanlar: İç mimar, Elektrikçi, Marangoz`
      );
    }, 2000);
  };

  return (
    <section
      id="ai-assistant"
      ref={sectionRef}
      className="relative w-full min-h-screen bg-bg-dark overflow-hidden"
    >
      {/* WebGL Background */}
      <div className="absolute inset-0 z-0">
        <Canvas
          camera={{ position: [0, 5, 10], fov: 60 }}
          style={{ background: '#111111' }}
        >
          <TopographicMesh scrollSpeed={scrollSpeed} />
        </Canvas>
      </div>

      {/* Content Overlay */}
      <div className="ai-content relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-[15vh]">
        <div className="max-w-2xl w-full text-center">
          <h2 className="font-raleway font-bold text-white text-3xl md:text-5xl uppercase tracking-tight mb-6">
            AI Tadilat Asistanı
          </h2>
          <p className="font-raleway text-white/70 text-base md:text-lg leading-relaxed mb-12 max-w-xl mx-auto">
            Hayalinizdeki mekanı anlatın, yapay zekamız maliyet, zaman çizelgesi
            ve malzeme önerilerini oluştursun.
          </p>

          {/* Hexagonal Input Area */}
          <div
            ref={inputRef}
            className="relative mx-auto max-w-lg"
            style={{
              borderRadius: '40%',
              boxShadow: '0 0 30px rgba(116, 185, 255, 0.2)',
            }}
          >
            <div className="bg-bg-concrete/80 backdrop-blur-md border border-white/10 rounded-2xl p-8">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="örn. Mutfak tezgahı ve dolapları yenilenmeli, aydınlatma modernleşmeli"
                className="w-full bg-transparent text-white placeholder-white/40 font-raleway text-sm leading-relaxed resize-none outline-none min-h-[100px]"
                rows={4}
              />
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !inputValue.trim()}
                className="mt-4 w-full py-4 bg-accent-blue text-bg-dark font-raleway font-bold text-sm tracking-widest uppercase rounded-sm hover:bg-white transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Analiz Ediliyor...' : 'TASARIMI BAŞLAT'}
              </button>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="mt-8 bg-bg-concrete/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-left max-w-lg mx-auto">
              <pre className="font-raleway text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
                {result}
              </pre>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
