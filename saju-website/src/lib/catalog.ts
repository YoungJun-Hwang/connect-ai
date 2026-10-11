export type SajuProduct = {
  id: string;
  category: string;
  title: string;
  english: string;
  description: string;
  badge: string;
  caption: string;
  priceKrw: number;
  icon: string;
  includes: readonly string[];
  sampleNote: string;
};

export const categories: readonly string[] = [
  "전체 리포트",
  "나의 사주",
  "연애 · 관계",
  "올해의 흐름",
  "일 · 재물",
  "학업 · 성장",
  "선택 · 생활",
];

export const products: readonly SajuProduct[] = [
  {
    id: "life",
    category: "나의 사주",
    title: "인생 사주",
    english: "YOUR OWN STORY",
    description:
      "원국과 일간을 차근차근 읽어요.\n생활 속 나의 기준을 돌아보는 시간.",
    badge: "처음이라면 추천",
    caption: "나를 이해하는 시작",
    priceKrw: 12900,
    icon: "moon",
    includes: [
      "원국·일간·오행 읽기",
      "생활 기준 7일 기록",
      "나를 돌아보는 질문 3개",
    ],
    sampleNote:
      "계산된 원국의 기본 구성과 생활 경험을 함께 살펴보는 개인 참고 리포트예요.",
  },
  {
    id: "love",
    category: "연애 · 관계",
    title: "연애와 관계",
    english: "LOVE & CONNECTION",
    description:
      "십성의 관계 주제를 살펴봐요.\n내 표현과 경계를 돌아보는 작은 힌트.",
    badge: "",
    caption: "관계 속 나의 표현",
    priceKrw: 9900,
    icon: "heart",
    includes: [
      "내 천간의 관계 주제",
      "대화와 경계 7일 연습",
      "관계 자기점검 질문 3개",
    ],
    sampleNote:
      "나의 원국을 기준으로 관계 습관을 살펴봐요. 상대 원국을 비교하는 궁합은 포함하지 않아요.",
  },
  {
    id: "year",
    category: "올해의 흐름",
    title: "올해의 흐름",
    english: "A YEAR TO REFLECT",
    description:
      "올해의 연주와 일간을 비교해요.\n한 해의 목표를 작게 정리하는 시간.",
    badge: "",
    caption: "한 해의 계획을 위한 참고",
    priceKrw: 9900,
    icon: "sun",
    includes: [
      "입춘 기준 연간지·십성",
      "올해 목표 7일 정리",
      "계획 자기점검 질문 3개",
    ],
    sampleNote:
      "연간지의 전통적 상징과 목표 정리를 연결해요. 월운·대운과 사건의 시기는 계산하지 않아요.",
  },
  {
    id: "work",
    category: "일 · 재물",
    title: "일과 재물",
    english: "WORK & RESOURCES",
    description:
      "일과 자원의 관계를 살펴봐요.\n업무와 생활 관리의 균형을 돌아봐요.",
    badge: "",
    caption: "역할과 자원을 함께 보기",
    priceKrw: 12900,
    icon: "sprout",
    includes: [
      "업무·자원 관련 십성 읽기",
      "시간과 비용 7일 기록",
      "일과 생활 질문 3개",
    ],
    sampleNote:
      "계산된 십성에 업무와 자원 관리의 질문을 연결해요. 수입이나 사업 성과를 예측하지 않아요.",
  },
  {
    id: "career",
    category: "일 · 재물",
    title: "직업과 이직",
    english: "YOUR NEXT ROLE",
    description:
      "일의 역할을 다른 관점으로 읽어요.\n경험을 근거로 다음 선택을 정리해요.",
    badge: "",
    caption: "다음 역할을 고르는 기준",
    priceKrw: 9900,
    icon: "briefcase",
    includes: [
      "역할·표현·학습 관련 십성",
      "이직 기준 7일 정리",
      "직업 선택 질문 3개",
    ],
    sampleNote:
      "업무 경험과 선택 조건을 정리하는 개인 참고예요. 적합 직업이나 합격 시기를 단정하지 않아요.",
  },
  {
    id: "money",
    category: "일 · 재물",
    title: "재물과 소비",
    english: "MONEY & EVERYDAY CHOICES",
    description:
      "재성의 뜻과 실제 소비를 비교해요.\n나의 자원 관리 습관을 살펴봐요.",
    badge: "",
    caption: "소비와 자원 관리 돌아보기",
    priceKrw: 9900,
    icon: "wallet",
    includes: [
      "재성의 계산 근거와 범위",
      "소비 기록 7일 계획",
      "자원 관리 질문 3개",
    ],
    sampleNote:
      "보이는 천간의 재성은 전통 분류예요. 자산 규모나 투자 수익을 뜻하지 않아요.",
  },
  {
    id: "study",
    category: "학업 · 성장",
    title: "학업과 성장",
    english: "LEARN AT YOUR OWN PACE",
    description:
      "배움과 표현의 주제를 읽어요.\n작은 학습 실험으로 나의 방식을 찾아요.",
    badge: "",
    caption: "배우는 방식을 알아가는 시간",
    priceKrw: 6900,
    icon: "book",
    includes: [
      "인성·식상 관련 십성 읽기",
      "학습 방식 7일 실험",
      "성장 자기점검 질문 3개",
    ],
    sampleNote:
      "학습 기록을 통해 나의 방식을 점검해요. 성적·합격·재능을 사주로 판단하지 않아요.",
  },
  {
    id: "family",
    category: "연애 · 관계",
    title: "가족과 관계",
    english: "ROOM FOR EACH OTHER",
    description:
      "돌봄과 역할의 주제를 살펴봐요.\n가족 안에서 필요한 대화를 정리해요.",
    badge: "",
    caption: "돌봄과 역할의 경계 세우기",
    priceKrw: 9900,
    icon: "users",
    includes: [
      "내 원국의 관계 주제",
      "가족 대화 7일 준비",
      "역할 자기점검 질문 3개",
    ],
    sampleNote:
      "나의 관점에서 가족 내 역할을 돌아봐요. 다른 가족의 성격이나 관계의 운명을 판단하지 않아요.",
  },
  {
    id: "change",
    category: "선택 · 생활",
    title: "전환기의 선택",
    english: "CHOICES AT A CROSSROADS",
    description:
      "원국과 올해의 상징을 함께 읽어요.\n불확실한 선택의 조건을 정리해요.",
    badge: "",
    caption: "선택 앞에서 기준 만들기",
    priceKrw: 9900,
    icon: "compass",
    includes: [
      "원국·연간지의 참고 주제",
      "선택 비교 7일 계획",
      "전환기 자기점검 질문 3개",
    ],
    sampleNote:
      "선택의 이유와 확인할 정보를 정리해요. 이동·개업·결혼 등의 길일은 계산하지 않아요.",
  },
  {
    id: "balance",
    category: "선택 · 생활",
    title: "마음과 생활 리듬",
    english: "A RHYTHM FOR EVERYDAY LIFE",
    description:
      "오행과 음양의 구성을 살펴봐요.\n생활 기록으로 나의 리듬을 돌아봐요.",
    badge: "",
    caption: "생활 리듬을 관찰하는 일주일",
    priceKrw: 6900,
    icon: "leaf",
    includes: [
      "기본 오행·음양 분포",
      "생활 리듬 7일 관찰",
      "생활 자기점검 질문 3개",
    ],
    sampleNote:
      "기본 분포와 일상의 기록을 함께 살펴보는 참고예요. 의학적·심리학적 진단은 제공하지 않아요.",
  },
];

export function findProduct(value: string): SajuProduct {
  return (
    products.find(
      (product) => product.id === value || product.title === value,
    ) ?? products[0]
  );
}

export function formatKrw(price: number): string {
  return `${new Intl.NumberFormat("ko-KR").format(price)}원`;
}
