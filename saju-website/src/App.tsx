import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Compass,
  Heart,
  Leaf,
  Menu,
  Moon,
  ShieldCheck,
  Sparkles,
  Sprout,
  Star,
  Sun,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import CelestialArt from "./components/CelestialArt";
import BookingModal from "./components/BookingModal";
import { products, categories, findProduct, formatKrw } from "./lib/catalog";

const BRAND = "달빛사주";
const productIcons: Record<string, LucideIcon> = {
  moon: Moon,
  heart: Heart,
  sun: Sun,
  sprout: Sprout,
  briefcase: BriefcaseBusiness,
  wallet: Wallet,
  book: BookOpen,
  users: Users,
  compass: Compass,
  leaf: Leaf,
};
const faqs = [
  {
    question: "리포트는 어떤 구성이고, 가격은 얼마인가요?",
    answer:
      "인생 사주부터 마음과 생활 리듬까지 10가지 주제를 준비하고 있어요. 원국·일간·오행과 계산 기준에 주제별 풀이, 7일 실천 계획, 자기점검 질문을 더했어요. 표시 가격은 1회 구매 기준 6,900원~12,900원의 임시 가격이며 정식 판매 전에 확정해 안내할 예정입니다.",
  },
  {
    question: "지금 구매하고 전체 리포트를 볼 수 있나요?",
    answer:
      "현재는 판매 준비 중입니다. 상품별 가격과 구성을 살펴보고, 생일 입력과 구매 전 확인 화면까지 이용할 수 있어요. 결제 서비스를 연결한 뒤 판매를 시작하며, 전체 개인 리포트는 결제 확인 후에 열립니다. 지금은 결제가 진행되거나 전체 결과가 제공되지 않아요.",
  },
  {
    question: "태어난 시간을 모르면 무엇이 달라지나요?",
    answer:
      "‘시간을 몰라요’를 선택하면 시주를 계산하지 않아요. 생일 당일에 입춘이나 월의 절입이 있다면 출생 시각에 따라 연주·월주가 달라질 수 있어, 가능한 값과 미확정 표시를 함께 보여요. 확인하지 못한 기둥은 오행·음양 집계에서 제외합니다.",
  },
  {
    question: "양력과 음력 중 어떤 생일을 입력하나요?",
    answer:
      "알고 있는 실제 생일과 달력 기준을 선택해 주세요. 음력 생일이 윤달이라면 윤달 여부도 선택해요. 1900년부터 오늘까지의 생일을 지원하며 한국 표준시(UTC+9)로 계산합니다. 출생지 경도, 과거 표준시와 서머타임은 보정하지 않으므로 해외 출생이나 시각 보정이 필요한 경우 별도 만세력과 함께 확인해 주세요.",
  },
  {
    question: "연애 리포트에는 두 사람의 궁합이 포함되나요?",
    answer:
      "‘연애와 관계’는 나의 원국을 바탕으로 표현 방식과 관계의 질문을 살펴보는 개인 리포트예요. 상대의 생일과 원국을 비교하는 궁합은 포함하지 않습니다. 상담사가 직접 진행하는 상담이나 특정 만남·합격·수익·사건의 예측도 제공하지 않아요.",
  },
  {
    question: "생일과 결제 정보는 어떻게 보관하나요?",
    answer:
      "생일의 유효성은 이 브라우저에서 확인하며, 입력 정보는 저장에 동의한 경우에만 브라우저에 남아요. 구매를 진행하면 이름과 출생 정보가 주문 서버로 전달되고, 결제 확인 후 서버가 개인 리포트를 계산해 제공해요. 저장한 정보는 입력 창에서 삭제할 수 있어요. 실제 구매 서비스가 연결되면 결제와 주문 확인에 필요한 정보는 결제사와 주문 시스템에서 처리됩니다. 처리 항목·보관 기간·문의처가 담긴 정식 개인정보 처리방침은 판매 전에 안내할 예정입니다.",
  },
  {
    question: "구매 조건과 환불 기준은 어디서 확인하나요?",
    answer:
      "정식 판매 전에 리포트 제공 방식, 열람 조건, 이용약관과 환불 기준을 구매 화면에 안내할 예정입니다. 현재는 판매 준비 단계로 결제를 받지 않아요. 표시 가격도 임시 가격이므로 판매 시작 시 확정된 가격과 조건을 확인해 주세요.",
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
  const sampleProduct = findProduct("life");
  const samples = [
    {
      title: "결과를 읽기 전에, 계산 기준부터",
      text: "리포트에는 입력한 생일의 양력·음력 환산, 한국 표준시, 입춘과 절입 기준, 하루가 바뀌는 기준을 함께 보여드려요. 출생 시간을 모르면 시주는 생략하고, 절기 경계에서는 확정할 수 없는 연주·월주를 표시합니다. 아래 설명은 리포트 구성을 안내하는 예시입니다.",
      tip: "‘왜 이 값이 나왔지?’라는 질문에 확인할 근거를 남겨요.",
    },
    {
      title: "일주일 동안, 내 기준을 작게 기록하기",
      text: "인생 사주 리포트의 실천 계획은 일상에서 직접 확인할 수 있는 작은 기록을 제안해요. 하루에 한 가지씩 적고 마지막 날에 돌아보는 방식입니다. 계획은 선택한 주제에 따라 달라지며, 특정 결과를 약속하지 않아요.",
      tip: "사주에서 읽은 상징을 실제 경험과 비교해 보세요.",
    },
    {
      title: "내 경험이 답할 수 있는 질문",
      text: "자기점검 질문은 풀이를 그대로 받아들이기보다, 나의 상황과 경험에 연결해 볼 수 있도록 돕습니다. 인생 사주에서는 내 기준, 선택 이유, 유지하고 싶은 생활 습관을 묻습니다. 사주가 중요한 결정을 대신하지 않도록 스스로 확인하는 과정이에요.",
      tip: "오늘의 작은 관찰이 나를 이해하는 구체적인 근거가 됩니다.",
    },
  ];
  const samplePlan = [
    "마음이 편했던 순간 한 가지 기록",
    "내가 직접 선택한 일과 이유 적기",
    "집중이 잘 됐던 환경 살펴보기",
    "미루고 있는 일의 조건 나누기",
    "지키고 싶은 기준 한 가지 정하기",
    "작은 행동으로 기준을 시험하기",
    "기록을 돌아보고 다음 한 가지 선택",
  ];
  return (
    <dialog
      ref={ref}
      className="info-dialog"
      onCancel={onClose}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) {
          const bounds = ref.current.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
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
          <span className="eyebrow">INSIDE A DALBIT REPORT</span>
          <h2 id="info-title">리포트 안에는 무엇이 있나요?</h2>
          <p className="sample-notice">
            유료 리포트의 구성을 보여드리는 설명용 예시입니다.
            <br />
            생년월일로 계산한 개인 결과가 아니며, 현재는 판매 준비 중입니다.
          </p>
          <div className="sample-profile">
            <Moon size={24} />
            <div>
              <strong>
                {sampleProduct.title} · {formatKrw(sampleProduct.priceKrw)}
              </strong>
              <span>임시 가격 · 1회 구매</span>
            </div>
            <span className="small-tag">예시</span>
          </div>
          <div
            className="sample-tabs"
            role="tablist"
            aria-label="리포트 구성 예시"
          >
            {["계산 근거", "7일 실천", "자기점검"].map((name, index) => (
              <button
                key={name}
                role="tab"
                tabIndex={tab === index ? 0 : -1}
                aria-selected={tab === index}
                aria-controls={`sample-panel-${index}`}
                id={`sample-tab-${index}`}
                onClick={() => setTab(index)}
                onKeyDown={(event) => {
                  const next =
                    event.key === "ArrowRight"
                      ? (index + 1) % 3
                      : event.key === "ArrowLeft"
                        ? (index + 2) % 3
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
            {tab === 0 && (
              <ul className="sample-basis-list">
                <li>양력·한국 음력과 윤달을 확인</li>
                <li>시간을 모르면 시주를 계산하지 않음</li>
                <li>미확정 기둥을 단순 오행 집계에서 제외</li>
                <li>보이는 글자의 오행 분포와 해석 범위를 안내</li>
              </ul>
            )}
            {tab === 1 && (
              <ol className="sample-plan">
                {samplePlan.map((item, index) => (
                  <li key={item}>
                    <span>{index + 1}일</span>
                    {item}
                  </li>
                ))}
              </ol>
            )}
            {tab === 2 && (
              <ul className="sample-question-list">
                <li>최근에 스스로 선택했다고 느낀 순간은 언제였나요?</li>
                <li>그 선택을 지탱한 나의 기준은 무엇인가요?</li>
                <li>다음 일주일에 유지하거나 바꾸고 싶은 습관은 무엇인가요?</li>
              </ul>
            )}
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
          <p>현재는 유료 개인 사주 리포트의 판매를 준비하고 있습니다.</p>
          <h3>생일 입력과 계산</h3>
          <p>
            이름, 생년월일, 출생 시간과 선택한 주제는 개인 리포트 계산에
            사용됩니다. 입력 단계에서는 이 브라우저에서 생일의 유효성을
            확인합니다. 구매를 진행하면 입력 정보가 주문 서버로 전달되며, 서버가
            결제 승인을 확인한 뒤 개인 리포트를 계산합니다. 외부 상담사에게
            전달하지 않습니다.
          </p>
          <h3>브라우저 저장</h3>
          <p>
            생일 입력 화면에서 저장에 동의한 경우에만 이 브라우저에 입력 정보가
            저장됩니다. 저장한 정보는 입력 창에서 삭제할 수 있습니다. 공용
            기기에서는 저장을 선택하지 마세요.
          </p>
          <h3>판매 시작 후 결제와 주문</h3>
          <p>
            실제 구매 서비스가 연결되면 결제와 주문 확인에 필요한 정보는
            결제사와 주문 시스템에서 처리됩니다. 판매 전에 처리 항목, 보관 기간,
            운영자 정보와 문의처를 담은 정식 개인정보 처리방침을 안내할
            예정입니다. 현재 결제는 진행되지 않습니다.
          </p>
        </div>
      )}
    </dialog>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [category, setCategory] = useState(categories[0]);
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
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
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
    (product) => category === categories[0] || product.category === category,
  );
  return (
    <>
      <a href="#main" className="skip-link">
        본문으로 바로가기
      </a>
      <div className="announcement">
        <Sparkles size={15} />
        <span>판매 준비 중 · 10가지 주제별 사주 리포트</span>
      </div>
      <header className="site-header">
        <div className="container nav-bar">
          <Brand />
          <nav
            className={menuOpen ? "navigation is-open" : "navigation"}
            aria-label="주 메뉴"
          >
            {[
              ["리포트와 가격", "#consultations"],
              ["달빛의 방식", "#philosophy"],
              ["이용 안내", "#how-it-works"],
              ["자주 묻는 질문", "#faq"],
            ].map(([name, href]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}>
                {name}
              </a>
            ))}
            <button className="mobile-booking" onClick={() => startBooking()}>
              리포트 선택하기
              <ArrowUpRight size={18} />
            </button>
          </nav>
          <button className="nav-cta" onClick={() => startBooking()}>
            리포트 선택
            <ArrowUpRight size={17} />
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
                <span>이해에서 실천으로, 나를 위한 리포트</span>
              </span>
              <h1>
                나를 읽고,
                <br />
                <span>오늘을 바꾸는 사주.</span>
              </h1>
              <p className="hero-description">
                계산 근거가 보이는 사주 풀이에
                <br />
                주제별 7일 실천 계획과 자기점검 질문을 더했어요.
              </p>
              <div className="hero-actions">
                <button
                  className="button button-primary"
                  onClick={() => startBooking()}
                >
                  리포트 선택하기
                  <ArrowUpRight size={19} />
                </button>
                <button
                  className="sample-link"
                  onClick={() => setInfo("report")}
                >
                  리포트 구성 예시
                  <ArrowRight size={18} />
                </button>
              </div>
              <div className="hero-promises">
                <span>
                  <Check size={15} />
                  계산 근거 공개
                </span>
                <span>
                  <Check size={15} />
                  불확실성 표시
                </span>
                <span>
                  <Check size={15} />
                  7일 실천 계획
                </span>
              </div>
              <p className="hero-sale-note">
                판매 준비 중 · 표시 가격은 임시 가격입니다.
                <br />
                지금은 가격·구성과 구매 전 입력 화면을 확인할 수 있어요.
              </p>
            </div>
            <CelestialArt />
          </div>
          <div className="container hero-bottom">
            <span>READ YOUR CHART. MAKE YOUR OWN CHOICES.</span>
            <a href="#consultations">
              10가지 리포트와 가격 보기
              <ArrowDown size={16} />
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
                <span className="eyebrow">CHOOSE YOUR REPORT</span>
                <h2>지금 궁금한 이야기부터</h2>
              </div>
              <p>
                선택한 주제 1건을 1회 구매하는 개인 리포트.
                <br />
                원국의 근거와 생활 속 질문을 함께 담았어요.
              </p>
            </div>
            <div className="sales-status">
              <span className="sales-status-tag">판매 준비 중</span>
              <p>
                표시 가격은 판매 준비용 임시 가격입니다. 정식 판매 전에 확정해
                안내할 예정이며, 현재 결제와 전체 리포트 열람은 제공되지 않아요.
              </p>
            </div>
            <div
              className="category-tabs"
              role="group"
              aria-label="리포트 주제 필터"
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
            <p className="catalog-count" role="status">
              {filtered.length}개의 리포트 · 모든 가격은 1회 구매 기준
            </p>
            <div className="product-grid" aria-live="polite">
              {filtered.map((product) => {
                const Icon = productIcons[product.icon] ?? Moon;
                return (
                  <article
                    className={`product-card product-${product.id}`}
                    key={product.id}
                    data-product={product.id}
                  >
                    <div className="card-top">
                      <span>{product.category}</span>
                      {product.badge && (
                        <span className="recommend-badge">{product.badge}</span>
                      )}
                    </div>
                    <div className="product-visual" aria-hidden="true">
                      <span className="product-orbit" />
                      <span className="product-icon">
                        <Icon size={43} strokeWidth={1.25} />
                      </span>
                      <Sparkles
                        className="product-small-star"
                        size={20}
                        strokeWidth={1.2}
                      />
                    </div>
                    <div className="product-details">
                      <span className="product-caption">{product.caption}</span>
                      <h3>{product.title}</h3>
                      <p>{product.description}</p>
                      <ul
                        className="product-includes"
                        aria-label={`${product.title} 리포트 구성`}
                      >
                        {product.includes.map((item) => (
                          <li key={item}>
                            <Check size={15} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="product-price">
                        <span>
                          1회 구매
                          <span className="price-provisional">임시 가격</span>
                        </span>
                        <strong>{formatKrw(product.priceKrw)}</strong>
                      </div>
                    </div>
                    <button
                      className="card-button"
                      onClick={() => startBooking(product.title)}
                    >
                      가격·구성 보기
                      <ArrowUpRight size={18} />
                    </button>
                  </article>
                );
              })}
            </div>
            <div className="catalog-note">
              <ShieldCheck size={18} />
              <span>
                모든 리포트에 원국과 계산 기준을 담아요. 주제별 내용과 실천
                계획이 다르며, 전문가 상담이나 두 사람의 궁합은 포함하지
                않습니다.
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
                근거를 보여주고,
                <br />
                <span>작은 실천까지 함께.</span>
              </h2>
              <p>
                명리의 상징을 읽는 것에서 한 걸음 더 나아가요.
                <br />
                내가 확인할 수 있는 경험과 질문으로 연결합니다.
              </p>
              <p>
                원국을 계산한 기준과 해석의 범위를 밝히고,
                <br />
                모르는 부분은 미확정으로 남겨두어요.
              </p>
              <div className="philosophy-sign">
                <span>선택의 주인은 언제나 당신</span>
                <span>
                  {BRAND}
                  <Moon size={15} />
                </span>
              </div>
            </div>
          </div>
          <div className="container difference-grid">
            {[
              {
                icon: ShieldCheck,
                title: "계산의 이유를 공개해요",
                text: "양력·음력 환산과 입춘·절입, 일주 경계를 함께 보여요. 오행 개수와 해석의 범위를 구분해 읽을 수 있어요.",
                detail: "원국 · 일간 · 계산 기준",
              },
              {
                icon: Clock3,
                title: "모르는 시간도 분명하게",
                text: "시간 미상에서는 시주를 만들지 않아요. 절기 경계에서 확정할 수 없는 기둥은 가능한 값과 함께 표시해요.",
                detail: "시간 미상 · 절기 경계 안내",
              },
              {
                icon: BookOpen,
                title: "읽은 뒤 일주일을 준비해요",
                text: "10가지 주제마다 다른 7일 실천 계획과 자기점검 질문을 담아요. 풀이를 내 일상에서 살펴볼 작은 행동으로 연결해요.",
                detail: "주제별 7일 계획 · 질문 3개",
              },
            ].map((feature, index) => (
              <article className="difference-card" key={feature.title}>
                <div>
                  <feature.icon size={25} strokeWidth={1.4} />
                  <span>0{index + 1}</span>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
                <span className="difference-detail">{feature.detail}</span>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="how-section section-space">
          <div className="container">
            <div className="center-heading">
              <span className="eyebrow">FROM A QUESTION TO A SMALL ACTION</span>
              <h2>판매 시작 후 이렇게 이용해요</h2>
              <p>현재는 상품 구성과 구매 전 입력 화면까지 확인할 수 있어요.</p>
            </div>
            <div className="steps-grid">
              {[
                {
                  icon: Heart,
                  title: "주제와 구성을 선택해요",
                  text: "10가지 리포트의 구성과 가격을 비교해요.\n내가 궁금한 주제 한 가지를 골라주세요.",
                },
                {
                  icon: Star,
                  title: "생일과 구매 내용을 확인해요",
                  text: "생년월일과 시간을 입력하고\n선택한 상품과 금액을 한 번 더 확인해요.",
                },
                {
                  icon: Moon,
                  title: "결제 확인 후 리포트를 읽어요",
                  text: "판매 시작 후 결제가 확인되면\n전체 풀이와 7일 실천 계획을 확인해요.",
                },
              ].map((step, index) => (
                <div className="step" key={step.title}>
                  <div className="step-icon">
                    <step.icon size={28} strokeWidth={1.3} />
                    <span>0{index + 1}</span>
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                  {index < 2 && (
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
                읽고 기록하는
                <br />
                나의 일주일
              </span>
            </div>
            <i />
            <i />
            <i />
            <span className="paper-end">CHART · QUESTIONS · SEVEN DAYS</span>
          </div>
          <div className="report-banner-copy">
            <span className="eyebrow">TAKE A LOOK INSIDE</span>
            <h2>풀이 다음에는 무엇을 할까요?</h2>
            <p>
              계산 기준을 읽고, 일주일의 작은 기록을 시작해요.
              <br />
              자기점검 질문으로 내 경험과 연결해 보세요.
            </p>
          </div>
          <button
            className="button button-outline"
            onClick={() => setInfo("report")}
          >
            리포트 구성 예시
            <ArrowUpRight size={18} />
          </button>
          <Sparkles className="report-sparkle" size={37} strokeWidth={0.7} />
        </section>

        <section id="faq" className="faq-section section-space">
          <div className="container faq-grid">
            <div className="faq-intro">
              <span className="eyebrow">BEFORE YOU CHOOSE</span>
              <h2>
                구매 전에,
                <br />
                차근차근 확인해요.
              </h2>
              <p>
                구성과 계산 범위, 개인정보와 판매 상태까지.
                <br />
                궁금한 내용을 먼저 살펴보세요.
              </p>
              <div className="faq-decoration">
                <Moon size={48} strokeWidth={0.9} />
                <Sparkles size={21} strokeWidth={1} />
              </div>
            </div>
            <div className="faq-list">
              {faqs.map((faq, index) => (
                <div
                  className={`faq-item ${faqOpen === index ? "is-open" : ""}`}
                  key={faq.question}
                >
                  <h3>
                    <button
                      aria-expanded={faqOpen === index}
                      aria-controls={`faq-answer-${index}`}
                      onClick={() =>
                        setFaqOpen(faqOpen === index ? null : index)
                      }
                    >
                      <span>
                        <small>0{index + 1}</small>
                        {faq.question}
                      </span>
                      <ChevronDown size={19} />
                    </button>
                  </h3>
                  <div
                    id={`faq-answer-${index}`}
                    className="faq-answer"
                    hidden={faqOpen !== index}
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
            <span className="eyebrow">YOUR CHOICE, YOUR NEXT STEP</span>
            <h2>어떤 이야기가 궁금한가요?</h2>
            <p>나의 질문에 맞는 주제와 리포트 구성을 먼저 살펴보세요.</p>
            <button
              className="button button-primary"
              onClick={() => startBooking()}
            >
              리포트 선택하기
              <ArrowUpRight size={18} />
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
              <p>근거가 보이는 풀이, 일상으로 이어지는 질문.</p>
            </div>
            <div className="footer-links">
              <button onClick={() => setInfo("privacy")}>개인정보 안내</button>
              <a href="#how-it-works">이용 안내</a>
              <a href="#faq">구매 전 확인</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>
              © {new Date().getFullYear()} DALBIT SAJU. ALL RIGHTS RESERVED.
            </p>
            <span>
              <Clock3 size={15} />
              나의 선택으로 만드는 다음 하루.
            </span>
          </div>
          <p className="footer-demo">
            판매 준비 중 · 표시된 1회 구매 가격은 임시 가격이며, 정식 판매 전에
            확정해 안내합니다. 현재 결제와 전체 개인 리포트 열람은 제공되지
            않습니다. 생년월일 기반 계산과 전통 명리의 참고 해석이며, 전문가
            상담·두 사람의 궁합·미래 사건의 예측은 제공하지 않습니다.
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
