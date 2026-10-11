import { findProduct } from "./catalog.ts";
import type { SajuElement, SajuResult } from "./saju.ts";

export type TopicGuide = {
  productId: string;
  title: string;
  summary: string;
  evidence: { label: string; text: string }[];
  plan: { day: number; title: string; action: string }[];
  questions: string[];
  boundary: string;
  uncertainty: string[];
};

type TopicDefinition = {
  introduction: string;
  focusGods: readonly string[];
  plan: readonly { title: string; action: string }[];
  questions: readonly string[];
  boundary: string;
};

// These are reflection exercises, not predictions. Templates use only facts
// already calculated by the engine; uncertain pillars never supply ten gods.
const topics: Record<string, TopicDefinition> = {
  life: {
    introduction:
      "일간({master})을 기준으로 원국을 읽습니다. 확정된 글자의 기본 오행은 {elements}입니다. 이 구성과 실제 생활 경험을 나란히 놓고, 내가 지키고 싶은 기준을 찾아보세요.",
    focusGods: [],
    plan: [
      {
        title: "나의 기준 적기",
        action:
          "일간({master})의 전통적 상징을 읽고, 내 경험과 닮은 점·다른 점을 각각 한 문장으로 적으세요.",
      },
      {
        title: "분포와 경험 구분하기",
        action:
          "기본 오행 {elements}를 확인하세요. 글자 개수로 능력을 단정하지 않고, 최근 한 달 기억에 남는 경험 세 가지를 별도로 적으세요.",
      },
      {
        title: "중요한 가치 고르기",
        action:
          "지난 일주일의 선택 세 가지에서 공통으로 중요했던 가치를 찾아 단어 두 개로 정리하세요.",
      },
      {
        title: "반복되는 역할 살피기",
        action:
          "천간 십성 {relations}을 참고해요. 이 이름과 실제로 맡은 역할을 비교하고, 설명되지 않는 경험도 한 가지 남기세요.",
      },
      {
        title: "주변의 관점 듣기",
        action:
          "믿을 만한 사람 한 명에게 내가 꾸준히 잘하는 행동을 물어보세요. 리포트의 문장과 다른 의견도 그대로 기록하세요.",
      },
      {
        title: "작은 선택 해보기",
        action:
          "세 번째 날 고른 가치 중 하나를 반영하는 작은 행동을 정하고, 20분 안에 실행하세요.",
      },
      {
        title: "내 설명 다시 쓰기",
        action:
          "기록을 읽고 ‘나는 이런 상황에서 이런 선택을 한다’는 문장 두 개를 쓰세요. 사주 기호보다 실제 사례를 근거로 남기세요.",
      },
    ],
    questions: [
      "요즘 내가 가장 지키고 싶은 생활 기준은 무엇인가요?",
      "리포트의 전통적 상징과 맞지 않는 내 경험에는 무엇이 있나요?",
      "일주일의 기록에서 반복된 선택을 앞으로 어떻게 다루고 싶나요?",
    ],
    boundary:
      "개인의 원국을 읽는 전통 명리 참고입니다. 글자 개수만으로 성격·재능·인생의 길흉이나 용신을 단정하지 않으며, 대운의 종합 해석은 포함하지 않습니다.",
  },
  love: {
    introduction:
      "일간({master})을 기준으로 관계를 돌아봅니다. 이 주제에 연결할 수 있는 확정 천간은 {focus}입니다. 십성의 이름을 연애 결과로 바꾸기보다, 내가 요구를 말하고 상대의 말을 듣는 방식을 점검해 보세요.",
    focusGods: ["비견", "겁재", "식신", "상관", "정인", "편인"],
    plan: [
      {
        title: "대화 한 장면 고르기",
        action:
          "확정 천간 {focus}을 확인한 뒤 최근 관계에서 기억에 남은 대화 한 장면을 적으세요. 상대의 의도를 추측하기보다 실제 말을 기록하세요.",
      },
      {
        title: "감정과 요청 나누기",
        action:
          "그 장면에서 느낀 감정과 원했던 행동을 나누어 쓰세요. ‘나는 …을 느꼈고 …을 부탁하고 싶다’는 한 문장을 만들어 보세요.",
      },
      {
        title: "듣는 시간 마련하기",
        action:
          "안전하고 편안한 관계에서 10분 동안 상대의 말을 끊지 않고 들어보세요. 들은 내용과 내 추측을 구분해 기록하세요.",
      },
      {
        title: "내 경계 정리하기",
        action:
          "관계에서 편안한 행동과 부담스러운 행동을 각각 두 가지 적으세요. 부담스러운 행동 하나에 대한 구체적인 경계 문장을 준비하세요.",
      },
      {
        title: "작은 요청 전달하기",
        action:
          "두 번째 날 만든 요청을 적절한 상대에게 차분히 전달해 보세요. 대화를 원하지 않는 상대에게 응답을 강요하지 마세요.",
      },
      {
        title: "상호성 확인하기",
        action:
          "지난 대화에서 서로의 말과 경계가 존중되었는지 확인하세요. 생일이나 십성보다 실제 반응을 근거로 적으세요.",
      },
      {
        title: "관계 원칙 한 줄 만들기",
        action:
          "앞으로 지킬 대화 원칙 한 가지와 관계에서 필요한 조건 한 가지를 정하세요. 결과를 결혼·이별의 예언으로 읽지 마세요.",
      },
    ],
    questions: [
      "나는 호감과 불편함을 상대가 이해할 수 있게 어떻게 표현하나요?",
      "관계에서 지켜졌으면 하는 경계를 구체적으로 말할 수 있나요?",
      "상대의 실제 행동과 내가 기대한 모습을 구분하고 있나요?",
    ],
    boundary:
      "나의 원국과 관계 습관을 살펴보는 개인 주제 리포트입니다. 상대의 생일을 비교하는 두 사람 궁합, 배우자 판단, 만남·결혼·이별 시기 예측은 제공하지 않습니다.",
  },
  year: {
    introduction:
      "연간지({annual})를 일간({master})과 비교합니다. 올해 연간 천간의 관계는 {annualGod}입니다. 전통적 상징을 올해의 실제 목표에 연결하되, 일이 일어날 시기나 성과의 보장으로 읽지 마세요.",
    focusGods: [],
    plan: [
      {
        title: "한 해의 기준 확인하기",
        action:
          "연간지({annual})와 입춘 기준 시작 {annualStart}을 확인하세요. 올해 실제로 중요하게 느끼는 주제를 한 문장으로 적으세요.",
      },
      {
        title: "목표 세 개 적기",
        action:
          "전통적 연간 십성 {annualGod}의 상징과 별도로, 올해 이루고 싶은 목표 세 개를 적으세요. 타인의 기대가 아닌 내 이유를 함께 남기세요.",
      },
      {
        title: "현재 상태 확인하기",
        action:
          "각 목표에 대해 현재 가진 시간·비용·도움을 적으세요. 모르는 정보는 추측하지 않고 ‘확인 필요’로 표시하세요.",
      },
      {
        title: "우선순위 하나 고르기",
        action:
          "목표 세 개 중 지금 가장 중요하고 시작 가능한 것 하나를 고르세요. 연간지의 길흉이 아니라 실제 조건을 기준으로 정하세요.",
      },
      {
        title: "첫 행동 작게 만들기",
        action:
          "우선 목표의 첫 행동을 30분 안에 할 수 있는 크기로 나누어 실행하세요. 결과와 다음에 필요한 정보를 기록하세요.",
      },
      {
        title: "장애물 준비하기",
        action:
          "목표를 방해할 수 있는 현실적인 조건 두 가지와 대응 방법을 정하세요. 아직 일어나지 않은 사건을 예언처럼 가정하지 마세요.",
      },
      {
        title: "점검 날짜 정하기",
        action:
          "2주 뒤 목표를 다시 확인할 날짜를 내 일정에 맞춰 정하세요. 이 날짜는 길일이나 월운으로 고른 시점이 아닙니다.",
      },
    ],
    questions: [
      "올해의 목표 중 내가 직접 바꿀 수 있는 부분은 무엇인가요?",
      "목표의 진전을 확인할 수 있는 구체적인 행동이나 기록은 무엇인가요?",
      "예상과 달라졌을 때 어떤 정보를 확인하고 계획을 바꿀 건가요?",
    ],
    boundary:
      "입춘 기준 연간지와 일간의 관계를 설명하는 참고입니다. 월운·대운, 월별 길흉, 사건의 시기나 올해의 성공 가능성을 계산한 결과가 아닙니다.",
  },
  work: {
    introduction:
      "일간({master})에 대한 확정 천간의 업무·자원 주제는 {focus}입니다. 업무 역할과 생활 자원이 실제로 어떻게 연결되는지 살펴보세요. 재성·관성의 유무는 수입이나 지위의 예측이 아닙니다.",
    focusGods: ["식신", "상관", "편재", "정재", "편관", "정관"],
    plan: [
      {
        title: "업무와 자원 연결하기",
        action:
          "확정 천간 {focus}을 확인하고, 현재 맡은 역할 세 가지와 각 역할에 드는 시간·비용을 적으세요.",
      },
      {
        title: "하루의 시간 기록하기",
        action:
          "업무·이동·생활에 쓴 시간을 하루만 기록하세요. 원했던 사용과 실제 사용이 가장 다른 항목을 하나 고르세요.",
      },
      {
        title: "보이지 않는 비용 찾기",
        action:
          "자주 하는 업무 한 가지의 준비·정리·연락 시간을 함께 계산하세요. 눈에 띄는 성과 외에 필요한 자원도 적으세요.",
      },
      {
        title: "역할 기대 맞추기",
        action:
          "함께 일하는 사람과 역할 또는 완료 기준 하나를 확인하세요. 십성으로 상대를 분류하기보다 실제 기대를 물어보세요.",
      },
      {
        title: "한 가지 비효율 줄이기",
        action:
          "반복되는 작은 업무 하나를 줄이거나 정리해 보세요. 절약한 시간과 추가로 필요한 수고를 함께 기록하세요.",
      },
      {
        title: "생활 조건과 비교하기",
        action:
          "현재 업무가 내 비용·시간·휴식 조건과 맞는지 항목별로 비교하세요. 미래 수입을 사주로 추정해 넣지 마세요.",
      },
      {
        title: "업무 원칙 정하기",
        action:
          "다음 주 지킬 업무 기준 한 가지와 자원 관리 기준 한 가지를 정하세요. 일주일의 실제 기록을 선택 이유로 남기세요.",
      },
    ],
    questions: [
      "지금 맡은 업무에서 기대되는 결과와 실제로 쓰는 자원은 무엇인가요?",
      "일의 성과를 내기 위해 조정할 수 있는 생활 조건은 무엇인가요?",
      "앞으로 더 맡거나 줄이고 싶은 역할의 이유를 경험으로 설명할 수 있나요?",
    ],
    boundary:
      "업무와 생활 자원을 정리하는 개인 참고입니다. 적합 직업·승진·사업 성과·수입을 예측하지 않으며 재성이 보인다는 이유로 재산이 많다고 판단하지 않습니다.",
  },
  career: {
    introduction:
      "일간({master})과 확정 천간 {focus}에서 역할·표현·학습의 전통적 주제를 읽습니다. 이직이나 직업 선택에는 이 기호보다 실제 경력, 채용 조건, 생활 제약을 근거로 사용하세요.",
    focusGods: ["식신", "상관", "편관", "정관", "편인", "정인"],
    plan: [
      {
        title: "경험에서 역할 찾기",
        action:
          "확정 천간 {focus}을 읽고, 최근 업무에서 잘 해낸 행동 세 가지를 적으세요. 직업 이름보다 내가 한 행동을 구체적으로 남기세요.",
      },
      {
        title: "선택 조건 정하기",
        action:
          "다음 역할에 필요한 조건을 업무 내용·시간·보수·위치로 나누세요. 반드시 필요한 조건과 조정 가능한 조건을 구분하세요.",
      },
      {
        title: "선택지 두 개 조사하기",
        action:
          "관심 있는 역할 두 개의 실제 공고나 공식 정보를 찾아보세요. 요구 역량과 확인하지 못한 내용을 따로 기록하세요.",
      },
      {
        title: "경력 근거 모으기",
        action:
          "조사한 요구 역량 하나를 내 경험과 연결해 보세요. 맡은 일·한 행동·확인 가능한 결과 순서로 사례 한 개를 정리하세요.",
      },
      {
        title: "현실 정보 물어보기",
        action:
          "가능하다면 해당 업무를 아는 사람에게 일과와 어려움을 물어보세요. 채용이나 합격을 보장하는 말보다 구체적인 조건을 확인하세요.",
      },
      {
        title: "작은 업무 실험하기",
        action:
          "관심 역할과 관련된 짧은 과제나 학습을 30분 진행하세요. 즐거움뿐 아니라 어려웠던 부분도 기록하세요.",
      },
      {
        title: "다음 단계 결정하기",
        action:
          "지금 유지할 선택·추가 조사할 선택·지원할 선택을 구분하세요. 사주가 정한 이직일 대신 내 준비 상태와 실제 마감일을 사용하세요.",
      },
    ],
    questions: [
      "다음 직업에서 반드시 지켜야 할 생활 조건은 무엇인가요?",
      "내 강점을 보여 줄 수 있는 실제 업무 사례가 있나요?",
      "결정 전에 확인하지 못한 채용 조건이나 비용은 무엇인가요?",
    ],
    boundary:
      "직업 선택 기준과 경험을 정리하는 참고입니다. 사주로 적성 직업을 확정하거나 채용·합격·승진·이직의 성공 또는 유리한 날짜를 예측하지 않습니다.",
  },
  money: {
    introduction:
      "일간({master})과 비교한 확정 천간의 재성은 {focus}입니다. 이는 자원과 관리의 전통 분류이지 자산 규모가 아닙니다. 실제 소비 기록과 예산을 따로 확인해 나의 사용 기준을 정리하세요.",
    focusGods: ["편재", "정재"],
    plan: [
      {
        title: "기호와 금액 구분하기",
        action:
          "확정 천간의 재성 {focus}을 확인하세요. 이 값으로 재산을 추정하지 말고, 실제로 확인한 수입·고정 지출 항목을 적으세요.",
      },
      {
        title: "소비 한 번 기록하기",
        action:
          "오늘의 지출을 금액·용도·구매 이유로 기록하세요. 지출이 없다면 최근 지출 한 건을 영수증이나 내역으로 확인하세요.",
      },
      {
        title: "반복 지출 살피기",
        action:
          "정기 결제나 반복 지출 세 가지를 확인하세요. 계속 사용할 항목과 다음 결제 전에 검토할 항목을 나누세요.",
      },
      {
        title: "필요와 충동 구분하기",
        action:
          "원하는 구매 한 가지의 필요 이유와 서두르는 이유를 각각 적으세요. 지금 사지 않아도 되는지 하루 동안 관찰하세요.",
      },
      {
        title: "비교 가능한 가격 찾기",
        action:
          "구매를 검토 중인 물건이나 서비스 하나의 실제 가격·조건·추가 비용을 비교하세요. 수익률 전망을 사주에 연결하지 마세요.",
      },
      {
        title: "현실적인 한도 정하기",
        action:
          "확인된 예산 안에서 조정 가능한 지출 한 항목의 한도를 정하세요. 빚이나 투자 결정을 이 리포트만으로 내리지 마세요.",
      },
      {
        title: "소비 원칙 남기기",
        action:
          "일주일 기록에서 도움이 된 소비 기준 한 가지를 쓰세요. 다음 확인 날짜를 내 일정에 맞춰 정하고 실제 지출과 다시 비교하세요.",
      },
    ],
    questions: [
      "내가 돈을 쓰며 실제로 얻고 싶은 가치는 무엇인가요?",
      "지금 줄이거나 미뤄도 되는 지출을 확인한 근거는 무엇인가요?",
      "재성의 상징과 실제 금액을 구분해서 보고 있나요?",
    ],
    boundary:
      "소비와 자원 관리 습관을 돌아보는 참고입니다. 자산·부채 규모, 투자 수익·손실, 금융상품의 적합성이나 매매 시점을 판단하지 않으며 금융·투자 자문이 아닙니다.",
  },
  study: {
    introduction:
      "일간({master})을 기준으로 확정 천간의 배움·표현 주제는 {focus}입니다. 인성이나 식상이 보이는지는 성적이나 재능의 척도가 아닙니다. 같은 내용을 다른 방법으로 배우며 실제 학습 기록을 비교해 보세요.",
    focusGods: ["편인", "정인", "식신", "상관"],
    plan: [
      {
        title: "작은 학습 목표 고르기",
        action:
          "확정 천간 {focus}을 읽고 이번 주 이해하고 싶은 개념 하나를 정하세요. 일주일 안에 확인할 수 있는 질문으로 바꾸세요.",
      },
      {
        title: "처음 이해한 내용 적기",
        action:
          "자료를 20분 읽거나 듣고 기억나는 내용을 자료 없이 적으세요. 모르는 부분은 빈칸으로 두고 따로 표시하세요.",
      },
      {
        title: "다른 방식으로 배우기",
        action:
          "같은 개념을 그림·예시·짧은 설명 중 다른 방식으로 다시 정리하세요. 어느 방법에서 이해가 바뀌었는지 기록하세요.",
      },
      {
        title: "누군가에게 설명하기",
        action:
          "개념을 3분 설명하거나 글로 써보세요. 막힌 지점을 표시하고 자료를 다시 확인하세요. 식상의 유무로 표현 능력을 단정하지 마세요.",
      },
      {
        title: "피드백 하나 받기",
        action:
          "학습 내용을 아는 사람이나 검증된 자료와 내 설명을 비교하세요. 틀린 부분 한 가지와 고친 이유를 남기세요.",
      },
      {
        title: "간격 두고 기억 확인하기",
        action:
          "이전 기록을 보지 않고 처음 고른 질문에 답해 보세요. 기억한 부분과 다시 공부할 부분을 나누세요.",
      },
      {
        title: "나의 학습 조건 정리하기",
        action:
          "실제로 도움이 된 방법·시간·자료를 각각 하나씩 적으세요. 성적 예측 대신 다음 주 시도할 학습 행동 하나를 정하세요.",
      },
    ],
    questions: [
      "내가 배우고 싶은 내용을 확인 가능한 질문으로 만들 수 있나요?",
      "이해가 달라졌다는 것을 어떤 설명이나 과제로 확인했나요?",
      "성적과 상관없이 반복할 만한 학습 조건은 무엇인가요?",
    ],
    boundary:
      "학습 방법을 실험하고 기록하는 참고입니다. 지능·재능·성적·합격 여부를 판단하지 않으며 전공을 사주로 확정하거나 시험의 길일을 계산하지 않습니다.",
  },
  family: {
    introduction:
      "일간({master})에 대한 확정 천간 {focus}에서 돌봄·협력·역할의 전통적 주제를 읽습니다. 가족의 원국은 입력하지 않았습니다. 내 역할과 실제 대화를 돌아보되 다른 사람의 성격을 이 결과로 정하지 마세요.",
    focusGods: ["비견", "겁재", "편인", "정인", "편관", "정관"],
    plan: [
      {
        title: "현재 역할 적기",
        action:
          "확정 천간 {focus}을 확인하고 가족 안에서 내가 맡는 실제 역할 세 가지를 적으세요. 십성을 가족 구성원의 성격으로 바꾸지 마세요.",
      },
      {
        title: "기대와 현실 나누기",
        action:
          "역할 하나에 대해 다른 사람이 기대하는 일과 내가 할 수 있는 일을 나누어 적으세요. 확인하지 않은 기대는 추측으로 표시하세요.",
      },
      {
        title: "돌봄의 시간 확인하기",
        action:
          "돌봄·연락·가사에 드는 시간을 하루 기록하세요. 누구의 성격 탓으로 정리하지 않고 필요한 일을 기준으로 적으세요.",
      },
      {
        title: "내 경계 문장 준비하기",
        action:
          "부담되는 요청 하나에 대해 가능한 범위와 어려운 범위를 차분히 말하는 문장을 만드세요. 가족이라는 이유로 모든 역할을 맡을 필요는 없습니다.",
      },
      {
        title: "한 가지 역할 의논하기",
        action:
          "대화가 가능한 상황이라면 작은 역할 하나의 분담을 제안하세요. 즉시 합의되지 않아도 상대의 답을 실제 말로 기록하세요.",
      },
      {
        title: "대화 이후 점검하기",
        action:
          "제안 이후 달라진 행동과 아직 필요한 도움을 구분하세요. 대화가 안전하지 않다면 억지로 진행하지 말고 믿을 만한 지원 경로를 찾으세요.",
      },
      {
        title: "지속 가능한 역할 정하기",
        action:
          "앞으로 맡을 역할 하나와 조정이 필요한 역할 하나를 정하세요. 서로의 생일이나 운명 대신 생활 조건과 합의를 근거로 남기세요.",
      },
    ],
    questions: [
      "가족 안에서 내가 맡은 역할 중 스스로 선택한 것은 무엇인가요?",
      "서로 확인하지 않은 기대 때문에 부담이 커진 부분은 없나요?",
      "내가 할 수 있는 범위와 필요한 도움을 어떻게 말하고 싶나요?",
    ],
    boundary:
      "나의 관점에서 가족 내 역할과 대화를 정리하는 참고입니다. 가족 간 궁합, 부모·자녀·배우자의 성격·운명, 갈등의 원인을 다른 사람의 사주로 판단하지 않습니다.",
  },
  change: {
    introduction:
      "일간({master})과 연간지({annual})의 전통적 상징을 함께 읽습니다. 올해 연간 천간의 관계는 {annualGod}이지만 선택의 성공을 뜻하지 않습니다. 바꿀 수 있는 조건과 확인할 정보를 나누어 다음 행동을 고르세요.",
    focusGods: [],
    plan: [
      {
        title: "지금의 선택 정의하기",
        action:
          "일간({master})과 연간지({annual})를 참고한 뒤 고민을 ‘무엇을 바꿀지’ 한 문장으로 적으세요. 결정 기한이 실제로 있는지 확인하세요.",
      },
      {
        title: "선택지 세 개 만들기",
        action:
          "바꾸기·유지하기·작게 시험하기를 포함해 선택지를 적으세요. 한 가지 선택만 가능하다고 느끼는 이유도 확인하세요.",
      },
      {
        title: "변하지 않는 조건 적기",
        action:
          "각 선택의 시간·비용·책임을 적고 반드시 지켜야 할 조건을 표시하세요. 연간지로 길흉 점수를 매기지 마세요.",
      },
      {
        title: "모르는 정보 찾기",
        action:
          "결정에 중요하지만 확인하지 않은 정보 두 가지를 고르세요. 누구에게 또는 어떤 공식 자료에서 확인할지 정하세요.",
      },
      {
        title: "되돌릴 수 있는 실험하기",
        action:
          "가능하다면 부담이 작고 되돌릴 수 있는 행동 하나를 해보세요. 결과가 선택에 어떤 새 정보를 주었는지 적으세요.",
      },
      {
        title: "다른 관점 받아보기",
        action:
          "내 상황을 아는 사람에게 선택 조건과 빠뜨린 점을 물어보세요. 사주의 해석과 다른 의견도 비교 자료로 남기세요.",
      },
      {
        title: "선택과 재검토 기준 남기기",
        action:
          "지금 고를 행동과 결정을 다시 볼 조건을 적으세요. 결혼·개업·이사 등의 길일이나 성공 보장을 이 리포트에서 찾지 마세요.",
      },
    ],
    questions: [
      "지금 선택에서 되돌릴 수 있는 부분과 되돌리기 어려운 부분은 무엇인가요?",
      "결정에 필요한 정보 중 실제로 확인한 것과 추측한 것은 무엇인가요?",
      "어떤 조건이 달라지면 내 결정을 다시 검토할 건가요?",
    ],
    boundary:
      "선택 조건을 정리하는 개인 참고입니다. 길일·방위·이사·결혼·개업 시기, 특정 선택의 성공률이나 미래 사건을 계산하지 않으며 대운의 변화를 판단하지 않습니다.",
  },
  balance: {
    introduction:
      "일간({master})과 확정된 {elementTotal}글자의 기본 오행 {elements}, 음양 {polarity}를 확인합니다. 이 숫자는 몸이나 마음의 상태를 진단하는 수치가 아닙니다. 실제 생활 기록을 통해 편안했던 조건을 살펴보세요.",
    focusGods: [],
    plan: [
      {
        title: "분포와 상태 구분하기",
        action:
          "기본 오행 {elements}와 음양 {polarity}를 확인하세요. 많은 글자를 과잉, 적은 글자를 건강의 결핍으로 읽지 않고 오늘의 생활을 별도로 기록하세요.",
      },
      {
        title: "하루 일정 관찰하기",
        action:
          "일·이동·휴식에 쓴 시간을 대략 적으세요. 계획과 실제 일정이 달랐던 곳을 하나 표시하세요.",
      },
      {
        title: "편안했던 조건 찾기",
        action:
          "최근 편안했던 순간 한 가지의 시간·장소·활동을 적으세요. 오행에 특정 색이나 음식의 치료 효과를 연결하지 마세요.",
      },
      {
        title: "생활 변수 하나 바꾸기",
        action:
          "정리 시간 10분 확보하기처럼 부담이 작은 생활 행동 하나를 바꿔보세요. 몸과 마음에 대한 효과를 단정하지 않고 실제 느낌만 기록하세요.",
      },
      {
        title: "필요한 도움 확인하기",
        action:
          "생활에서 혼자 해결하기 어려운 일 한 가지와 요청할 수 있는 도움을 적으세요. 건강·심리 문제가 있다면 이 리포트 대신 적절한 전문 지원을 활용하세요.",
      },
      {
        title: "기록끼리 비교하기",
        action:
          "일주일 중 편안했던 날과 부담스러웠던 날의 일정 차이를 비교하세요. 한 번의 경험을 체질이나 성격의 확정값으로 만들지 마세요.",
      },
      {
        title: "지속할 작은 습관 정하기",
        action:
          "부담 없이 이어갈 생활 행동 하나를 정하세요. 결과를 의학적 개선이나 명리적 균형의 증명으로 해석하지 마세요.",
      },
    ],
    questions: [
      "실제 생활에서 편안했던 순간에는 어떤 조건이 있었나요?",
      "내가 바꿀 수 있는 일정과 다른 사람의 도움이 필요한 일은 무엇인가요?",
      "오행·음양 숫자와 실제 몸·마음의 상태를 구분해서 보고 있나요?",
    ],
    boundary:
      "일상 기록을 돕는 전통 명리 참고입니다. 오행·음양으로 건강·체질·질병·정신 상태를 판단하거나 의학적·심리학적 진단·치료·생활 처방을 제공하지 않습니다.",
  },
};

const elementOrder: readonly SajuElement[] = ["목", "화", "토", "금", "수"];

export function createTopicGuide(
  result: SajuResult,
  topic: string,
): TopicGuide {
  const product = findProduct(topic);
  const definition = topics[product.id];
  const master = `${result.dayMaster.korean}(${result.dayMaster.chinese}) · ${result.dayMaster.yinYang}${result.dayMaster.element}`;
  const confirmed = result.pillars.filter(
    (pillar) => pillar.key !== "day" && !pillar.uncertain,
  );
  const relevant = definition.focusGods.length
    ? confirmed.filter((pillar) => definition.focusGods.includes(pillar.tenGod))
    : confirmed;
  const describeRelations = (values: typeof confirmed) =>
    values.length
      ? values
          .map(
            (pillar) =>
              `${pillar.label} ${pillar.stem.korean}(${pillar.stem.chinese}) ${pillar.tenGod}`,
          )
          .join(" / ")
      : "표시 없음";
  const elements = elementOrder
    .map((element) => `${element} ${result.elements[element]}개`)
    .join(" · ");
  const annual = `${result.annual.year}년 연주 ${result.annual.pillar.korean}(${result.annual.pillar.chinese})`;
  const values: Record<string, string> = {
    master,
    elements,
    relations: `‘${describeRelations(confirmed)}’`,
    focus: `‘${describeRelations(relevant)}’`,
    annual,
    annualGod: result.annual.pillar.tenGod,
    annualStart: result.annual.startsAt,
    elementTotal: String(result.elementTotal),
    polarity: `양 ${result.yinYang.yang}개 · 음 ${result.yinYang.yin}개`,
  };
  const render = (template: string) =>
    template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
  const uncertainty = [...result.warnings];
  const unresolved = result.pillars.filter((pillar) => pillar.uncertain);
  if (unresolved.length)
    uncertainty.push(
      `미확정 ${unresolved.map((pillar) => pillar.label).join("·")}의 참고값은 이 주제의 십성 근거와 오행·음양 집계에 사용하지 않았습니다.`,
    );
  const evidence = [
    {
      label: "일간의 계산값",
      text: `${master}. 모든 천간 십성은 이 일간과의 오행·음양 관계를 비교한 값입니다.`,
    },
    {
      label: definition.focusGods.length
        ? "이 주제에 연결한 확정 천간"
        : "확정 천간의 관계",
      text: `${describeRelations(relevant)}. ${definition.focusGods.length ? "해당 십성이 표시되지 않아도 관련 경험이나 능력이 없다는 뜻은 아닙니다. " : ""}미확정 천간과 지지의 지장간 십성은 포함하지 않았습니다.`,
    },
    {
      label: "기본 오행·음양의 계산값",
      text: `확정된 ${result.elementTotal}글자: ${elements}. ${values.polarity}. 지장간·계절 가중치를 넣지 않은 개수이며 강약이나 용신의 판단이 아닙니다.`,
    },
  ];
  if (product.id === "year" || product.id === "change")
    evidence.push({
      label: "입춘 기준 연간지",
      text: `${annual} · 천간 십성 ${result.annual.pillar.tenGod}. 시작 ${result.annual.startsAt}; 다음 해 입춘 전까지의 연간지입니다. 월별 변화나 대운은 계산하지 않았습니다.`,
    });
  return {
    productId: product.id,
    title: product.title,
    summary: render(definition.introduction),
    evidence,
    plan: definition.plan.map((step, index) => {
      let action = render(step.action);
      if (product.id === "life" && index === 3 && !confirmed.length)
        action =
          "입력 정보의 불확실성 때문에 비교할 다른 천간의 십성을 확정할 수 없습니다. 이 항목을 추정하지 않고, 최근 실제로 맡은 역할 세 가지와 각 역할에서 한 행동을 기록하세요.";
      if (product.id === "money" && index === 0 && !relevant.length)
        action =
          "이 계산 범위의 확정 천간에는 재성이 표시되지 않습니다. 이는 재산이나 자원 관리 능력이 없다는 뜻이 아닙니다. 사주로 금액을 추정하지 않고 실제로 확인한 수입·고정 지출 항목을 적으세요.";
      return { day: index + 1, title: step.title, action };
    }),
    questions: [...definition.questions],
    boundary: definition.boundary,
    uncertainty,
  };
}
