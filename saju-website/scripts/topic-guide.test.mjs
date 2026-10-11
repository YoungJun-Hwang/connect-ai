import test from "node:test";
import assert from "node:assert/strict";
import {
  products,
  categories,
  findProduct,
  formatKrw,
} from "../src/lib/catalog.ts";
import { createTopicGuide } from "../src/lib/topic-guide.ts";
import { calculateSaju } from "../src/lib/saju.ts";

const input = (birthDate, birthTime = "12:00", extra = {}) => ({
  birthDate,
  birthTime,
  calendar: "solar",
  ...extra,
});
const known = calculateSaju(input("1990-01-01"), 2026);
const guideText = (guide) => JSON.stringify(guide);

test("catalog exposes ten unique paid topics and valid category membership", () => {
  assert.deepEqual(
    products.map((product) => product.id),
    [
      "life",
      "love",
      "year",
      "work",
      "career",
      "money",
      "study",
      "family",
      "change",
      "balance",
    ],
  );
  assert.equal(new Set(products.map((product) => product.title)).size, 10);
  assert.equal(categories[0], "전체 리포트");
  for (const product of products) {
    assert.ok(categories.includes(product.category));
    assert.ok(Number.isInteger(product.priceKrw) && product.priceKrw > 0);
    assert.equal(product.includes.length, 3);
    assert.ok(
      product.description &&
        product.sampleNote &&
        product.caption &&
        product.icon,
    );
    assert.equal(findProduct(product.id), product);
    assert.equal(findProduct(product.title), product);
  }
  assert.equal(findProduct("unknown"), products[0]);
  assert.equal(formatKrw(9900), "9,900원");
});

test("all ten topics contain independently written summaries, plans and reflection questions", () => {
  const guides = products.map((product) => createTopicGuide(known, product.id));
  assert.equal(new Set(guides.map((guide) => guide.summary)).size, 10);
  assert.equal(
    new Set(guides.map((guide) => JSON.stringify(guide.plan))).size,
    10,
  );
  assert.equal(
    new Set(guides.map((guide) => JSON.stringify(guide.questions))).size,
    10,
  );
  for (const guide of guides) {
    assert.equal(guide.plan.length, 7);
    assert.deepEqual(
      guide.plan.map((step) => step.day),
      [1, 2, 3, 4, 5, 6, 7],
    );
    assert.equal(new Set(guide.plan.map((step) => step.title)).size, 7);
    assert.ok(guide.plan.every((step) => step.action.length > 45));
    assert.equal(guide.questions.length, 3);
    assert.ok(guide.questions.every((question) => question.endsWith("?")));
    assert.ok(guide.evidence.length >= 3);
    assert.ok(guide.boundary.length > 40);
    assert.doesNotMatch(
      guideText(guide),
      /\{(?:master|focus|relations|annual|elements|polarity)\}/,
    );
  }
});

test("summaries and evidence reflect the actual user chart rather than a fixed sample", () => {
  const other = calculateSaju(input("2000-01-07"), 2026);
  for (const product of products) {
    const first = createTopicGuide(known, product.id);
    const second = createTopicGuide(other, product.id);
    assert.match(first.summary, /병\(丙\)/);
    assert.match(second.summary, /갑\(甲\)/);
    assert.notEqual(first.summary, second.summary);
    assert.ok(
      first.evidence.some((item) =>
        item.text.includes(`목 ${known.elements.목}개`),
      ),
    );
    assert.ok(
      second.evidence.some((item) =>
        item.text.includes(`목 ${other.elements.목}개`),
      ),
    );
    assert.ok(guideText(first).includes("8글자"));
  }
});

test("money topic only cites confirmed heavenly-stem wealth relationships", () => {
  const result = calculateSaju(input("2000-01-07"), 2026);
  const guide = createTopicGuide(result, "money");
  const evidence = guide.evidence.find(
    (item) => item.label === "이 주제에 연결한 확정 천간",
  ).text;
  assert.match(evidence, /연주 기\(己\) 정재/);
  assert.doesNotMatch(evidence, /시주 경\(庚\) 편관/);
  assert.match(guide.boundary, /투자 수익/);
});

test("missing focused ten gods never claim missing abilities or wealth", () => {
  const unknown = calculateSaju(
    input("2024-02-04", "", { unknownTime: true }),
    2026,
  );
  for (const id of ["money", "study", "career"]) {
    const guide = createTopicGuide(unknown, id);
    assert.match(guide.summary, /표시 없음/);
    assert.ok(
      guide.evidence.some((item) =>
        item.text.includes("관련 경험이나 능력이 없다는 뜻은 아닙니다"),
      ),
    );
  }
  const money = createTopicGuide(unknown, "money");
  assert.match(money.plan[0].action, /자원 관리 능력이 없다는 뜻이 아닙니다/);
  const life = createTopicGuide(unknown, "life");
  assert.match(life.plan[3].action, /확정할 수 없습니다/);
  assert.doesNotMatch(life.plan[3].action, /이 이름과/);
});

test("unknown time on Li Chun keeps two confirmed symbols and excludes uncertain ten-god evidence", () => {
  const result = calculateSaju(
    input("2024-02-04", "", { unknownTime: true }),
    2026,
  );
  assert.equal(result.elementTotal, 2);
  const excluded = result.pillars.filter((pillar) => pillar.uncertain);
  for (const product of products) {
    const guide = createTopicGuide(result, product.id);
    const text = guideText(guide);
    assert.match(text, /확정된 2글자/);
    assert.ok(
      guide.uncertainty.some((warning) => warning.includes("시주는 계산하지")),
    );
    assert.ok(
      guide.uncertainty.some((warning) =>
        warning.includes("이 주제의 십성 근거"),
      ),
    );
    for (const pillar of excluded)
      assert.ok(
        !text.includes(
          `${pillar.label} ${pillar.stem.korean}(${pillar.stem.chinese}) ${pillar.tenGod}`,
        ),
      );
  }
});

test("known transition minute preserves unresolved birth seconds and four-symbol count", () => {
  const result = calculateSaju(input("2024-02-04", "17:27"), 2026);
  assert.equal(result.elementTotal, 4);
  for (const product of products) {
    const guide = createTopicGuide(result, product.id);
    assert.match(guideText(guide), /확정된 4글자/);
    assert.ok(guide.uncertainty.some((warning) => warning.includes("출생 초")));
    assert.ok(
      guide.uncertainty.some((warning) => warning.includes("미확정 연주·월주")),
    );
  }
});

test("annual topics use the supplied reference year and actual annual pillar", () => {
  const first = calculateSaju(input("1990-01-01"), 2025);
  const second = calculateSaju(input("1990-01-01"), 2026);
  for (const id of ["year", "change"]) {
    const firstGuide = createTopicGuide(first, id);
    const secondGuide = createTopicGuide(second, id);
    assert.match(firstGuide.summary, /2025년 연주 을사\(乙巳\)/);
    assert.match(secondGuide.summary, /2026년 연주 병오\(丙午\)/);
    assert.ok(
      firstGuide.evidence.some((item) =>
        item.text.includes(first.annual.startsAt),
      ),
    );
    assert.ok(
      secondGuide.evidence.some((item) =>
        item.text.includes(second.annual.startsAt),
      ),
    );
    assert.notEqual(firstGuide.summary, secondGuide.summary);
  }
});

test("scope states unsupported compatibility, monthly luck, investment and diagnosis clearly", () => {
  assert.match(createTopicGuide(known, "love").boundary, /두 사람 궁합/);
  assert.match(createTopicGuide(known, "family").boundary, /가족 간 궁합/);
  assert.match(createTopicGuide(known, "year").boundary, /월운·대운/);
  assert.match(
    createTopicGuide(known, "money").boundary,
    /금융·투자 자문이 아닙니다/,
  );
  assert.match(createTopicGuide(known, "balance").boundary, /진단·치료/);
  assert.match(createTopicGuide(known, "change").boundary, /성공률/);
});

test("guide creation is deterministic, resolves titles and leaves the calculation unchanged", () => {
  const snapshot = structuredClone(known);
  const first = createTopicGuide(known, "연애와 관계");
  assert.deepEqual(first, createTopicGuide(known, "love"));
  assert.deepEqual(first, createTopicGuide(known, "love"));
  assert.deepEqual(known, snapshot);
  assert.equal(createTopicGuide(known, "unknown").productId, "life");
});
