import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Download,
  Heart,
  LockKeyhole,
  Moon,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import {
  calculateSaju,
  validateBirthInput,
  type SajuInput,
  type SajuResult,
} from "../lib/saju";
import SajuReport, { createReportText } from "./SajuReport";
import "./BookingModal.css";

type BookingModalProps = {
  open: boolean;
  onClose: () => void;
  initialProduct?: string;
  brandName?: string;
};

const products = [
  {
    name: "인생 사주",
    icon: Moon,
    caption: "나를 이해하는 시작",
    description: "일간과 오행을 바탕으로 타고난 기질을 살펴봐요.",
  },
  {
    name: "연애와 관계",
    icon: Heart,
    caption: "관계 속 나의 모습",
    description: "내 사주에 나타난 관계의 관점을 읽어봐요.",
  },
  {
    name: "올해의 흐름",
    icon: Sparkles,
    caption: "올해를 위한 참고",
    description: "올해의 연주와 내 일간의 관계를 살펴봐요.",
  },
  {
    name: "일과 재물",
    icon: BriefcaseBusiness,
    caption: "일상의 선택을 위한 힌트",
    description: "오행과 십성으로 일과 재물의 관점을 읽어봐요.",
  },
];
const storageKey = "dalbit-saju-input-v2";
const legacyStorageKey = "saju-consultation-draft-v1";
const stepLabels = ["주제 선택", "생일 입력", "사주 결과"];
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
  const [product, setProduct] = useState(products[0].name);
  const [details, setDetails] = useState<Details>({ ...emptyDetails });
  const [errors, setErrors] = useState<Errors>({});
  const [result, setResult] = useState<SajuResult | null>(null);
  const [saveLocally, setSaveLocally] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [hasCurrentSaved, setHasCurrentSaved] = useState(false);
  const [storageMessage, setStorageMessage] = useState("");

  useEffect(() => {
    if (open && !wasOpen.current) {
      setStep(0);
      setProduct(
        products.some((item) => item.name === initialProduct)
          ? initialProduct!
          : products[0].name,
      );
      setDetails({ ...emptyDetails });
      setErrors({});
      setResult(null);
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

  function calculate() {
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
    try {
      const calculated = calculateSaju(toSajuInput(details));
      setResult(calculated);
      if (saveLocally) saveInput();
      else setStorageMessage("이번 입력은 이 브라우저에 저장하지 않았어요.");
      goTo(2);
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "입력한 날짜를 계산하지 못했어요. 생일과 달력 기준을 확인해주세요.",
      });
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
      if (products.some((item) => item.name === saved.product))
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
    if (!result) return;
    const text = createReportText(
      result,
      details.name.trim(),
      product,
      toSajuInput(details),
      brandName,
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
    setResult(null);
    setSaveLocally(false);
    setStorageMessage("");
    goTo(0);
  }

  if (!open) return null;
  const titles = [
    "어떤 이야기가 궁금한가요?",
    "생일을 알려주세요",
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
        className={`booking-dialog${step === 2 ? " booking-dialog-report" : ""}`}
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
              : `${product} · 입력한 생일로 계산한 나의 사주 원국입니다.`}
        </p>

        {step === 0 && (
          <>
            <fieldset className="booking-products">
              <legend className="booking-visually-hidden">
                사주 주제 선택
              </legend>
              {products.map((item) => (
                <label
                  key={item.name}
                  className={`booking-product ${product === item.name ? "is-selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="consultationProduct"
                    value={item.name}
                    checked={product === item.name}
                    onChange={() => setProduct(item.name)}
                  />
                  <span className="booking-product-top">
                    <item.icon size={23} strokeWidth={1.5} />
                    <span className="booking-radio-mark">
                      {product === item.name && <Check size={10} />}
                    </span>
                  </span>
                  <strong>{item.name}</strong>
                  <span className="booking-product-caption">
                    {item.caption}
                  </span>
                  <span className="booking-product-description">
                    {item.description}
                  </span>
                </label>
              ))}
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
              calculate();
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

        {step === 2 && result && (
          <SajuReport
            result={result}
            name={details.name.trim()}
            topic={product}
            input={toSajuInput(details)}
          />
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
            입력 정보는 서버로 전송되지 않아요. 사주 해석은 전통 명리 규칙에
            따른 참고 정보이며, 전문가 상담이나 예약·결제는 제공하지 않아요.
          </p>
        </div>
        <div className="booking-actions">
          {step > 0 && (
            <button
              className="booking-back"
              type="button"
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
              내 사주 계산하기
              <Sparkles size={18} />
            </button>
          )}
          {step === 2 && (
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
        {step === 2 && (
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
