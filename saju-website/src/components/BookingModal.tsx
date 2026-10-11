import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  BookOpen,
  Check,
  Compass,
  CreditCard,
  Download,
  Heart,
  Leaf,
  LockKeyhole,
  Moon,
  RotateCcw,
  Sparkles,
  Sprout,
  Sun,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { validateBirthInput, type SajuInput } from "../lib/saju";
import { findProduct, formatKrw, products } from "../lib/catalog";
import {
  createOrder,
  getOrder,
  getPaymentStatus,
  pendingOrderKey,
  type Order,
  type PaymentStatus,
  type PurchasedReport,
} from "../lib/checkout";
import SajuReport, { createReportText } from "./SajuReport";
import "./BookingModal.css";

type BookingModalProps = {
  open: boolean;
  onClose: () => void;
  initialProduct?: string;
  brandName?: string;
};

const topicIcons: Record<string, typeof Moon> = {
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
const storageKey = "dalbit-saju-input-v2";
const legacyStorageKey = "saju-consultation-draft-v1";
const stepLabels = ["주제 선택", "생일 입력", "주문 확인", "유료 리포트"];
const emptyDetails = {
  name: "",
  birthDate: "",
  calendar: "solar" as "solar" | "lunar",
  leapMonth: false,
  birthTime: "",
  unknownTime: true,
  dayBoundary: "midnight" as "midnight" | "zi",
};
type Details = typeof emptyDetails;
type Errors = Partial<
  Record<"name" | "birthDate" | "birthTime" | "general", string>
>;

function todayString() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: "year" | "month" | "day") =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
function toSajuInput(details: Details): SajuInput {
  return {
    birthDate: details.birthDate,
    calendar: details.calendar,
    leapMonth: details.leapMonth,
    birthTime: details.birthTime,
    unknownTime: details.unknownTime,
    dayBoundary: details.dayBoundary,
  };
}

export default function BookingModal({
  open,
  onClose,
  initialProduct,
  brandName = "달빛사주",
}: BookingModalProps) {
  const id = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const closeRef = useRef(onClose);
  const wasOpen = useRef(false);
  closeRef.current = onClose;
  const [step, setStep] = useState(0);
  const [product, setProduct] = useState(products[0].title);
  const [details, setDetails] = useState<Details>({ ...emptyDetails });
  const [errors, setErrors] = useState<Errors>({});
  const [purchased, setPurchased] = useState<PurchasedReport | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(
    null,
  );
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [orderConsent, setOrderConsent] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const result = purchased?.result ?? null;
  const selected = findProduct(product);
  const [saveLocally, setSaveLocally] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [hasCurrentSaved, setHasCurrentSaved] = useState(false);
  const [storageMessage, setStorageMessage] = useState("");

  useEffect(() => {
    if (open && !wasOpen.current) {
      setStep(0);
      setProduct(
        products.some((item) => item.title === initialProduct)
          ? initialProduct!
          : products[0].title,
      );
      setDetails({ ...emptyDetails });
      setErrors({});
      setPurchased(null);
      setPaymentStatus(null);
      setPaymentMessage("");
      setOrderConsent(false);
      setOrder(null);
      setCheckoutUrl("");
      setSaveLocally(false);
      setStorageMessage("");
      try {
        const hasCurrent = localStorage.getItem(storageKey) !== null;
        setHasCurrentSaved(hasCurrent);
        setHasSaved(
          hasCurrent || localStorage.getItem(legacyStorageKey) !== null,
        );
      } catch {
        setHasSaved(false);
        setHasCurrentSaved(false);
      }
    }
    wasOpen.current = open;
  }, [open, initialProduct]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    getPaymentStatus()
      .then(async (status) => {
        if (!active) return;
        setPaymentStatus(status);
        if (!status.enabled) return;
        let pending = null;
        try {
          pending = sessionStorage.getItem(pendingOrderKey);
        } catch {
          /* Optional recovery. */
        }
        if (pending) {
          const checked = await getOrder(pending);
          if (active) acceptOrder(checked);
        }
      })
      .catch(() => {
        if (active)
          setPaymentMessage(
            "구매 서비스 상태를 확인하지 못했어요. 잠시 후 다시 열어주세요.",
          );
      });
    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => titleRef.current?.focus(), 0);
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
      }
      if (event.key !== "Tab") return;
      const elements = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], summary, [tabindex="0"]',
        ) ?? [],
      ).filter(
        (element) => element.offsetParent !== null && element.tabIndex >= 0,
      );
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first) {
        event.preventDefault();
        return;
      }
      const active = document.activeElement;
      if (
        event.shiftKey &&
        (active === first || !elements.includes(active as HTMLElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (active === last || !elements.includes(active as HTMLElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", handleKey);
      if (previouslyFocused?.isConnected)
        previouslyFocused.focus({ preventScroll: true });
    };
  }, [open]);

  function goTo(nextStep: number) {
    setStep(nextStep);
    setErrors({});
    window.setTimeout(() => {
      dialogRef.current?.scrollTo({ top: 0 });
      titleRef.current?.focus({ preventScroll: true });
    }, 0);
  }

  function prepareOrder() {
    const nextErrors: Errors = {};
    const validationMessage = validateBirthInput(toSajuInput(details));
    if (validationMessage) {
      if (validationMessage.includes("시간"))
        nextErrors.birthTime = validationMessage;
      else nextErrors.birthDate = validationMessage;
    }
    if (!details.name.trim()) nextErrors.name = "불러드릴 이름을 입력해주세요.";
    setErrors(nextErrors);
    const firstField = ["name", "birthDate", "birthTime"].find(
      (field) => nextErrors[field as keyof Errors],
    );
    if (Object.keys(nextErrors).length) {
      if (firstField)
        dialogRef.current
          ?.querySelector<HTMLInputElement>(`[name="${firstField}"]`)
          ?.focus();
      return;
    }
    if (saveLocally) saveInput();
    else setStorageMessage("이번 생일 입력은 이 브라우저에 저장하지 않았어요.");
    setPurchased(null);
    setOrderConsent(false);
    goTo(2);
  }

  function forgetPendingOrder() {
    try {
      sessionStorage.removeItem(pendingOrderKey);
    } catch {
      /* Storage may be blocked. */
    }
  }

  function acceptOrder(checked: Order) {
    setProduct(findProduct(checked.productId).title);
    setOrder(checked);
    if (checked.status === "paid" && checked.report) {
      setPurchased(checked.report);
      setDetails({
        ...emptyDetails,
        ...checked.report.input,
        name: checked.report.name,
        birthTime: checked.report.input.birthTime ?? "",
        unknownTime: checked.report.input.unknownTime === true,
        leapMonth: checked.report.input.leapMonth === true,
        dayBoundary: checked.report.input.dayBoundary ?? "midnight",
      });
      setPaymentMessage(
        "결제 승인을 확인했어요. 구매한 리포트를 열어드릴게요.",
      );
      goTo(3);
    } else {
      setPurchased(null);
      goTo(2);
      const messages = {
        pending:
          "아직 결제 승인이 확인되지 않았어요. 결제창에서 완료한 뒤 다시 확인해주세요.",
        cancelled: "취소된 주문이에요. 결제 완료로 처리하지 않았습니다.",
        refunded: "환불된 주문이에요. 새 리포트를 제공하지 않습니다.",
        failed: "결제가 승인되지 않았어요. 다시 시도할 수 있습니다.",
        paid: "구매한 리포트를 확인하지 못했어요.",
      };
      setPaymentMessage(messages[checked.status]);
      if (checked.status !== "pending") {
        forgetPendingOrder();
        setOrder(null);
        setCheckoutUrl("");
      }
    }
  }

  async function beginOrder() {
    if (!paymentStatus?.enabled || !orderConsent || paymentBusy) return;
    setPaymentBusy(true);
    setPaymentMessage("");
    try {
      const created = await createOrder(
        selected.id,
        details.name.trim(),
        toSajuInput(details),
      );
      setCheckoutUrl(created.checkoutUrl);
      setOrder({
        orderId: created.orderId,
        productId: selected.id,
        amount: created.amount,
        currency: "KRW",
        status: "pending",
      });
      try {
        sessionStorage.setItem(pendingOrderKey, created.orderId);
      } catch {
        /* Recovery is optional. */
      }
      setPaymentMessage(
        "주문이 준비됐어요. 결제창을 열고 결제를 진행해주세요.",
      );
    } catch (error) {
      setPaymentMessage(
        error instanceof Error ? error.message : "결제창을 준비하지 못했어요.",
      );
    } finally {
      setPaymentBusy(false);
    }
  }

  async function confirmOrder() {
    if (!order || paymentBusy) return;
    setPaymentBusy(true);
    try {
      acceptOrder(await getOrder(order.orderId));
    } catch (error) {
      setPaymentMessage(
        error instanceof Error
          ? error.message
          : "결제 승인을 확인하지 못했어요.",
      );
    } finally {
      setPaymentBusy(false);
    }
  }

  function saveInput() {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          version: 2,
          product,
          details: { ...details, name: details.name.trim() },
        }),
      );
      setHasSaved(true);
      setHasCurrentSaved(true);
      setStorageMessage(
        "입력 정보를 이 브라우저에 저장했어요. 저장된 정보는 아래에서 지울 수 있어요.",
      );
    } catch {
      setStorageMessage(
        "브라우저 저장이 허용되지 않아 저장하지 못했어요. 결과는 파일로 내려받을 수 있어요.",
      );
    }
  }

  function deleteSaved() {
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(legacyStorageKey);
      setHasSaved(false);
      setHasCurrentSaved(false);
      setSaveLocally(false);
      setStorageMessage(
        "이 브라우저에 저장된 입력 정보와 이전 상담 메모를 지웠어요.",
      );
    } catch {
      setStorageMessage(
        "저장 정보를 지우지 못했어요. 브라우저의 사이트 데이터 설정을 확인해주세요.",
      );
    }
  }

  function loadSaved() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      const data = saved?.details;
      if (
        saved?.version !== 2 ||
        !data ||
        typeof data.name !== "string" ||
        typeof data.birthDate !== "string" ||
        !["solar", "lunar"].includes(data.calendar) ||
        !["midnight", "zi"].includes(data.dayBoundary)
      )
        throw new Error("invalid");
      setDetails({
        name: data.name.slice(0, 40),
        birthDate: data.birthDate,
        calendar: data.calendar,
        leapMonth: data.leapMonth === true,
        birthTime: typeof data.birthTime === "string" ? data.birthTime : "",
        unknownTime: data.unknownTime !== false,
        dayBoundary: data.dayBoundary,
      });
      if (products.some((item) => item.title === saved.product))
        setProduct(saved.product);
      setSaveLocally(false);
      setStorageMessage(
        "저장된 입력 정보를 불러왔어요. 확인 후 다시 계산해주세요.",
      );
      goTo(1);
    } catch {
      setStorageMessage(
        "저장된 입력 정보를 불러오지 못했어요. 새로 입력하거나 저장 정보를 지워주세요.",
      );
    }
  }

  function downloadReport() {
    if (!result || !purchased || order?.status !== "paid") return;
    const text = createReportText(
      result,
      details.name.trim(),
      product,
      toSajuInput(details),
      brandName,
      purchased.guide,
    );
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", text], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "달빛사주-결과.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function restart() {
    setDetails({ ...emptyDetails });
    setPurchased(null);
    setOrder(null);
    setCheckoutUrl("");
    setPaymentMessage("");
    setOrderConsent(false);
    forgetPendingOrder();
    setSaveLocally(false);
    setStorageMessage("");
    goTo(0);
  }

  if (!open) return null;
  const titles = [
    "어떤 이야기가 궁금한가요?",
    "생일을 알려주세요",
    "구매할 리포트를 확인해주세요",
    `${details.name.trim()}님의 사주`,
  ];

  return createPortal(
    <div
      className="booking-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`booking-dialog${step === 3 ? " booking-dialog-report" : ""}`}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-intro`}
      >
        <button
          className="booking-close"
          type="button"
          aria-label="사주 계산 창 닫기"
          onClick={onClose}
        >
          <X size={21} />
        </button>
        <div className="booking-brand">
          <Moon size={17} strokeWidth={1.5} />
          <span>{brandName} · 나의 사주</span>
        </div>
        <ol className="booking-progress" aria-label="사주 계산 단계">
          {stepLabels.map((label, index) => (
            <li
              key={label}
              className={index <= step ? "is-current" : ""}
              aria-current={index === step ? "step" : undefined}
            >
              <span className="booking-step-number">
                {index < step ? <Check size={13} /> : index + 1}
              </span>
              <span>{label}</span>
            </li>
          ))}
        </ol>
        <h2 id={`${id}-title`} ref={titleRef} tabIndex={-1}>
          {titles[step]}
        </h2>
        <p id={`${id}-intro`} className="booking-intro">
          {step === 0
            ? "생년월일로 사주를 계산하고, 전통 명리의 관점에서 읽어봐요."
            : step === 1
              ? "1900년부터 오늘까지의 출생 정보를 입력할 수 있어요."
              : step === 2
                ? "가격과 제공 내용을 확인한 뒤 구매할 수 있어요."
                : `${product} · 결제 승인을 확인한 개인 사주 리포트입니다.`}
        </p>

        {step === 0 && (
          <>
            <fieldset className="booking-products">
              <legend className="booking-visually-hidden">
                사주 주제 선택
              </legend>
              {products.map((item) => {
                const Icon = topicIcons[item.icon] ?? Moon;
                return (
                  <label
                    key={item.id}
                    className={`booking-product ${product === item.title ? "is-selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="consultationProduct"
                      value={item.title}
                      checked={product === item.title}
                      onChange={() => setProduct(item.title)}
                    />
                    <span className="booking-product-top">
                      <Icon size={23} strokeWidth={1.5} />
                      <span className="booking-radio-mark">
                        {product === item.title && <Check size={10} />}
                      </span>
                    </span>
                    <strong>{item.title}</strong>
                    <span className="booking-product-price">
                      {formatKrw(item.priceKrw)} · 1회
                    </span>
                    <span className="booking-product-caption">
                      {item.caption}
                    </span>
                    <span className="booking-product-description">
                      {item.description}
                    </span>
                  </label>
                );
              })}
            </fieldset>
            {hasCurrentSaved && (
              <button
                className="booking-secondary"
                type="button"
                onClick={loadSaved}
              >
                이 브라우저에 저장한 생일 불러오기
              </button>
            )}
          </>
        )}

        {step === 1 && (
          <form
            id={`${id}-details-form`}
            className="booking-form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              prepareOrder();
            }}
          >
            <div className="booking-field">
              <label htmlFor={`${id}-name`}>
                이름 <span>필수</span>
              </label>
              <input
                id={`${id}-name`}
                name="name"
                required
                autoComplete="name"
                maxLength={40}
                placeholder="불러드릴 이름"
                value={details.name}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? `${id}-name-error` : undefined}
                onChange={(event) =>
                  setDetails({ ...details, name: event.target.value })
                }
              />
              {errors.name && (
                <p
                  className="booking-error"
                  id={`${id}-name-error`}
                  role="alert"
                >
                  {errors.name}
                </p>
              )}
            </div>
            <fieldset className="booking-calendar">
              <legend>달력 기준</legend>
              <label>
                <input
                  type="radio"
                  name="calendar"
                  checked={details.calendar === "solar"}
                  onChange={() =>
                    setDetails({
                      ...details,
                      calendar: "solar",
                      leapMonth: false,
                    })
                  }
                />
                양력
              </label>
              <label>
                <input
                  type="radio"
                  name="calendar"
                  checked={details.calendar === "lunar"}
                  onChange={() => setDetails({ ...details, calendar: "lunar" })}
                />
                음력
              </label>
              {details.calendar === "lunar" && (
                <label className="booking-leap">
                  <input
                    type="checkbox"
                    checked={details.leapMonth}
                    onChange={(event) =>
                      setDetails({
                        ...details,
                        leapMonth: event.target.checked,
                      })
                    }
                  />
                  윤달
                </label>
              )}
            </fieldset>
            <div className="booking-field">
              <label htmlFor={`${id}-date`}>
                생년월일 <span>필수</span>
              </label>
              <input
                id={`${id}-date`}
                name="birthDate"
                required
                type={details.calendar === "solar" ? "date" : "text"}
                inputMode={details.calendar === "lunar" ? "numeric" : undefined}
                autoComplete="bday"
                min="1900-01-01"
                max={todayString()}
                maxLength={10}
                placeholder="예: 1998-05-12"
                value={details.birthDate}
                aria-invalid={Boolean(errors.birthDate)}
                aria-describedby={`${id}-date-hint${errors.birthDate ? ` ${id}-date-error` : ""}`}
                onChange={(event) => {
                  const digits = event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 8);
                  const formatted =
                    digits.slice(0, 4) +
                    (digits.length > 4 ? `-${digits.slice(4, 6)}` : "") +
                    (digits.length > 6 ? `-${digits.slice(6, 8)}` : "");
                  setDetails({
                    ...details,
                    birthDate:
                      details.calendar === "solar"
                        ? event.target.value
                        : formatted,
                  });
                }}
              />
              <p className="booking-field-hint" id={`${id}-date-hint`}>
                {details.calendar === "lunar"
                  ? "음력 날짜를 연-월-일 순서로 입력해주세요. 음력 30일과 윤달 여부도 확인해요."
                  : "양력 생년월일을 선택해주세요."}
              </p>
              {errors.birthDate && (
                <p
                  className="booking-error"
                  id={`${id}-date-error`}
                  role="alert"
                >
                  {errors.birthDate}
                </p>
              )}
            </div>
            <div className="booking-field">
              <div className="booking-label-row">
                <label htmlFor={`${id}-time`}>태어난 시간</label>
                <label className="booking-checkbox">
                  <input
                    type="checkbox"
                    checked={details.unknownTime}
                    onChange={(event) =>
                      setDetails({
                        ...details,
                        unknownTime: event.target.checked,
                        dayBoundary: event.target.checked
                          ? "midnight"
                          : details.dayBoundary,
                      })
                    }
                  />
                  시간을 몰라요
                </label>
              </div>
              <input
                id={`${id}-time`}
                name="birthTime"
                type="time"
                disabled={details.unknownTime}
                required={!details.unknownTime}
                value={details.birthTime}
                aria-invalid={Boolean(errors.birthTime)}
                aria-describedby={`${id}-time-hint${errors.birthTime ? ` ${id}-time-error` : ""}`}
                onChange={(event) =>
                  setDetails({ ...details, birthTime: event.target.value })
                }
              />
              <p className="booking-field-hint" id={`${id}-time-hint`}>
                시간을 모르면 시주는 계산하지 않아요. 절기가 바뀌는 날에는
                연주·월주가 확정되지 않을 수 있어요.
              </p>
              {errors.birthTime && (
                <p
                  className="booking-error"
                  id={`${id}-time-error`}
                  role="alert"
                >
                  {errors.birthTime}
                </p>
              )}
            </div>
            <div className="booking-field">
              <label htmlFor={`${id}-boundary`}>하루가 바뀌는 기준</label>
              <select
                id={`${id}-boundary`}
                disabled={details.unknownTime}
                value={details.dayBoundary}
                onChange={(event) =>
                  setDetails({
                    ...details,
                    dayBoundary: event.target.value as Details["dayBoundary"],
                  })
                }
              >
                <option value="midnight">0시 기준</option>
                <option value="zi">23시 기준 (자시)</option>
              </select>
              <p className="booking-field-hint">
                23시대에 태어났다면 명리 해석 방식에 따라 일주가 달라질 수
                있어요. 시간을 모르면 일주는 0시 기준 참고값으로 표시해요.
              </p>
            </div>
            <div className="booking-basis">
              <strong>한국 출생 시각 기준</strong>
              <p>
                한국 표준시(UTC+9)로 계산해요. 출생지 경도에 따른 태양시 보정과
                과거 서머타임 보정은 적용하지 않아요. 한국 표준시 기준 서비스로,
                해외 출생은 별도 만세력과 확인해주세요.
              </p>
            </div>
            <label className="booking-storage-choice">
              <input
                type="checkbox"
                checked={saveLocally}
                onChange={(event) => setSaveLocally(event.target.checked)}
              />
              <span>
                입력 정보를 이 브라우저에 저장할게요.
                <small>선택 사항 · 공용 기기에서는 체크하지 마세요.</small>
              </span>
            </label>
            {errors.general && (
              <p className="booking-error" role="alert">
                {errors.general}
              </p>
            )}
          </form>
        )}

        {step === 2 && (
          <section className="checkout-summary" aria-label="주문 및 결제 확인">
            <span className="checkout-badge">
              {paymentStatus?.enabled ? "1회 구매" : "판매 준비 중"}
            </span>
            <h3>{selected.title}</h3>
            <p>{selected.sampleNote}</p>
            <ul className="checkout-includes">
              {selected.includes.map((item) => (
                <li key={item}>
                  <Check size={15} />
                  {item}
                </li>
              ))}
            </ul>
            <dl className="checkout-totals">
              <div>
                <dt>이용 방식</dt>
                <dd>선택한 주제의 개인 리포트 1회</dd>
              </div>
              {details.name && (
                <div>
                  <dt>입력한 생일</dt>
                  <dd>
                    {details.birthDate} ·{" "}
                    {details.calendar === "solar"
                      ? "양력"
                      : `음력${details.leapMonth ? " 윤달" : ""}`}
                  </dd>
                </div>
              )}
              <div className="checkout-total">
                <dt>결제 금액</dt>
                <dd>{formatKrw(order?.amount ?? selected.priceKrw)}</dd>
              </div>
            </dl>
            <p className="checkout-price-note">
              판매 시작 전 임시 가격입니다. 자동 갱신되는 구독 상품이 아니에요.
            </p>
            <p className="checkout-delivery">
              결제 승인 후 이 브라우저에서 리포트를 열고 텍스트로 내려받을 수
              있어요. 기록과 실제 계산 근거를 함께 제공해요.
            </p>
            {!paymentStatus?.enabled && (
              <div className="checkout-unavailable" role="status">
                <LockKeyhole size={20} />
                <div>
                  <strong>지금은 결제되지 않아요</strong>
                  <p>
                    판매 준비가 끝난 뒤 구매할 수 있어요. 결제와 사업자 안내,
                    환불 조건을 먼저 공개하겠습니다.
                  </p>
                </div>
              </div>
            )}
            {paymentStatus?.enabled && !order && (
              <label className="booking-storage-choice checkout-consent">
                <input
                  type="checkbox"
                  checked={orderConsent}
                  onChange={(event) => setOrderConsent(event.target.checked)}
                />
                <span>
                  주문과 리포트 생성을 위한 정보 전달에 동의해요.
                  <small>
                    이름·생년월일·출생시간·선택 주제를 주문 서버로 전달합니다.
                    카드 정보는 이 사이트에서 입력받지 않아요.
                  </small>
                </span>
              </label>
            )}
            {order && (
              <div className="checkout-order">
                <p>
                  주문 번호 <span>{order.orderId}</span>
                </p>
                <p>결제 승인이 확인되어야 전체 리포트가 열립니다.</p>
                {checkoutUrl && (
                  <a
                    className="checkout-open button button-primary"
                    href={checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    결제창 열기 <CreditCard size={17} />
                  </a>
                )}
              </div>
            )}
          </section>
        )}

        {step === 3 && result && purchased && order?.status === "paid" && (
          <SajuReport
            result={result}
            name={details.name.trim()}
            topic={product}
            input={toSajuInput(details)}
            guide={purchased.guide}
          />
        )}
        {paymentMessage && (
          <p className="checkout-message" role="status">
            {paymentMessage}
          </p>
        )}
        {storageMessage && (
          <p className="booking-storage-message" role="status">
            {storageMessage}
          </p>
        )}
        {hasSaved && (
          <button
            type="button"
            className="booking-delete"
            onClick={deleteSaved}
          >
            이 브라우저에 저장된 입력 정보 지우기
          </button>
        )}
        <div className="booking-notice">
          <LockKeyhole size={17} />
          <p>
            생일은 선택한 경우에만 브라우저에 저장해요. 구매를 진행하면 리포트
            생성과 주문 확인을 위해 입력 정보가 주문 서버로 전달됩니다. 사주
            풀이는 전통 명리의 참고 정보이며 전문가 상담 예약은 포함하지 않아요.
          </p>
        </div>
        <div className="booking-actions">
          {step > 0 && step < 3 && (
            <button
              className="booking-back"
              type="button"
              disabled={paymentBusy || Boolean(order)}
              onClick={() => goTo(step === 2 ? 1 : 0)}
            >
              <ArrowLeft size={17} />
              {step === 2 ? "생일 수정" : "이전"}
            </button>
          )}
          {step === 0 && (
            <button
              className="booking-primary"
              type="button"
              onClick={() => goTo(1)}
            >
              생일 입력하기
              <ArrowRight size={18} />
            </button>
          )}
          {step === 1 && (
            <button
              className="booking-primary"
              type="submit"
              form={`${id}-details-form`}
            >
              가격과 주문 확인하기
              <Sparkles size={18} />
            </button>
          )}
          {step === 2 && (
            <button
              className="booking-primary"
              type="button"
              disabled={
                paymentBusy ||
                !paymentStatus?.enabled ||
                (!order && !orderConsent)
              }
              onClick={order ? confirmOrder : beginOrder}
            >
              {paymentBusy
                ? "확인 중…"
                : order
                  ? "결제 완료 확인"
                  : paymentStatus?.enabled
                    ? "결제창 준비하기"
                    : "결제 준비 중"}
              <CreditCard size={18} />
            </button>
          )}
          {step === 3 && (
            <button
              className="booking-primary"
              type="button"
              onClick={downloadReport}
            >
              사주 결과 다운로드
              <Download size={18} />
            </button>
          )}
        </div>
        {step === 3 && (
          <button className="booking-secondary" type="button" onClick={restart}>
            <RotateCcw size={17} />
            다른 사주 보기
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
