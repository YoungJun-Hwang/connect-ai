import KoreanLunarCalendar from "korean-lunar-calendar";
import { Solar } from "lunar-typescript";

export type SajuElement = "목" | "화" | "토" | "금" | "수";
export type SajuInput = {
  birthDate: string;
  calendar: "solar" | "lunar";
  leapMonth?: boolean;
  birthTime?: string;
  unknownTime?: boolean;
  dayBoundary?: "midnight" | "zi";
};
export type SajuSymbol = {
  korean: string;
  chinese: string;
  element: SajuElement;
  yinYang: "양" | "음";
};
export type SajuPillar = {
  key: "year" | "month" | "day" | "hour" | "annual";
  label: string;
  korean: string;
  chinese: string;
  stem: SajuSymbol;
  branch: SajuSymbol;
  /** Relationship of the visible heavenly stem to the day master. */
  tenGod: string;
  uncertain: boolean;
  referenceNote?: string;
  alternatives?: { korean: string; chinese: string }[];
};
export type SajuResult = {
  solarDate: string;
  lunarDate: string;
  birthTime: string | null;
  dayBoundary: "midnight" | "zi";
  pillars: SajuPillar[];
  dayMaster: SajuSymbol;
  elements: Record<SajuElement, number>;
  elementTotal: number;
  yinYang: { yang: number; yin: number };
  annual: {
    year: number;
    pillar: SajuPillar;
    startsAt: string;
    interpretation: string;
  };
  interpretations: { title: string; text: string }[];
  calculationBasis: string[];
  warnings: string[];
};

const STEM_CHINESE = "甲乙丙丁戊己庚辛壬癸";
const STEM_KOREAN = [
  "갑",
  "을",
  "병",
  "정",
  "무",
  "기",
  "경",
  "신",
  "임",
  "계",
];
const BRANCH_CHINESE = "子丑寅卯辰巳午未申酉戌亥";
const BRANCH_KOREAN = [
  "자",
  "축",
  "인",
  "묘",
  "진",
  "사",
  "오",
  "미",
  "신",
  "유",
  "술",
  "해",
];
const ELEMENTS: SajuElement[] = ["목", "화", "토", "금", "수"];
const BRANCH_ELEMENTS: SajuElement[] = [
  "수",
  "토",
  "목",
  "목",
  "토",
  "화",
  "화",
  "토",
  "금",
  "금",
  "토",
  "수",
];
const LABELS: Record<SajuPillar["key"], string> = {
  year: "연주",
  month: "월주",
  day: "일주",
  hour: "시주",
  annual: "세운",
};
const DAY_MASTER_IMAGES = [
  "큰 나무처럼 방향을 세우고 꾸준히 성장하는 모습",
  "풀과 덩굴처럼 환경에 맞추고 관계를 이어 가는 모습",
  "태양처럼 생각을 드러내고 활력을 나누는 모습",
  "등불처럼 세심하게 살피고 관심을 기울이는 모습",
  "큰 땅처럼 중심을 잡고 전체를 바라보는 모습",
  "밭처럼 생활을 돌보고 차근차근 정리하는 모습",
  "단단한 금속처럼 기준을 세우고 결정을 내리는 모습",
  "보석처럼 세부를 다듬고 완성도를 높이는 모습",
  "큰 물처럼 폭넓게 배우고 흐름을 살피는 모습",
  "비와 이슬처럼 작은 변화를 관찰하고 생각을 모으는 모습",
];
const TEN_GOD_THEMES: Record<string, string> = {
  비견: "자기 기준과 동료 관계",
  겁재: "협력과 자원 분배",
  식신: "꾸준한 표현과 결과물",
  상관: "새로운 표현과 기존 기준 점검",
  편재: "자원 활용과 넓은 교류",
  정재: "생활 관리와 책임 있는 계획",
  편관: "도전과 부담 관리",
  정관: "역할과 규칙",
  편인: "다양한 배움과 관점 전환",
  정인: "학습과 돌봄",
};

type CalendarDate = {
  year: number;
  month: number;
  day: number;
  intercalation?: boolean;
};
const pad = (value: number) => String(value).padStart(2, "0");
const isoDate = (date: CalendarDate) =>
  `${date.year}-${pad(date.month)}-${pad(date.day)}`;

function todayInSeoul(): string {
  // UTC+9 is explicit, so validation does not depend on the browser/host zone.
  return new Date(Date.now() + 9 * 3_600_000).toISOString().slice(0, 10);
}

function parseDate(value: string): CalendarDate | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return null;
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

function resolveDate(input: SajuInput):
  | {
      solar: CalendarDate;
      lunar: CalendarDate;
    }
  | string {
  const date = parseDate(input.birthDate);
  if (!date) return "생년월일을 연도-월-일 형식으로 입력해 주세요.";
  if (date.year < 1900 || date.year > 2050)
    return "입력 가능한 생년은 1900년부터 2050년까지입니다.";
  const calendar = new KoreanLunarCalendar();
  const valid =
    input.calendar === "solar"
      ? calendar.setSolarDate(date.year, date.month, date.day)
      : calendar.setLunarDate(
          date.year,
          date.month,
          date.day,
          input.leapMonth === true,
        );
  if (!valid)
    return input.calendar === "lunar"
      ? "존재하지 않는 음력 날짜입니다. 날짜와 윤달 여부를 확인해 주세요."
      : "존재하지 않는 양력 날짜입니다. 생년월일을 확인해 주세요.";
  const solar = calendar.getSolarCalendar();
  const solarISO = isoDate(solar);
  if (solarISO < "1900-01-01")
    return "양력으로 1900년 1월 1일 이후의 생일을 입력해 주세요.";
  if (solarISO > todayInSeoul())
    return "한국 표준시 기준 오늘 이후의 생일은 입력할 수 없습니다.";
  return { solar, lunar: calendar.getLunarCalendar() };
}

/** Validates real Korean lunar dates (including leap months) before calculating. */
export function validateBirthInput(input: SajuInput): string | null {
  if (!input || (input.calendar !== "solar" && input.calendar !== "lunar"))
    return "양력 또는 음력을 선택해 주세요.";
  if (
    input.dayBoundary !== undefined &&
    input.dayBoundary !== "midnight" &&
    input.dayBoundary !== "zi"
  )
    return "일주가 바뀌는 기준을 확인해 주세요.";
  const resolved = resolveDate(input);
  if (typeof resolved === "string") return resolved;
  if (
    !input.unknownTime &&
    (typeof input.birthTime !== "string" ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(input.birthTime))
  ) {
    return "태어난 시간을 00:00부터 23:59 사이로 입력하거나 ‘시간 모름’을 선택해 주세요.";
  }
  return null;
}

function stemSymbol(chinese: string): SajuSymbol {
  const index = STEM_CHINESE.indexOf(chinese);
  if (index < 0) throw new Error("천간 계산 결과를 확인할 수 없습니다.");
  return {
    korean: STEM_KOREAN[index],
    chinese,
    element: ELEMENTS[Math.floor(index / 2)],
    yinYang: index % 2 === 0 ? "양" : "음",
  };
}

function branchSymbol(chinese: string): SajuSymbol {
  const index = BRANCH_CHINESE.indexOf(chinese);
  if (index < 0) throw new Error("지지 계산 결과를 확인할 수 없습니다.");
  return {
    korean: BRANCH_KOREAN[index],
    chinese,
    element: BRANCH_ELEMENTS[index],
    yinYang: index % 2 === 0 ? "양" : "음",
  };
}

function tenGod(day: SajuSymbol, other: SajuSymbol): string {
  const samePolarity = day.yinYang === other.yinYang;
  const dayIndex = ELEMENTS.indexOf(day.element);
  const otherIndex = ELEMENTS.indexOf(other.element);
  const relative = (otherIndex - dayIndex + 5) % 5;
  // Five-element generation order: wood → fire → earth → metal → water.
  if (relative === 0) return samePolarity ? "비견" : "겁재";
  if (relative === 1) return samePolarity ? "식신" : "상관";
  if (relative === 2) return samePolarity ? "편재" : "정재";
  if (relative === 3) return samePolarity ? "편관" : "정관";
  return samePolarity ? "편인" : "정인";
}

function makePillar(
  key: SajuPillar["key"],
  chinese: string,
  dayMaster: SajuSymbol,
): SajuPillar {
  const stem = stemSymbol(chinese[0]);
  const branch = branchSymbol(chinese[1]);
  return {
    key,
    label: LABELS[key],
    korean: stem.korean + branch.korean,
    chinese,
    stem,
    branch,
    tenGod: key === "day" ? "일간" : tenGod(dayMaster, stem),
    uncertain: false,
  };
}

function solarAt(
  date: CalendarDate,
  hour: number,
  minute: number,
  second = 0,
  hourShift = 0,
): Solar {
  // Solar's civil clock and solar-term table are UTC+8. Only year/month use
  // a one-hour shift. Day/hour remain the user's Korean civil date/time.
  const instant = new Date(
    Date.UTC(
      date.year,
      date.month - 1,
      date.day,
      hour + hourShift,
      minute,
      second,
    ),
  );
  return Solar.fromYmdHms(
    instant.getUTCFullYear(),
    instant.getUTCMonth() + 1,
    instant.getUTCDate(),
    instant.getUTCHours(),
    instant.getUTCMinutes(),
    instant.getUTCSeconds(),
  );
}

function termAsKoreanTime(term: Solar): string {
  const instant = new Date(
    Date.UTC(
      term.getYear(),
      term.getMonth() - 1,
      term.getDay(),
      term.getHour() + 1,
      term.getMinute(),
      term.getSecond(),
    ),
  );
  return `${instant.toISOString().slice(0, 19).replace("T", " ")} (한국 표준시)`;
}

/** Offline, deterministic pillars. No API, account, or birth-data transmission. */
export function calculateSaju(
  input: SajuInput,
  referenceYear?: number,
): SajuResult {
  const error = validateBirthInput(input);
  if (error) throw new Error(error);
  const resolved = resolveDate(input);
  if (typeof resolved === "string") throw new Error(resolved);
  const year = referenceYear ?? Number(todayInSeoul().slice(0, 4));
  if (!Number.isInteger(year) || year < 1900 || year > 2050)
    throw new Error("세운 기준 연도는 1900년부터 2050년까지 선택해 주세요.");
  const unknownTime = input.unknownTime === true;
  const dayBoundary = unknownTime
    ? "midnight"
    : (input.dayBoundary ?? "midnight");
  const [hour, minute] = unknownTime
    ? [0, 0]
    : input.birthTime!.split(":").map(Number);
  const local = solarAt(resolved.solar, hour, minute).getLunar();
  const termClock = solarAt(resolved.solar, hour, minute, 0, -1).getLunar();
  const dayChinese =
    dayBoundary === "zi"
      ? local.getDayInGanZhiExact()
      : local.getDayInGanZhiExact2();
  const dayMaster = stemSymbol(dayChinese[0]);
  const pillars = [
    makePillar("year", termClock.getYearInGanZhiExact(), dayMaster),
    makePillar("month", termClock.getMonthInGanZhiExact(), dayMaster),
    makePillar("day", dayChinese, dayMaster),
  ];
  const warnings: string[] = [];
  if (unknownTime) {
    warnings.push(
      "태어난 시간을 몰라 시주는 계산하지 않았습니다. 일주는 입력한 양력 날짜의 자정 기준입니다.",
    );
    if (input.dayBoundary === "zi")
      warnings.push(
        "시간 미상에서는 23시 변경 여부를 확인할 수 없어 일주 기준을 자정으로 적용했습니다.",
      );
  }
  // Unknown time covers the whole civil date; a known HH:MM still covers
  // 60 seconds. Do not silently pick one side of a term in that interval.
  const end = solarAt(
    resolved.solar,
    unknownTime ? 23 : hour,
    unknownTime ? 59 : minute,
    59,
    -1,
  ).getLunar();
  for (const [index, endChinese] of [
    end.getYearInGanZhiExact(),
    end.getMonthInGanZhiExact(),
  ].entries()) {
    if (pillars[index].chinese !== endChinese) {
      const alternate = makePillar(pillars[index].key, endChinese, dayMaster);
      pillars[index].uncertain = true;
      pillars[index].referenceNote = unknownTime
        ? "00:00 참고"
        : "입력 분의 0초 참고";
      pillars[index].alternatives = [
        { korean: pillars[index].korean, chinese: pillars[index].chinese },
        { korean: alternate.korean, chinese: alternate.chinese },
      ];
      warnings.push(
        unknownTime
          ? `${pillars[index].label}는 생일 당일 절기가 바뀌어 출생 시간에 따라 ${pillars[index].korean} 또는 ${alternate.korean}입니다. 표시된 ${pillars[index].korean}는 00:00 참고값이며 오행·음양 집계에서 제외했습니다.`
          : `${pillars[index].label}는 입력한 ${input.birthTime} 분 안에 절기가 바뀌어 출생 초에 따라 ${pillars[index].korean} 또는 ${alternate.korean}입니다. 초를 알 수 없어 표시된 ${pillars[index].korean}는 해당 분의 0초 참고값이며 오행·음양 집계에서 제외했습니다.`,
      );
    }
  }
  if (!unknownTime) {
    // Library getTimeInGanZhi always uses its 23:00 day convention. Calculate
    // the hour stem from OUR chosen day stem so midnight and zi stay coherent.
    const branchIndex = Math.floor((hour + 1) / 2) % 12;
    const stemIndex =
      ((STEM_CHINESE.indexOf(dayChinese[0]) % 5) * 2 + branchIndex) % 10;
    pillars.push(
      makePillar(
        "hour",
        STEM_CHINESE[stemIndex] + BRANCH_CHINESE[branchIndex],
        dayMaster,
      ),
    );
  }
  const elements: SajuResult["elements"] = {
    목: 0,
    화: 0,
    토: 0,
    금: 0,
    수: 0,
  };
  const yinYang = { yang: 0, yin: 0 };
  for (const pillar of pillars.filter((value) => !value.uncertain)) {
    for (const symbol of [pillar.stem, pillar.branch]) {
      elements[symbol.element]++;
      yinYang[symbol.yinYang === "양" ? "yang" : "yin"]++;
    }
  }
  const elementTotal = Object.values(elements).reduce(
    (sum, value) => sum + value,
    0,
  );
  const maximum = Math.max(...Object.values(elements));
  const mostVisible = ELEMENTS.filter(
    (element) => elements[element] === maximum,
  ).join("·");
  const missing = ELEMENTS.filter((element) => elements[element] === 0);
  const annualClock = Solar.fromYmd(year, 7, 1).getLunar();
  const annualPillar = makePillar(
    "annual",
    annualClock.getYearInGanZhiExact(),
    dayMaster,
  );
  const liChun = annualClock.getJieQiTable()["立春"];
  const lunarDate = `${resolved.lunar.year}년 ${resolved.lunar.intercalation ? "윤" : ""}${resolved.lunar.month}월 ${resolved.lunar.day}일`;
  const themes = [
    ...new Set(
      pillars
        .filter((pillar) => pillar.key !== "day" && !pillar.uncertain)
        .map((pillar) => TEN_GOD_THEMES[pillar.tenGod]),
    ),
  ];
  return {
    solarDate: isoDate(resolved.solar),
    lunarDate,
    birthTime: unknownTime ? null : input.birthTime!,
    dayBoundary,
    pillars,
    dayMaster,
    elements,
    elementTotal,
    yinYang,
    annual: {
      year,
      pillar: annualPillar,
      startsAt: termAsKoreanTime(liChun),
      interpretation: `${year}년 입춘부터 다음 해 입춘 전까지의 연간지는 ${annualPillar.korean}(${annualPillar.chinese})입니다. 일간과 연간 천간의 관계는 ${annualPillar.tenGod}이며, 전통적으로 ${TEN_GOD_THEMES[annualPillar.tenGod]}의 상징으로 읽습니다. 이는 사건이나 길흉을 예측한 결과가 아닙니다.`,
    },
    interpretations: [
      {
        title: "일간의 전통적 상징",
        text: `일간은 ${dayMaster.korean}(${dayMaster.chinese}), ${dayMaster.yinYang}의 ${dayMaster.element}입니다. 전통적으로 ${DAY_MASTER_IMAGES[STEM_CHINESE.indexOf(dayMaster.chinese)]}에 빗댑니다. 이 비유만으로 개인의 성격을 단정할 수는 없습니다.`,
      },
      {
        title: "눈에 보이는 오행 구성",
        text: `확정된 천간·지지 ${elementTotal}글자의 기본 오행 중 ${mostVisible}이 ${maximum}개로 가장 많이 나타납니다.${missing.length ? ` ${missing.join("·")}은 겉으로 드러난 글자에 없습니다.` : " 다섯 오행이 모두 나타납니다."} 이는 지장간·계절·합충을 반영한 강약 평가가 아니며, 개수가 적다는 이유로 해당 능력이나 운이 부족하다는 뜻은 아닙니다.`,
      },
      {
        title: "천간 십신으로 살펴보는 주제",
        text: themes.length
          ? `일간과 확정된 다른 천간의 관계에는 ${themes.join(", ")}의 주제가 나타납니다. 요즘 생활에서 어떤 주제에 관심이 가는지 돌아보는 참고로 읽어 주세요. 십신의 이름만으로 직업·재산·연애 결과를 판단하지 않습니다.`
          : "출생 시간이 확인되지 않은 절기 경계일이어서 다른 천간의 관계를 확정할 수 없습니다. 정확한 출생 시간을 확인하면 이 항목을 다시 계산할 수 있습니다.",
      },
    ],
    calculationBasis: [
      "양력·음력·윤달 변환은 한국 음력 표를 사용하는 korean-lunar-calendar 0.4.0으로 계산합니다. 중국 음력 날짜를 한국 음력으로 대신 사용하지 않습니다.",
      "연주는 입춘 시각, 월주는 12절의 시각을 기준으로 계산합니다. lunar-typescript 1.8.6의 UTC+8 절기 시각에 1시간을 더해 한국 표준시(UTC+9)와 비교합니다.",
      "절기 시각은 라이브러리의 천문 계산값이며 공식 천문력과 초 단위 일치를 보증하지 않습니다. 절입에 아주 가까운 출생 시각은 전문 만세력과 대조해 주세요.",
      `일주는 한국 표준시 ${dayBoundary === "zi" ? "23:00" : "00:00"}에 다음 간지로 바뀝니다. 시주는 선택한 일간을 기준으로 2시간 단위의 천간·지지를 계산합니다.`,
      "오행·음양은 확정된 각 천간과 지지의 기본 속성을 한 번씩 셉니다. 십신은 일간과 각 천간의 오행·음양 관계만 표시하며 지장간 십신은 포함하지 않습니다.",
      "한국 표준시 UTC+9를 사용합니다. 출생지 경도에 따른 진태양시 보정, 과거 표준시 변경과 서머타임은 적용하지 않습니다. 해외 출생이나 과거 시각 보정이 필요하면 전문 만세력과 함께 확인해 주세요.",
      "1900년 이후부터 한국 표준시 오늘까지의 생일을 지원합니다. 시간 미상에서는 시주를 만들지 않으며 절기 경계일의 연·월주를 확정하지 않습니다. 시간을 입력해도 해당 분 안에 절기가 바뀌면 출생 초를 알 수 없어 연·월주를 확정하지 않습니다.",
      "해석은 계산된 글자의 전통적 상징을 설명하는 규칙 기반 참고입니다. 대운·용신·신강신약·합충형해의 종합 판단과 미래 사건 예측은 제공하지 않습니다.",
    ],
    warnings,
  };
}
