import test from "node:test";
import assert from "node:assert/strict";
import { calculateSaju, validateBirthInput } from "../src/lib/saju.ts";

const solar = (birthDate, birthTime = "12:00", extra = {}) => ({
  birthDate,
  birthTime,
  calendar: "solar",
  ...extra,
});
const pillar = (result, key) =>
  result.pillars.find((value) => value.key === key);
const chars = (result) => result.pillars.map((value) => value.chinese);

test("known day epoch and next day match Korean ganji fixture", () => {
  assert.equal(
    pillar(calculateSaju(solar("2000-01-07")), "day").chinese,
    "甲子",
  );
  assert.equal(
    pillar(calculateSaju(solar("2000-01-08")), "day").chinese,
    "乙丑",
  );
});

test("known complete civil-time fixture uses solar terms rather than lunar month", () => {
  assert.deepEqual(chars(calculateSaju(solar("1990-01-01"))), [
    "己巳",
    "丙子",
    "丙寅",
    "甲午",
  ]);
});

test("Korean lunar New Year converts to Gregorian 2024-02-10", () => {
  const result = calculateSaju({
    birthDate: "2024-01-01",
    calendar: "lunar",
    unknownTime: true,
  });
  assert.equal(result.solarDate, "2024-02-10");
  assert.equal(result.lunarDate, "2024년 1월 1일");
});

test("Korean leap fifth month is not substituted with China's sixth month", () => {
  const result = calculateSaju({
    birthDate: "2017-05-01",
    calendar: "lunar",
    leapMonth: true,
    unknownTime: true,
  });
  assert.equal(result.solarDate, "2017-06-24");
  assert.equal(result.lunarDate, "2017년 윤5월 1일");
  assert.equal(
    calculateSaju(solar("2017-06-24")).lunarDate,
    "2017년 윤5월 1일",
  );
  assert.match(
    validateBirthInput({
      birthDate: "2017-06-01",
      calendar: "lunar",
      leapMonth: true,
      unknownTime: true,
    }),
    /존재하지/,
  );
});

test("actual lunar month lengths and leap status are validated", () => {
  assert.equal(
    calculateSaju({
      birthDate: "2023-02-01",
      calendar: "lunar",
      leapMonth: true,
      unknownTime: true,
    }).solarDate,
    "2023-03-22",
  );
  assert.match(
    validateBirthInput({
      birthDate: "2023-02-30",
      calendar: "lunar",
      leapMonth: true,
      unknownTime: true,
    }),
    /존재하지/,
  );
  assert.equal(
    calculateSaju({
      birthDate: "2023-02-30",
      calendar: "lunar",
      unknownTime: true,
    }).solarDate,
    "2023-03-21",
  );
});

test("impossible Gregorian date, invalid format and clock are rejected rather than normalized", () => {
  for (const input of [
    solar("2024-02-30"),
    solar("2024-2-01"),
    solar("2024-01-01", "24:00"),
    solar("2024-01-01", "12:60"),
  ]) {
    assert.ok(validateBirthInput(input));
    assert.throws(() => calculateSaju(input));
  }
  assert.ok(validateBirthInput(solar("1899-12-31")));
  assert.ok(validateBirthInput(solar("1900-01-01", "")));
  assert.equal(
    validateBirthInput(solar("1900-01-01", "", { unknownTime: true })),
    null,
  );
  assert.match(calculateSaju(solar("1900-01-01")).lunarDate, /^1899년/);
});

test("Li Chun changes year and month at 17:27 KST, not 16:27", () => {
  const before = calculateSaju(solar("2024-02-04", "17:26"));
  const after = calculateSaju(solar("2024-02-04", "17:28"));
  assert.deepEqual(chars(before).slice(0, 2), ["癸卯", "乙丑"]);
  assert.deepEqual(chars(after).slice(0, 2), ["甲辰", "丙寅"]);
  assert.equal(pillar(before, "day").chinese, pillar(after, "day").chinese);
  assert.equal(
    pillar(calculateSaju(solar("2024-02-04", "16:30")), "year").chinese,
    "癸卯",
  );
});

test("monthly Jie term changes at its KST minute", () => {
  assert.equal(
    pillar(calculateSaju(solar("2024-03-05", "11:22")), "month").chinese,
    "丙寅",
  );
  assert.equal(
    pillar(calculateSaju(solar("2024-03-05", "11:23")), "month").chinese,
    "丁卯",
  );
});

test("solar-term UTC+8 to KST conversion correctly rolls across midnight", () => {
  assert.equal(
    pillar(calculateSaju(solar("2026-06-06", "00:47")), "month").chinese,
    "癸巳",
  );
  assert.equal(
    pillar(calculateSaju(solar("2026-06-06", "00:49")), "month").chinese,
    "甲午",
  );
});

test("midnight policy keeps day stem consistent with hour stem at 23:00", () => {
  const late = calculateSaju(
    solar("2000-01-01", "23:00", { dayBoundary: "midnight" }),
  );
  const next = calculateSaju(
    solar("2000-01-02", "00:00", { dayBoundary: "midnight" }),
  );
  assert.deepEqual(chars(late).slice(2), ["戊午", "壬子"]);
  assert.deepEqual(chars(next).slice(2), ["己未", "甲子"]);
  assert.equal(
    pillar(calculateSaju(solar("2000-01-01", "22:59")), "hour").chinese,
    "癸亥",
  );
});

test("23:00 policy advances both day and hour stem together", () => {
  const late = calculateSaju(
    solar("2000-01-01", "23:00", { dayBoundary: "zi" }),
  );
  assert.deepEqual(chars(late).slice(2), ["己未", "甲子"]);
  assert.equal(
    pillar(
      calculateSaju(solar("2000-01-01", "22:59", { dayBoundary: "zi" })),
      "day",
    ).chinese,
    "戊午",
  );
});

test("unknown time creates no fictitious hour and explicitly chooses calendar-day convention", () => {
  const result = calculateSaju(
    solar("2000-01-07", "23:59", { unknownTime: true, dayBoundary: "zi" }),
  );
  assert.equal(result.birthTime, null);
  assert.equal(result.dayBoundary, "midnight");
  assert.equal(pillar(result, "day").chinese, "甲子");
  assert.equal(pillar(result, "hour"), undefined);
  assert.equal(result.elementTotal, 6);
  assert.equal(result.yinYang.yang + result.yinYang.yin, 6);
  assert.ok(result.warnings.some((value) => value.includes("자정")));
});

test("unknown time on Li Chun shows alternatives and excludes uncertain counts", () => {
  const result = calculateSaju(solar("2024-02-04", "", { unknownTime: true }));
  assert.equal(pillar(result, "year").uncertain, true);
  assert.equal(pillar(result, "month").uncertain, true);
  assert.deepEqual(
    pillar(result, "year").alternatives.map((value) => value.chinese),
    ["癸卯", "甲辰"],
  );
  assert.equal(result.elementTotal, 2);
  assert.equal(result.yinYang.yang + result.yinYang.yin, 2);
  assert.equal(pillar(result, "year").referenceNote, "00:00 참고");
});

test("known HH:MM on a solar-term transition minute cannot invent birth seconds", () => {
  const result = calculateSaju(solar("2024-02-04", "17:27"));
  assert.equal(pillar(result, "year").uncertain, true);
  assert.equal(pillar(result, "month").uncertain, true);
  assert.deepEqual(
    pillar(result, "year").alternatives.map((value) => value.chinese),
    ["癸卯", "甲辰"],
  );
  assert.equal(pillar(result, "year").referenceNote, "입력 분의 0초 참고");
  assert.equal(result.elementTotal, 4); // day + hour only
  assert.ok(result.warnings.every((value) => value.includes("출생 초")));
  assert.equal(
    pillar(calculateSaju(solar("2024-02-04", "17:26")), "year").uncertain,
    false,
  );
  assert.equal(
    pillar(calculateSaju(solar("2024-02-04", "17:28")), "year").uncertain,
    false,
  );
});

test("unknown time on a date-crossing monthly term is uncertain even at 00:48", () => {
  const result = calculateSaju(solar("2026-06-06", "", { unknownTime: true }));
  assert.equal(pillar(result, "year").uncertain, false);
  assert.deepEqual(
    pillar(result, "month").alternatives.map((value) => value.chinese),
    ["癸巳", "甲午"],
  );
  assert.equal(result.elementTotal, 4);
});

test("visible stems have correct ten-god relationships, identity and element counts", () => {
  const result = calculateSaju(solar("2000-01-07", "12:00"));
  assert.equal(result.dayMaster.chinese, "甲");
  assert.equal(pillar(result, "day").tenGod, "일간");
  assert.equal(pillar(result, "year").tenGod, "정재"); // 己(土陰) against 甲(木陽)
  assert.equal(pillar(result, "hour").tenGod, "편관"); // 庚(金陽) against 甲(木陽)
  assert.equal(result.elementTotal, 8);
  assert.equal(
    Object.values(result.elements).reduce((sum, value) => sum + value, 0),
    8,
  );
});

test("reference year begins at KST Li Chun and annual bounds are validated", () => {
  const result = calculateSaju(solar("1990-01-01"), 2024);
  assert.equal(result.annual.year, 2024);
  assert.equal(result.annual.pillar.chinese, "甲辰");
  assert.equal(result.annual.startsAt, "2024-02-04 17:27:07 (한국 표준시)");
  assert.throws(() => calculateSaju(solar("1990-01-01"), 2051));
  assert.throws(() => calculateSaju(solar("1990-01-01"), 2024.5));
});

test("future birth rejection and default reference year use Seoul's date, independent of host", () => {
  const actualNow = Date.now;
  try {
    Date.now = () => Date.parse("2026-10-10T16:00:00Z"); // Seoul Oct 11
    assert.equal(validateBirthInput(solar("2026-10-11")), null);
    assert.match(validateBirthInput(solar("2026-10-12")), /오늘 이후/);
    assert.match(
      validateBirthInput({
        birthDate: "2027-01-01",
        calendar: "lunar",
        unknownTime: true,
      }),
      /오늘 이후/,
    );
    Date.now = () => Date.parse("2026-12-31T15:30:00Z"); // Seoul 2027 Jan 1
    assert.equal(calculateSaju(solar("1990-01-01")).annual.year, 2027);
  } finally {
    Date.now = actualNow;
  }
});

test("repeated calculations are deterministic and independent of input object mutation", () => {
  const input = solar("1990-01-01");
  const first = calculateSaju(input, 2026);
  assert.deepEqual(calculateSaju(input, 2026), first);
  assert.deepEqual(input, solar("1990-01-01"));
  assert.ok(first.calculationBasis.some((value) => value.includes("진태양시")));
  assert.ok(
    first.calculationBasis.some((value) => value.includes("규칙 기반")),
  );
});
