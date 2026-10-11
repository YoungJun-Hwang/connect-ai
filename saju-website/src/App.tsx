import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Heart,
  Leaf,
  Menu,
  Moon,
  ShieldCheck,
  Sparkles,
  Sprout,
  Star,
  Sun,
  X,
} from "lucide-react";
import CelestialArt from "./components/CelestialArt";
import BookingModal from "./components/BookingModal";

const BRAND = "달빛사주";
const products = [
  {
    id: "life",
    category: "나의 사주",
    title: "인생 사주",
    english: "YOUR OWN STORY",
    description: "타고난 기질과 나만의 가능성.\n나를 더 깊이 이해하는 첫걸음.",
    badge: "처음이라면 추천",
    icon: Moon,
  },
  {
    id: "love",
    category: "연애 · 관계",
    title: "연애와 관계",
    english: "LOVE & CONNECTION",
    description:
      "일간과 오행으로 살펴보는 나의 성향.\n관계를 돌아보는 작은 힌트.",
    badge: "",
    icon: Heart,
  },
  {
    id: "year",
    category: "올해의 운세",
    title: "올해의 흐름",
    english: "A NEW CHAPTER",
    description:
      "올해의 간지와 나의 일간을 비교해요.\n전통 명리의 관점으로 읽는 한 해.",
    badge: "",
    icon: Sun,
  },
  {
    id: "work",
    category: "일 · 재물",
    title: "일과 재물",
    english: "GROW AT YOUR PACE",
    description: "오행의 분포와 십성을 확인해요.\n일하는 방식을 돌아보는 시간.",
    badge: "",
    icon: Sprout,
  },
] as const;
const categories = [
  "전체 상담",
  "나의 사주",
  "연애 · 관계",
  "올해의 운세",
  "일 · 재물",
];
const faqs = [
  {
    question: "사주가 처음인데, 어떤 상담을 선택하면 좋을까요?",
    answer:
      "처음이라면 ‘인생 사주’로 시작해 보세요. 생년월일을 입력하면 사주팔자, 일간, 오행과 십성을 계산해요. 주제별 글은 계산된 명식을 바탕으로 한 전통 명리의 참고 풀이이며, 두 사람의 궁합이나 전문가 상담은 제공하지 않아요.",
  },
  {
    question: "태어난 시간을 몰라도 상담할 수 있나요?",
    answer:
      "네, ‘시간을 몰라요’를 선택하면 시주를 만들지 않고 확인할 수 있는 기둥으로 계산해요. 입춘이나 월이 바뀌는 절입일에는 출생시간에 따라 연주·월주가 달라질 수 있어, 결과에 불확실한 부분을 함께 표시합니다.",
  },
  {
    question: "양력과 음력 중 어떤 생일을 입력해야 하나요?",
    answer:
      "평소 알고 있는 생일을 입력하고 양력 또는 음력을 선택해 주세요. 음력 생일이 윤달에 해당한다면 윤달 여부도 함께 선택해 주세요. 주민등록상 생일과 실제 생일이 다르면 실제 태어난 날을 기준으로 입력하는 것이 좋아요.",
  },
  {
    question: "사주에 나온 이야기는 반드시 현실이 되나요?",
    answer:
      "사주는 삶을 바라보는 하나의 관점이에요. 어떤 일이 반드시 일어난다고 단정하거나 중요한 결정을 대신하지 않습니다. 달빛사주는 나의 기질과 상황을 돌아보고, 스스로 선택할 수 있도록 돕는 방향을 지향해요.",
  },
  {
    question: "지금 어떤 기능을 사용할 수 있나요?",
    answer:
      "1900년부터 오늘까지의 양력·한국 음력 생일로 개인 사주를 무료로 계산하고 결과를 내려받을 수 있어요. 한국 표준시(UTC+9)를 적용하며, 출생지 경도와 과거 서머타임은 보정하지 않아요. 입력 정보는 서버로 전송하지 않고, 선택한 경우에만 이 브라우저에 저장해요. 전문가 상담 접수와 결제는 연결되어 있지 않습니다.",
  },
];

function Brand({ light = false }: { light?: boolean }) {
  return (
    <a
      href="#"
      className={`brand ${light ? "brand-light" : ""}`}
      aria-label={`${BRAND} 홈`}
    >
      <span className="brand-mark">
        <Moon size={23} strokeWidth={1.7} />
        <Sparkles size={12} strokeWidth={1.5} />
      </span>
      <span>{BRAND}</span>
    </a>
  );
}

function InfoDialog({
  kind,
  onClose,
}: {
  kind: "report" | "privacy" | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState(0);
  useEffect(() => {
    if (kind && !ref.current?.open) {
      setTab(0);
      ref.current?.showModal();
    } else if (!kind) ref.current?.close();
  }, [kind]);
  const samples = [
    {
      title: "조용하지만, 단단한 마음을 가진 당신",
      text: "새로운 일을 시작하기 전 충분히 생각하는 편인가요? 이 샘플에서는 신중함을 머뭇거림보다, 자신에게 맞는 방향을 찾는 힘으로 바라봅니다. 내 속도를 인정하는 순간, 선택은 조금 더 편안해질 수 있어요.",
      tip: "나의 속도를 존중하는 것도 하나의 강점이에요.",
    },
    {
      title: "크게 뛰기보다, 뿌리를 다지는 시간",
      text: "계절마다 식물이 자라는 방식이 다르듯 삶에도 여러 리듬이 있어요. 이 샘플은 가까운 미래를 단정하는 대신, 지금 정리하고 싶은 일과 새로 배우고 싶은 일을 한 가지씩 적어보는 방법을 제안합니다.",
      tip: "오늘 할 수 있는 작은 일 한 가지부터 시작해 보세요.",
    },
    {
      title: "좋은 관계는, 서로를 이해하는 데서",
      text: "나는 생각을 정리할 시간이 필요하고, 상대는 바로 대화하고 싶을 수 있어요. 차이가 잘못은 아닙니다. 나에게 편안한 대화 방식과 기대하는 점을 구체적으로 나눌 때, 서로를 조금 더 다정하게 이해할 수 있어요.",
      tip: "“나는 이럴 때 편안해”라는 말로 대화를 열어보세요.",
    },
  ];
  return (
    <dialog
      ref={ref}
      className="info-dialog"
      onCancel={onClose}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) {
          const bounds = ref.current.getBoundingClientRect();
          if (
            e.clientX < bounds.left ||
            e.clientX > bounds.right ||
            e.clientY < bounds.top ||
            e.clientY > bounds.bottom
          )
            onClose();
        }
      }}
      aria-labelledby="info-title"
    >
      <button className="dialog-close" aria-label="창 닫기" onClick={onClose}>
        <X size={22} />
      </button>
      {kind === "report" ? (
        <div className="sample-report">
          <span className="eyebrow">A GLIMPSE OF YOUR STORY</span>
          <h2 id="info-title">나를 알아가는 이야기</h2>
          <p className="sample-notice">
            서비스 구성을 보여드리는 샘플 리포트입니다.
            <br />
            개인 생년월일로 계산한 실제 사주 결과가 아닙니다.
          </p>
          <div className="sample-profile">
            <Moon size={24} />
            <div>
              <strong>달빛님의 이야기</strong>
              <span>생년월일과 무관한 예시 내용</span>
            </div>
            <span className="small-tag">SAMPLE</span>
          </div>
          <div className="sample-tabs" role="tablist" aria-label="리포트 주제">
            {["기질과 강점", "삶의 흐름", "관계의 힌트"].map((name, i) => (
              <button
                key={name}
                role="tab"
                tabIndex={tab === i ? 0 : -1}
                aria-selected={tab === i}
                aria-controls={`sample-panel-${i}`}
                id={`sample-tab-${i}`}
                onClick={() => setTab(i)}
                onKeyDown={(event) => {
                  const next =
                    event.key === "ArrowRight"
                      ? (i + 1) % 3
                      : event.key === "ArrowLeft"
                        ? (i + 2) % 3
                        : event.key === "Home"
                          ? 0
                          : event.key === "End"
                            ? 2
                            : null;
                  if (next !== null) {
                    event.preventDefault();
                    setTab(next);
                    document.getElementById(`sample-tab-${next}`)?.focus();
                  }
                }}
              >
                {name}
              </button>
            ))}
          </div>
          <div
            className="sample-content"
            id={`sample-panel-${tab}`}
            role="tabpanel"
            aria-labelledby={`sample-tab-${tab}`}
          >
            <span>0{tab + 1}</span>
            <h3>{samples[tab].title}</h3>
            <p>{samples[tab].text}</p>
            <div className="sample-tip">
              <Sparkles size={18} />
              <p>{samples[tab].tip}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="privacy-content">
          <span className="eyebrow">YOUR STORY STAYS YOURS</span>
          <h2 id="info-title">개인정보 안내</h2>
          <p>생년월일로 사주를 계산하는 온라인 서비스입니다.</p>
          <h3>입력 정보의 사용</h3>
          <p>
            이름, 생년월일, 출생 시간, 선택한 주제는 사주 계산과 결과 내려받기에
            사용됩니다. 계산은 이 브라우저에서 진행하며 외부 서버나 상담사에게
            전송되지 않습니다.
          </p>
          <h3>브라우저 저장</h3>
          <p>
            생일 입력 화면에서 저장에 동의한 경우에만 이 브라우저에 입력 정보가
            저장됩니다. 저장한 정보는 사주 계산 창에서 삭제할 수 있습니다. 공용
            기기에서는 저장을 선택하지 않는 것이 좋습니다.
          </p>
          <h3>실제 서비스 운영 시</h3>
          <p>
            상담 접수와 결제 서비스를 제공하기 전, 운영자 정보와 보관 기간,
            개인정보 보호 문의처가 포함된 정식 처리방침을 안내할 예정입니다.
          </p>
        </div>
      )}
    </dialog>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [category, setCategory] = useState("전체 상담");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("인생 사주");
  const [info, setInfo] = useState<"report" | "privacy" | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const handler = () => setShowTop(window.scrollY > 650);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [menuOpen]);
  const startBooking = (product = "인생 사주") => {
    setSelectedProduct(product);
    setBookingOpen(true);
    setMenuOpen(false);
  };
  const filtered = products.filter(
    (product) => category === "전체 상담" || product.category === category,
  );

  return (
    <>
      <a href="#main" className="skip-link">
        본문으로 바로가기
      </a>
      <div className="announcement">
        <Sparkles size={13} />
        <span>조금 더 나다운 내일, 달빛과 함께 시작해요.</span>
        <Sparkles size={13} />
      </div>
      <header className="site-header">
        <div className="container nav-bar">
          <Brand />
          <nav
            className={menuOpen ? "navigation is-open" : "navigation"}
            aria-label="주 메뉴"
          >
            {[
              ["사주 상담", "#consultations"],
              ["달빛 이야기", "#philosophy"],
              ["이용 안내", "#how-it-works"],
              ["자주 묻는 질문", "#faq"],
            ].map(([name, href]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}>
                {name}
              </a>
            ))}
            <button className="mobile-booking" onClick={() => startBooking()}>
              사주 계산하기 <ArrowUpRight size={17} />
            </button>
          </nav>
          <button className="nav-cta" onClick={() => startBooking()}>
            사주 계산하기 <ArrowUpRight size={16} />
          </button>
          <button
            className="mobile-menu"
            aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main id="main">
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <span className="hero-kicker">
                <span />
                <span>나를 알아가는 가장 다정한 시간</span>
              </span>
              <h1>
                당신의 내일에,
                <br />
                <span>좋은 방향을 더하다.</span>
              </h1>
              <p className="hero-description">
                생년월일 속에 담긴 나의 이야기를 만나보세요.
                <br />
                어렵고 낯선 사주를, 내 삶에 가까운 언어로.
              </p>
              <div className="hero-actions">
                <button
                  className="button button-primary"
                  onClick={() => startBooking()}
                >
                  내 사주 알아보기 <ArrowUpRight size={19} />
                </button>
                <button
                  className="sample-link"
                  onClick={() => setInfo("report")}
                >
                  샘플 리포트 보기 <ArrowRight size={17} />
                </button>
              </div>
              <div className="hero-promises">
                <span>
                  <Check size={13} />
                  쉬운 풀이
                </span>
                <span>
                  <Check size={13} />
                  나만의 속도
                </span>
                <span>
                  <Check size={13} />
                  선택을 존중하는 상담
                </span>
              </div>
            </div>
            <CelestialArt />
          </div>
          <div className="container hero-bottom">
            <span>EVERY LIFE HAS ITS OWN RHYTHM</span>
            <a href="#consultations">
              나에게 맞는 이야기 찾기 <ArrowDown size={14} />
            </a>
          </div>
        </section>

        <section
          id="consultations"
          className="consultation-section section-space"
        >
          <div className="container">
            <div className="section-heading">
              <div>
                <span className="eyebrow">A STORY JUST FOR YOU</span>
                <h2>지금 당신에게 필요한 이야기</h2>
              </div>
              <p>
                마음이 향하는 주제부터,
                <br />
                하나씩 천천히 알아가세요.
              </p>
            </div>
            <div
              className="category-tabs"
              role="group"
              aria-label="상담 종류 필터"
            >
              {categories.map((name) => (
                <button
                  key={name}
                  aria-pressed={category === name}
                  className={category === name ? "active" : ""}
                  onClick={() => setCategory(name)}
                >
                  {name}
                </button>
              ))}
            </div>
            <div className="product-grid" aria-live="polite">
              {filtered.map((product) => (
                <article
                  className={`product-card product-${product.id}`}
                  key={product.id}
                >
                  <div className="card-top">
                    <span>{product.english}</span>
                    {product.badge && (
                      <span className="recommend-badge">
                        <Star size={10} fill="currentColor" />
                        {product.badge}
                      </span>
                    )}
                  </div>
                  <CelestialArt kind={product.id} />
                  <div className="product-details">
                    <h3>{product.title}</h3>
                    <p>{product.description}</p>
                    <div className="product-price">
                      <span>개인 사주 리포트</span>
                      <strong>무료</strong>
                    </div>
                  </div>
                  <button
                    className="card-button"
                    onClick={() => startBooking(product.title)}
                  >
                    내 사주 계산하기 <ArrowUpRight size={17} />
                  </button>
                </article>
              ))}
            </div>
            <div className="catalog-note">
              <ShieldCheck size={14} />
              <span>
                생년월일로 계산한 사주팔자와 오행을 무료로 확인하세요. 전문
                상담과 두 사람의 궁합은 제공하지 않습니다.
              </span>
            </div>
          </div>
        </section>

        <section id="philosophy" className="philosophy-section">
          <div className="container philosophy-grid">
            <div className="philosophy-visual">
              <div className="leaf-circle">
                <Leaf size={69} strokeWidth={0.8} />
                <span className="leaf-star">
                  <Sparkles size={28} strokeWidth={1} />
                </span>
              </div>
              <span className="vertical-note">YOUR LIFE, YOUR CHOICE</span>
            </div>
            <div className="philosophy-copy">
              <span className="eyebrow">THE DALBIT WAY</span>
              <h2>
                정해진 운명보다,
                <br />
                <span>나를 이해하는 힘을 믿어요.</span>
              </h2>
              <p>
                사주는 미래를 정해놓은 답안지가 아니에요.
                <br />
                내가 가진 마음의 모양과 삶의 흐름을 들여다보는 작은 지도죠.
              </p>
              <p>
                달빛사주는 두려움 대신 이해를,
                <br />
                단정적인 답 대신 스스로 선택할 수 있는 용기를 전합니다.
              </p>
              <div className="philosophy-sign">
                <span>당신의 삶을 응원하는 마음으로</span>
                <span>
                  {BRAND} <Moon size={15} />
                </span>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="how-section section-space">
          <div className="container">
            <div className="center-heading">
              <span className="eyebrow">SIMPLE, AND PERSONAL</span>
              <h2>나에게 한 걸음 더 가까이</h2>
              <p>복잡한 준비 없이, 편안하게 시작하세요.</p>
            </div>
            <div className="steps-grid">
              {[
                {
                  icon: Heart,
                  title: "마음에 닿는 주제를 골라요",
                  text: "지금 궁금한 이야기를 선택해 주세요.\n나를 알고 싶은 마음이면 충분해요.",
                },
                {
                  icon: Star,
                  title: "나의 시작을 알려주세요",
                  text: "생년월일과 태어난 시간을 입력해요.\n시간을 몰라도 괜찮아요.",
                },
                {
                  icon: Moon,
                  title: "나의 사주를 바로 확인해요",
                  text: "사주팔자와 오행, 일간을 계산해요.\n나만의 결과를 읽고 내려받을 수 있어요.",
                },
              ].map((step, i) => (
                <div className="step" key={step.title}>
                  <div className="step-icon">
                    <step.icon size={28} strokeWidth={1.3} />
                    <span>0{i + 1}</span>
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                  {i < 2 && (
                    <ArrowRight
                      className="step-arrow"
                      size={24}
                      strokeWidth={1}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="report-banner container">
          <div className="report-paper" aria-hidden="true">
            <span>달빛사주</span>
            <div>
              <Moon size={28} strokeWidth={1} />
              <span>
                나를 알아가는
                <br />
                작은 이야기
              </span>
            </div>
            <i />
            <i />
            <i />
            <span className="paper-end">YOUR PERSONAL STORY</span>
          </div>
          <div className="report-banner-copy">
            <span className="eyebrow">A LITTLE PREVIEW</span>
            <h2>어떤 이야기를 만나게 될까요?</h2>
            <p>
              어려운 한자와 낯선 용어 대신,
              <br />
              읽을수록 나를 이해하게 되는 다정한 풀이.
            </p>
          </div>
          <button
            className="button button-outline"
            onClick={() => startBooking()}
          >
            나의 사주 계산하기 <ArrowUpRight size={17} />
          </button>
          <Sparkles className="report-sparkle" size={37} strokeWidth={0.7} />
        </section>

        <section id="faq" className="faq-section section-space">
          <div className="container faq-grid">
            <div className="faq-intro">
              <span className="eyebrow">A FEW THINGS TO KNOW</span>
              <h2>
                궁금한 마음,
                <br />
                먼저 풀어드릴게요.
              </h2>
              <p>
                처음이라 낯설어도 괜찮아요.
                <br />
                자주 묻는 이야기를 모았어요.
              </p>
              <div className="faq-decoration">
                <Moon size={48} strokeWidth={0.9} />
                <Sparkles size={21} strokeWidth={1} />
              </div>
            </div>
            <div className="faq-list">
              {faqs.map((faq, i) => (
                <div
                  className={`faq-item ${faqOpen === i ? "is-open" : ""}`}
                  key={faq.question}
                >
                  <h3>
                    <button
                      aria-expanded={faqOpen === i}
                      aria-controls={`faq-answer-${i}`}
                      onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                    >
                      <span>
                        <small>0{i + 1}</small>
                        {faq.question}
                      </span>
                      <ChevronDown size={19} />
                    </button>
                  </h3>
                  <div
                    id={`faq-answer-${i}`}
                    className="faq-answer"
                    hidden={faqOpen !== i}
                  >
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="closing-section">
          <div className="container closing-inner">
            <span className="closing-star">
              <Sparkles size={26} strokeWidth={1} />
            </span>
            <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
            <h2>당신의 이야기가 궁금해요.</h2>
            <p>오늘, 나를 조금 더 알아가는 시간을 선물해 보세요.</p>
            <button
              className="button button-primary"
              onClick={() => startBooking()}
            >
              나의 이야기 시작하기 <ArrowUpRight size={18} />
            </button>
          </div>
          <span className="closing-orbit orbit-one" />
          <span className="closing-orbit orbit-two" />
        </section>
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-top">
            <div>
              <Brand />
              <p>당신의 내일에, 좋은 방향을 더하다.</p>
            </div>
            <div className="footer-links">
              <button onClick={() => setInfo("privacy")}>개인정보 안내</button>
              <a href="#how-it-works">이용 안내</a>
              <a href="#faq">자주 묻는 질문</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>
              © {new Date().getFullYear()} DALBIT SAJU. ALL RIGHTS RESERVED.
            </p>
            <span>
              <Clock3 size={12} />
              나만의 속도로, 나다운 내일을.
            </span>
          </div>
          <p className="footer-demo">
            생년월일 기반 만세력 계산 · 전문가 상담 접수와 결제는 제공하지
            않습니다.
          </p>
        </div>
      </footer>
      {showTop && (
        <button
          className="back-to-top"
          aria-label="맨 위로 이동"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <ChevronUp size={20} />
        </button>
      )}
      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        initialProduct={selectedProduct}
        brandName={BRAND}
      />
      <InfoDialog kind={info} onClose={() => setInfo(null)} />
    </>
  );
}
