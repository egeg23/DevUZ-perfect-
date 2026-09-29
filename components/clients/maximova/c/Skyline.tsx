/**
 * Лондон слева, Париж справа — нарисованы кодом, а не взяты со стока.
 *
 * Три слоя, у каждого своя скорость (`data-speed`): небо почти стоит, дома
 * едут чуть быстрее, набережная — ближе всех. Слои не ловят нажатия и не
 * читаются вслух: это декорация, а не содержание.
 */
export function Skyline({ className, layer }: { className: string; layer: { sky: string; city: string; front: string } }) {
  return (
    <div className={className} aria-hidden="true">
      <svg className={layer.sky} data-speed="-0.12" viewBox="0 0 1440 600" preserveAspectRatio="xMidYMax slice">
        <circle cx="1120" cy="170" r="72" fill="hsl(40 92% 62%)" />
        <g fill="hsl(40 60% 99%)">
          <ellipse cx="260" cy="150" rx="110" ry="26" />
          <ellipse cx="330" cy="130" rx="70" ry="30" />
          <ellipse cx="820" cy="96" rx="90" ry="20" />
          <ellipse cx="870" cy="80" rx="54" ry="24" />
        </g>
      </svg>

      <svg className={layer.city} data-speed="-0.06" viewBox="0 0 1440 600" preserveAspectRatio="xMidYMax slice">
        {/* Лондон: Биг-Бен, крыши, двухэтажный автобус. */}
        <g fill="hsl(222 34% 30%)">
          <rect x="150" y="190" width="56" height="340" />
          <polygon points="150,190 178,120 206,190" />
          <rect x="172" y="96" width="12" height="28" />
          <rect x="60" y="360" width="90" height="170" />
          <rect x="206" y="330" width="120" height="200" />
          <polygon points="206,330 266,290 326,330" />
          <rect x="326" y="390" width="80" height="140" />
        </g>
        <circle cx="178" cy="240" r="18" fill="hsl(40 45% 95%)" />
        <path d="M178 240 L178 228 M178 240 L188 244" stroke="hsl(222 34% 30%)" strokeWidth="3" strokeLinecap="round" />
        <g>
          <rect x="420" y="460" width="130" height="70" rx="10" fill="hsl(4 70% 50%)" />
          <rect x="432" y="472" width="106" height="16" rx="3" fill="hsl(40 45% 95%)" />
          <rect x="432" y="500" width="106" height="14" rx="3" fill="hsl(40 45% 95%)" />
          <circle cx="450" cy="532" r="10" fill="hsl(222 34% 20%)" />
          <circle cx="520" cy="532" r="10" fill="hsl(222 34% 20%)" />
        </g>

        {/* Париж: Эйфелева башня и мансардные крыши. */}
        <g fill="hsl(220 50% 38%)">
          <path d="M1100 110 L1108 110 L1116 250 L1150 400 L1190 530 L1156 530 L1130 440 L1078 440 L1052 530 L1018 530 L1058 400 L1092 250 Z" />
          <rect x="1070" y="388" width="68" height="14" />
          <rect x="1084" y="246" width="40" height="10" />
          <rect x="880" y="380" width="110" height="150" />
          <polygon points="872,380 935,336 998,380" />
          <rect x="1230" y="350" width="130" height="180" />
          <polygon points="1222,350 1295,306 1368,350" />
        </g>
        <path d="M1078 440 Q1104 400 1130 440" fill="hsl(40 45% 95%)" />
      </svg>

      <svg className={layer.front} data-speed="0.04" viewBox="0 0 1440 600" preserveAspectRatio="xMidYMax slice">
        <path d="M0 520 Q360 490 720 520 T1440 520 L1440 600 L0 600 Z" fill="hsl(200 40% 70%)" />
        <path d="M560 530 Q720 440 880 530" fill="none" stroke="hsl(222 34% 24%)" strokeWidth="10" />
        <rect x="0" y="560" width="1440" height="40" fill="hsl(36 30% 84%)" />
      </svg>
    </div>
  );
}
