type Props = { kind?: "hero" | "life" | "love" | "year" | "work" };

export default function CelestialArt({ kind = "hero" }: Props) {
  if (kind !== "hero") {
    const palettes = {
      life: ["#eee5f4", "#79609a", "#c7b3dc"],
      love: ["#f8e9e8", "#cc7a87", "#e8acb0"],
      year: ["#fbefdc", "#c69047", "#e8c98f"],
      work: ["#e5eee7", "#5b8672", "#a7c6af"],
    };
    const [bg, ink, pale] = palettes[kind];
    return (
      <svg viewBox="0 0 240 176" aria-hidden="true" className="card-art">
        <circle cx="122" cy="93" r="66" fill={bg} />
        <ellipse cx="122" cy="142" rx="73" ry="8" fill={pale} opacity=".17" />
        {kind === "life" && (
          <>
            <circle cx="117" cy="83" r="42" fill={pale} opacity=".55" />
            <path d="M129 43a43 43 0 1 0 25 73 44 44 0 0 1-25-73Z" fill={ink} />
            <path
              d="m163 45 3.8 12 12.2 4-12.2 3.8L163 77l-4-12.2L147 61l12-4Z"
              fill="#d2a35a"
            />
            <path
              d="M55 119q26-28 52 0t54 0"
              fill="none"
              stroke={ink}
              opacity=".45"
            />
          </>
        )}
        {kind === "love" && (
          <>
            <path
              d="M117 132c-10-6-61-34-61-62 0-30 42-32 61-9 19-23 62-21 62 9 0 28-51 56-62 62Z"
              fill={pale}
            />
            <path
              d="M112 116c-8-5-42-25-42-45 0-19 26-22 42-8 16-14 43-11 43 8 0 20-36 40-43 45Z"
              fill={ink}
              opacity=".75"
            />
            <path d="m171 39 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z" fill={ink} />
            <path
              d="M157 116q-3 20 15 29m-16-14q18-12 23-2m-18-7q-9-13-16-8"
              fill="none"
              stroke={ink}
              strokeWidth="2"
            />
          </>
        )}
        {kind === "year" && (
          <>
            <circle cx="122" cy="77" r="27" fill={ink} />
            {Array.from({ length: 12 }, (_, i) => (
              <path
                key={i}
                d="M122 34v-8"
                stroke={ink}
                strokeWidth="2"
                strokeLinecap="round"
                transform={`rotate(${i * 30} 122 77)`}
              />
            ))}
            <path
              d="M49 114q18-20 39 0t39 0 39 0 29-2"
              fill="none"
              stroke={pale}
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M61 134q16-17 35 0t37 0 36 0"
              fill="none"
              stroke={ink}
              opacity=".5"
              strokeWidth="2"
            />
          </>
        )}
        {kind === "work" && (
          <>
            <path
              d="M122 136V70"
              stroke={ink}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M122 110C82 111 68 91 75 70c23 1 49 10 47 40Z"
              fill={pale}
            />
            <path d="M122 91c0-30 23-51 49-48 4 27-20 50-49 48Z" fill={ink} />
            <path
              d="M122 75c-26-4-38-22-30-41 22 4 33 22 30 41Z"
              fill={ink}
              opacity=".55"
            />
            <path
              d="M89 137q32-12 64 0"
              fill="none"
              stroke={ink}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="73" cy="117" r="5" fill="#d3b276" />
            <path d="m177 98 2 7 7 2-7 2-2 7-2-7-7-2 7-2Z" fill="#d3b276" />
          </>
        )}
        <circle cx="60" cy="55" r="2.5" fill={ink} opacity=".6" />
        <circle cx="187" cy="116" r="2" fill={ink} opacity=".4" />
      </svg>
    );
  }

  return (
    <div className="celestial-wrap">
      <svg
        viewBox="0 0 560 470"
        className="celestial-art"
        role="img"
        aria-label="달과 별, 오행이 어우러진 사주 별자리 그림"
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#e7dcef" />
            <stop offset="1" stopColor="#f1eaf4" />
          </linearGradient>
          <linearGradient id="moon" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#8d74af" />
            <stop offset="1" stopColor="#5f477e" />
          </linearGradient>
          <filter id="paper-shadow">
            <feDropShadow
              dx="0"
              dy="8"
              stdDeviation="10"
              floodColor="#6b507f"
              floodOpacity=".1"
            />
          </filter>
        </defs>
        <circle cx="295" cy="229" r="181" fill="url(#sky)" />
        <circle
          cx="295"
          cy="229"
          r="161"
          fill="none"
          stroke="#bba3d0"
          strokeWidth=".7"
        />
        <circle
          cx="295"
          cy="229"
          r="133"
          fill="none"
          stroke="#bba3d0"
          strokeDasharray="2 7"
        />
        <circle cx="295" cy="229" r="113" fill="none" stroke="#c8b6d9" />
        <ellipse
          cx="295"
          cy="229"
          rx="210"
          ry="74"
          transform="rotate(-29 295 229)"
          fill="none"
          stroke="#ae97c3"
          strokeWidth=".8"
        />
        {Array.from({ length: 24 }, (_, i) => (
          <path
            key={i}
            d="M295 65v7"
            stroke="#ac94c2"
            strokeWidth="1"
            transform={`rotate(${i * 15} 295 229)`}
          />
        ))}
        <circle
          cx="295"
          cy="229"
          r="91"
          fill="#faf6ed"
          filter="url(#paper-shadow)"
        />
        <path
          d="M295 138a91 91 0 0 0 0 182 45.5 45.5 0 0 0 0-91 45.5 45.5 0 0 1 0-91Z"
          fill="url(#moon)"
        />
        <circle cx="295" cy="183" r="11" fill="#8b71ab" />
        <circle cx="295" cy="274" r="11" fill="#faf6ed" />
        <path
          d="m247 206 2.5 7.5 7.5 2.5-7.5 2.5-2.5 7.5-2.5-7.5-7.5-2.5 7.5-2.5Z"
          fill="#f3e6cb"
        />
        <circle cx="249" cy="251" r="2" fill="#e4d4ed" />
        <circle cx="274" cy="304" r="1.5" fill="#e4d4ed" />
        <circle cx="225" cy="241" r="1.5" fill="#e4d4ed" />
        <g fontFamily="Noto Serif KR, serif" fontSize="17" textAnchor="middle">
          <circle cx="295" cy="67" r="23" fill="#f5f0e5" stroke="#e4d8bb" />
          <text x="295" y="73" fill="#af884d">
            土
          </text>
          <circle cx="449" cy="179" r="23" fill="#f5e5e3" stroke="#e7c6c5" />
          <text x="449" y="185" fill="#bc757c">
            火
          </text>
          <circle cx="390" cy="359" r="23" fill="#e6eee5" stroke="#c7d7c7" />
          <text x="390" y="365" fill="#648369">
            木
          </text>
          <circle cx="200" cy="359" r="23" fill="#e7eaf5" stroke="#cdd1e3" />
          <text x="200" y="365" fill="#7985a5">
            水
          </text>
          <circle cx="140" cy="179" r="23" fill="#faf6ed" stroke="#dbd3c2" />
          <text x="140" y="185" fill="#a2967f">
            金
          </text>
        </g>
        <path d="m452 75 5 15 15 5-15 5-5 15-5-15-15-5 15-5Z" fill="#c8a56c" />
        <path d="m96 297 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z" fill="#ad95c0" />
        <path d="m435 315 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill="#ad95c0" />
        <circle cx="482" cy="143" r="3" fill="#c8a56c" />
        <circle cx="137" cy="89" r="3" fill="#ad95c0" />
        <path
          d="M398 409c-7-10-6-23 4-29 7-20 34-25 48-8 20-13 42 2 40 21 10-2 21 6 23 16"
          fill="#fffaf4"
        />
        <path
          d="M79 369c-2-14 7-25 21-23 3-19 31-24 41-5 18-10 37 3 36 19 18-5 29 3 34 13"
          fill="#fffaf4"
        />
        <path
          d="M49 408q47-24 94 0t95 0M398 428q35-16 70 0t59 0"
          fill="none"
          stroke="#d7cddd"
          strokeWidth="1"
        />
        <path
          d="M114 411q-16-37 5-75m-9 51q-27-1-25-17 18-2 25 17m4-21q23-4 21-20-20 3-21 20m-1-12q-19-3-18-16 15 0 18 16"
          fill="#a2ad93"
          stroke="#889574"
          strokeWidth=".6"
        />
      </svg>
      <div className="art-caption">
        <span className="art-caption-dot" />
        운명보다 소중한 건, 당신의 선택
      </div>
      <span className="art-label">A LITTLE GUIDANCE, A BRIGHTER TOMORROW</span>
    </div>
  );
}
