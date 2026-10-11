import { useId } from "react";
import type { SajuInput, SajuPillar, SajuResult } from "../lib/saju";
import "./SajuReport.css";

type ReportProps = {
  result: SajuResult;
  name: string;
  topic: string;
  input: SajuInput;
};
const elementOrder = ["목", "화", "토", "금", "수"] as const;
const elementNames = { 목: "나무", 화: "불", 토: "흙", 금: "금속", 수: "물" };

function topicReading(result: SajuResult, topic: string) {
  const master = `${result.dayMaster.korean}(${result.dayMaster.chinese}) ${result.dayMaster.element}${result.dayMaster.yinYang === "양" ? " · 양" : " · 음"}`;
  const visibleTenGods = result.pillars
    .filter((pillar) => pillar.key !== "day" && !pillar.uncertain)
    .map((pillar) => `${pillar.label} ${pillar.tenGod}`)
    .join(", ");
  if (topic === "연애와 관계")
    return `나를 나타내는 일간은 ${master}입니다. 오행과 십성을 관계 속 내 표현 방식을 돌아보는 참고로 읽어보세요.${visibleTenGods ? ` 확정된 천간의 십성은 ${visibleTenGods}입니다.` : ""} 상대의 생일은 입력하지 않았으므로 두 사람의 궁합이나 만남의 시기를 판단하는 결과는 아닙니다.`;
  if (topic === "일과 재물")
    return `일간 ${master}을 기준으로 다른 천간과의 관계를 십성으로 표시했습니다.${visibleTenGods ? ` ${visibleTenGods}을 확인할 수 있어요.` : ""} 십성은 역할을 해석하는 전통 분류입니다. 재성이 있다고 수입을 예측하거나, 특정 오행이 적다고 직업을 단정할 수는 없어요. 실제 선택에는 경험과 현재 상황도 함께 고려해주세요.`;
  if (topic === "올해의 흐름")
    return `${result.annual.year}년의 연주는 ${result.annual.pillar.korean}(${result.annual.pillar.chinese})입니다. ${result.annual.interpretation} 이 항목은 올해 연주와 내 일간의 관계를 읽는 참고이며, 월별 사건이나 대운을 계산한 예측은 아닙니다.`;
  return `나를 나타내는 일간은 ${master}입니다. 아래 원국의 천간과 지지를 함께 읽어보세요. 오행 개수는 눈에 보이는 글자의 기본 오행을 센 값입니다. 개수만으로 사주의 좋고 나쁨이나 용신을 정할 수는 없어요.`;
}

function PillarCard({ pillar }: { pillar: SajuPillar }) {
  return (
    <div
      data-pillar={pillar.key}
      className={`saju-pillar${pillar.uncertain ? " is-uncertain" : ""}`}
    >
      <h4>{pillar.label}</h4>
      {pillar.uncertain && (
        <span className="saju-uncertain-label">
          미확정 · {pillar.referenceNote ?? "00:00 참고"}
        </span>
      )}
      <div
        className="saju-pillar-symbols"
        aria-label={`${pillar.korean}, ${pillar.chinese}`}
      >
        {[pillar.stem, pillar.branch].map((symbol, index) => (
          <div
            key={index}
            className={`saju-symbol element-${elementOrder.indexOf(symbol.element)}`}
          >
            <span className="saju-hanja" lang="zh">
              {symbol.chinese}
            </span>
            <strong>{symbol.korean}</strong>
            <small>
              {symbol.yinYang} · {symbol.element}
            </small>
          </div>
        ))}
      </div>
      <p className="saju-ten-god">{pillar.tenGod}</p>
      {pillar.uncertain && pillar.alternatives && (
        <p className="saju-pillar-alternatives">
          가능한 원국
          <br />
          {pillar.alternatives
            .map((item) => `${item.korean}(${item.chinese})`)
            .join(" / ")}
        </p>
      )}
    </div>
  );
}

export function createReportText(
  result: SajuResult,
  name: string,
  topic: string,
  input: SajuInput,
  brandName: string,
) {
  const dateBasis = `${input.calendar === "solar" ? "양력" : `음력${input.leapMonth ? " 윤달" : ""}`} ${input.birthDate}`;
  return [
    `${brandName} · ${name}님의 사주 결과`,
    `주제: ${topic}`,
    `입력 생일: ${dateBasis}`,
    `환산 양력: ${result.solarDate}`,
    `환산 음력: ${result.lunarDate}`,
    `태어난 시간: ${result.birthTime ?? "모름 (시주 미계산)"}`,
    `하루 경계: ${result.dayBoundary === "zi" ? "23시" : "0시"}`,
    "",
    "사주 원국 · 년 / 월 / 일 / 시",
    ...result.pillars.map(
      (pillar) =>
        `${pillar.label}: ${pillar.korean}(${pillar.chinese}) · 천간 ${pillar.stem.yinYang}${pillar.stem.element}, 지지 ${pillar.branch.yinYang}${pillar.branch.element} · 천간 십성 ${pillar.tenGod}${pillar.uncertain ? ` [미확정, ${pillar.referenceNote ?? "00:00 참고"}; 가능한 값 ${pillar.alternatives?.map((p) => `${p.korean}(${p.chinese})`).join(" / ")}]` : ""}`,
    ),
    ...(result.birthTime === null
      ? ["시주: 출생 시각 미입력으로 계산하지 않음"]
      : []),
    `일간: ${result.dayMaster.korean}(${result.dayMaster.chinese}) · ${result.dayMaster.yinYang}${result.dayMaster.element}`,
    "",
    `기본 오행 분포 (${result.elementTotal}글자, 미확정 원국 제외): ${elementOrder.map((element) => `${element} ${result.elements[element]}`).join(" / ")}`,
    `음양: 양 ${result.yinYang.yang} / 음 ${result.yinYang.yin}`,
    "지장간·계절 가중치를 포함하지 않은 단순 분포입니다. 신강·신약·용신 판단은 제공하지 않습니다.",
    "",
    `[${topic}]`,
    topicReading(result, topic),
    "",
    ...result.interpretations.flatMap((item) => [item.title, item.text, ""]),
    `${result.annual.year}년 연주: ${result.annual.pillar.korean}(${result.annual.pillar.chinese}) · ${result.annual.pillar.tenGod}`,
    `입춘 기준 시작: ${result.annual.startsAt}`,
    result.annual.interpretation,
    "",
    "계산 기준",
    ...result.calculationBasis.map((text) => `- ${text}`),
    "",
    "확인할 점",
    ...result.warnings.map((text) => `- ${text}`),
    "",
    "이 결과는 역법으로 계산한 원국과 전통 명리 규칙에 따른 참고 해석입니다. 개인의 미래나 사건을 확정하는 결과가 아닙니다. 전문가 상담·예약·결제는 진행되지 않았습니다.",
  ].join("\n");
}

export default function SajuReport({
  result,
  name,
  topic,
  input,
}: ReportProps) {
  const id = useId();
  return (
    <div className="saju-report">
      <dl className="saju-birth-summary">
        <div>
          <dt>입력한 생일</dt>
          <dd>
            {input.birthDate} ·{" "}
            {input.calendar === "solar"
              ? "양력"
              : `음력${input.leapMonth ? " · 윤달" : ""}`}
          </dd>
        </div>
        <div>
          <dt>양력 / 음력</dt>
          <dd>
            {result.solarDate}
            <br />
            <span>{result.lunarDate}</span>
          </dd>
        </div>
        <div>
          <dt>출생 시간</dt>
          <dd>{result.birthTime ?? "시간 모름 · 시주 미계산"}</dd>
        </div>
        <div>
          <dt>하루 경계</dt>
          <dd>
            {result.dayBoundary === "zi" ? "23시 (자시)" : "0시"} · 한국 표준시
          </dd>
        </div>
      </dl>

      {result.warnings.length > 0 && (
        <div className="saju-warnings">
          <h3>계산 전에 확인한 점</h3>
          <ul>
            {result.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <section aria-labelledby={`${id}-chart`} className="saju-report-section">
        <h3 id={`${id}-chart`}>나의 사주 원국</h3>
        <p className="saju-section-intro">
          년주부터 시주 순서로 표시해요. 일간은 나를 나타내는 기준입니다.
        </p>
        <div className="saju-pillars">
          {result.pillars.map((pillar) => (
            <PillarCard key={pillar.key} pillar={pillar} />
          ))}
          {result.birthTime === null && (
            <div
              data-pillar="hour-missing"
              className="saju-pillar saju-hour-missing"
            >
              <h4>시주</h4>
              <div>시간 모름</div>
              <p>
                출생 시각 없이
                <br />
                계산하지 않아요.
              </p>
            </div>
          )}
        </div>
        <div className="saju-daymaster">
          <span>{name}님의 일간</span>
          <strong>
            {result.dayMaster.korean}
            <span lang="zh">{result.dayMaster.chinese}</span>
          </strong>
          <span>
            {result.dayMaster.yinYang}의 {result.dayMaster.element}(
            {elementNames[result.dayMaster.element]})
          </span>
        </div>
        <p className="saju-explanation">
          표의 십성은 각 천간을 일간과 비교한 관계입니다. 지지의 지장간에 대한
          십성은 포함하지 않아요.
        </p>
      </section>

      <section
        aria-labelledby={`${id}-elements`}
        className="saju-report-section"
      >
        <h3 id={`${id}-elements`}>오행과 음양</h3>
        <p className="saju-section-intro">
          확정된 천간·지지 {result.elementTotal}글자의 기본 오행을 세었어요.
        </p>
        <ul className="saju-element-bars">
          {elementOrder.map((element, index) => (
            <li key={element} className={`element-${index}`}>
              <span className="saju-element-name">
                {element}
                <small>{elementNames[element]}</small>
              </span>
              <span className="saju-element-track" aria-hidden="true">
                <span
                  style={{
                    width: `${result.elementTotal ? (result.elements[element] / result.elementTotal) * 100 : 0}%`,
                  }}
                />
              </span>
              <strong>
                {result.elements[element]}
                <span>개</span>
              </strong>
            </li>
          ))}
        </ul>
        <div className="saju-yinyang">
          <span>
            양 <strong>{result.yinYang.yang}</strong>개
          </span>
          <span>
            음 <strong>{result.yinYang.yin}</strong>개
          </span>
        </div>
        <p className="saju-explanation">
          지장간과 계절 가중치는 반영하지 않았어요. 부족한 오행이 곧 필요한
          오행이라는 뜻은 아니며, 신강·신약과 용신은 판단하지 않아요.
        </p>
      </section>

      <section
        aria-labelledby={`${id}-reading`}
        className="saju-report-section"
      >
        <h3 id={`${id}-reading`}>{topic} · 읽어보기</h3>
        <div className="saju-topic-reading">
          <p>{topicReading(result, topic)}</p>
        </div>
        <div className="saju-readings">
          {result.interpretations.map((item) => (
            <article key={item.title}>
              <h4>{item.title}</h4>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby={`${id}-annual`} className="saju-report-section">
        <h3 id={`${id}-annual`}>{result.annual.year}년의 참고 흐름</h3>
        <div className="saju-annual">
          <div>
            <span>올해의 연주</span>
            <strong>
              {result.annual.pillar.korean}{" "}
              <span lang="zh">{result.annual.pillar.chinese}</span>
            </strong>
            <small>천간 십성 · {result.annual.pillar.tenGod}</small>
          </div>
          <p>{result.annual.interpretation}</p>
        </div>
        <p className="saju-explanation">
          명리의 한 해는 입춘부터 시작해요. {result.annual.year}년 입춘:{" "}
          {result.annual.startsAt}. 월운·대운이나 구체적인 사건의 시기는
          계산하지 않았어요.
        </p>
      </section>

      <details className="saju-calculation-basis">
        <summary>계산 기준과 해석 범위 보기</summary>
        <ul>
          {result.calculationBasis.map((basis) => (
            <li key={basis}>{basis}</li>
          ))}
        </ul>
        <p>
          원국은 입력한 생일을 역법으로 계산한 값이며, 해석 문장은 계산된
          일간·오행·십성에 연결한 전통 명리 참고입니다. AI 상담이나 전문가의
          개별 상담은 아닙니다. 미래의 사건이나 개인의 성격을 확정하지 않아요.
        </p>
      </details>
    </div>
  );
}
