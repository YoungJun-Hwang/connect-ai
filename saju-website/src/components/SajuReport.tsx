import { useId } from "react";
import type { SajuInput, SajuPillar, SajuResult } from "../lib/saju";
import type { TopicGuide } from "../lib/topic-guide";
import "./SajuReport.css";

type ReportProps = {
  result: SajuResult;
  name: string;
  topic: string;
  input: SajuInput;
  guide: TopicGuide;
};
const elementOrder = ["목", "화", "토", "금", "수"] as const;
const elementNames = { 목: "나무", 화: "불", 토: "흙", 금: "금속", 수: "물" };

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
  guide: TopicGuide,
) {
  const dateBasis = `${input.calendar === "solar" ? "양력" : `음력${input.leapMonth ? " 윤달" : ""}`} ${input.birthDate}`;
  return [
    `${brandName} · ${name}님의 사주 결과`,
    `주제: ${guide.title}`,
    `입력 생일: ${dateBasis}`,
    `환산 양력: ${result.solarDate}`,
    `환산 음력: ${result.lunarDate}`,
    `태어난 시간: ${result.birthTime ?? "모름 (시주 미계산)"}`,
    `하루 경계: ${result.dayBoundary === "zi" ? "23시" : "0시"}`,
    "",
    "사주 원국 · 연 / 월 / 일 / 시",
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
    `[구매한 주제의 참고 리포트 · ${guide.title}]`,
    guide.summary,
    "",
    "이 주제의 계산 근거",
    ...guide.evidence.map((item) => `${item.label}: ${item.text}`),
    "",
    "7일 실천 계획",
    "아래 7일은 기록과 실천의 순서이며 길일이나 운의 시기를 계산한 일정이 아닙니다.",
    ...guide.plan.map(
      (step) => `${step.day}일차 · ${step.title}\n${step.action}`,
    ),
    "",
    "자기점검 질문",
    ...guide.questions.map((question, index) => `${index + 1}. ${question}`),
    "",
    "이 주제의 해석 범위",
    guide.boundary,
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
    ...[...new Set([...result.warnings, ...guide.uncertainty])].map(
      (text) => `- ${text}`,
    ),
    "",
    "이 파일은 구매한 주제의 참고 리포트입니다. 역법으로 계산한 원국과 전통 명리 규칙을 생활 기록의 질문에 연결했으며, 미래나 사건을 확정하는 결과가 아닙니다. 전문가의 개별 상담은 포함하지 않습니다.",
  ].join("\n");
}

export default function SajuReport({
  result,
  name,
  topic,
  input,
  guide,
}: ReportProps) {
  const id = useId();
  const topicWarnings = guide.uncertainty.filter(
    (warning) => !result.warnings.includes(warning),
  );
  return (
    <div className="saju-report" data-report-topic={guide.productId}>
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
          연주부터 시주 순서로 표시해요. 일간은 나를 나타내는 기준입니다.
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
        <h3 id={`${id}-reading`}>{guide.title} · 주제 리포트</h3>
        <div className="saju-topic-reading">
          <p>{guide.summary}</p>
        </div>
        {topicWarnings.length > 0 && (
          <div className="saju-topic-uncertainty">
            {topicWarnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        )}
        <div className="saju-topic-evidence">
          <h4>이 주제의 계산 근거</h4>
          <dl>
            {guide.evidence.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.text}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="saju-topic-plan">
          <h4>7일 실천 계획</h4>
          <p className="saju-section-intro">
            7일은 기록과 실천의 순서예요. 길일이나 운의 시기를 계산한 일정이
            아닙니다.
          </p>
          <ol>
            {guide.plan.map((step) => (
              <li key={step.day}>
                <span className="saju-plan-day">{step.day}일차</span>
                <div>
                  <h5>{step.title}</h5>
                  <p>{step.action}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="saju-topic-questions">
          <h4>자기점검 질문</h4>
          <ol>
            {guide.questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ol>
        </div>

        <div className="saju-topic-boundary">
          <h4>이 주제의 해석 범위</h4>
          <p>{guide.boundary}</p>
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
