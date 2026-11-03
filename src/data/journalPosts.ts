import { JournalPost } from '../types';
import aiNews from './ai-news.json';

/** 주간 AI 뉴스: ai-news.json에 매주 한 편씩 추가된다 (최신이 맨 앞) */
export const AI_NEWS_POSTS = aiNews as JournalPost[];

const EDITORIAL_POSTS: JournalPost[] = [
  {
    id: 'post-2027-seven-trends',
    title: '2027년 7대 디자인 트렌드 분석',
    summary:
      '핸드메이드·아날로그, 큐트모피즘, 과정 공개, 진짜 질감, 초현실주의, 개성 타이포, 일부러 투박한 디자인까지. 유튜브 영상을 정리하고 예시를 확인했어요.',
    category: '트렌드',
    tags: ['2027', '트렌드', '마스코트', '타이포', '질감'],
    author: '박정은',
    date: '2026-11-03',
    body: `Grayson's Graphics의 영상 「The Top 7 Design Trends of 2027」(2026.10.15)을 보고 정리했어요. 영상의 큰 흐름은 '미니멀리즘과 플랫 디자인에서 벗어나, AI 시대에 사람의 개성과 손맛이 다시 중요해진다'예요.

## 1. 핸드메이드 & 아날로그 디자인
플랫 디자인의 종말과 물리적 매체의 귀환.
디지털 화면 속 완벽한 픽셀에서 벗어나, 손으로 직접 만진 듯한 거친 질감과 물성을 적극적으로 섞는 흐름이에요. 차가운 컴퓨터 그래픽에 대한 반작용으로, 공예품이나 아날로그 느낌을 디자인 전면에 내세워요.

## 2. 큐트모피즘 & 마스코트 브랜딩
AI 시대, 사람의 신뢰를 얻는 극강의 귀여움.
차갑고 기능적인 기술을 내세우던 AI 회사들이 오히려 친근함으로 다가가려고 고른 전략이에요. OpenAI의 에이전트 Dots(9월 29일 공개)는 베레모·나비넥타이·안경을 쓰는 알록달록한 캐릭터를, Meta는 AI 에이전트 Muse의 마스코트로 복슬복슬한 Jolly(9월 24일 Connect 공개)를 내세웠어요. 단순하고 둥글둥글한데, 너무 귀여워서 섬뜩하다(creepy)는 반응까지 나올 정도예요.

## 3. 과정과 불완전함 공유
결과물보다 매력적인 '만드는 과정'의 공개.
누구나 AI로 완벽한 결과물을 순식간에 만드는 시대가 되자, 오히려 '어떻게 만들었는지'에 대한 궁금증이 커졌어요. Figma 블로그의 Source Material 시리즈처럼 수정 흔적, 스케치, 실패와 고민의 과정을 그대로 보여주면 브랜드에 사람 냄새와 진정성이 생겨요.

## 4. 실제 현장의 질감
스톡 이미지가 아닌, 날것 그대로의 진짜 질감.
인터넷에서 받은 매끈한 텍스처 대신, 주변 사물이나 자연을 직접 스캔하거나 찍은 '진짜' 질감을 써요. 영상에서는 곰팡이나 UFO 문서처럼 주제와 관련 있는 현실의 거친 물성을 그대로 가져와 깊이와 이야기를 만든 예를 들어요.

## 5. 초현실주의
현실과 비현실을 넘나드는 유쾌하고 엉뚱한 세계관.
브랜드 개성을 극대화하려고 꿈속처럼 기묘한 장면을 연출해요. 아마존 뷰티의 프라임데이 광고(2026년 6월)는 거대한 샬롯틸버리 립스틱이 도시 거리를 빨갛게 칠하며 지나가는 CGI 영상(FOOH, 가짜 옥외광고)으로 시선을 끌었어요.

## 6. 개성 있는 타이포그래피
획일적인 산세리프를 거부하는 커스텀 레터링.
오래 웹을 지배한 깔끔한 산세리프에서 벗어나, 디자이너의 개성이 묻어나는 커스텀 타이포가 주목받아요. 손글씨, 핫소스나 진흙 같은 재료로 쓴 글씨, 직접 만든 전용 폰트로 글자 자체가 강한 비주얼 메시지가 돼요.

## 7. '멍청한' 디자인 / 투박한 디자인
완벽한 AI 디자인 속에서 빛나는 B급 감성.
AI가 만드는 너무 완벽하고 매끈한 이미지들 사이에서, 일부러 옛날 클립아트나 코믹 산스, 투박한 레이아웃을 가져온 B급 감성이 오히려 눈에 띄어요. 황금비율보다 디자이너의 대담한 취향과 유머가 더 중요해졌다는 신호예요.

## 우리 작업에 써본다면
- 상세페이지·카드뉴스: 직접 찍은 강의실·교재·필기 질감을 배경으로 쓰면 스톡 느낌을 줄일 수 있어요
- 과정 홍보: 수업 준비나 시안 과정을 보여주는 '메이킹' 카드뉴스로 진정성 살리기
- 타이틀: 과정명은 손글씨·레터링으로, 본문은 읽기 쉬운 서체로 나눠 쓰기
- 마스코트·B급 감성은 교육 브랜드 신뢰감과 부딪힐 수 있어서, 이벤트·SNS용으로 먼저 시험해 보기

## 확인 메모
- 7가지 트렌드 이름과 순서는 영상 설명란(핸드메이드·아날로그, 귀여운 마스코트, 과정 중심, 진짜 질감, 초현실주의, 커스텀 타이포, 일부러 못난 디자인)과 일치해요.
- '메타의 뮤즈'는 바로잡았어요: Muse는 Meta의 AI 에이전트 이름이고, 마스코트 이름은 Jolly예요. '챗GPT의 닷'도 정확히는 OpenAI의 에이전트 Dots와 그 캐릭터들이에요.
- 아마존 립스틱 광고는 실제 설치물이 아니라 CGI 영상이에요.
- 곰팡이·UFO 문서, 핫소스·진흙 레터링, 클립아트·코믹 산스 예시는 영상 자막을 확인하지 못해 따로 검증하지 못했어요.
- '큐트모피즘'은 영상 설명란에는 없는 표현이라, 영상 속 용어인지는 확인하지 못했어요.`,
    sources: [
      { title: "YouTube · Grayson's Graphics, The Top 7 Design Trends of 2027", url: 'https://www.youtube.com/watch?v=6m7Y5SKXhks' },
      { title: 'Fortune · Meta·OpenAI의 AI 에이전트 마스코트 Jolly, Dots (2026.10.02)', url: 'https://fortune.com/2026/10/02/meta-openai-ai-agent-mascots-jolly-dots-trust/' },
      { title: 'FOOH · Amazon Beauty Giant Lipsticks Leave Trail Across City', url: 'https://fooh.com/library/5214-amazon-beauty-giant-lipsticks-leave-trail-across-city-fooh-ad' },
      { title: 'Figma Blog · Source Material 시리즈', url: 'https://www.figma.com/blog/source-material-ben-ganz/' },
    ],
    relatedProjects: [],
    likes: [],
    comments: [],
  },
  {
    id: 'post-2027-trends',
    title: '2027 디자인 트렌드 미리 보기',
    summary:
      'WGSN·Coloro가 꼽은 올해의 색 Luminous Blue와, 내년 비주얼 키워드 12가지를 우리 작업(상세페이지·배너·카드뉴스) 기준으로 정리했어요.',
    category: '트렌드',
    tags: ['2027', '컬러', '타이포', '레이아웃'],
    author: '박정은',
    date: '2026-11-03',
    palette: [
      { name: 'Luminous Blue', hex: '#2446B8', code: 'Coloro 125-28-38' },
      { name: 'Energy Orange', hex: '#E8742C', code: 'Coloro 018-57-34' },
      { name: 'Pop Pink', hex: '#F2A3C6', code: 'Coloro 151-73-22' },
      { name: 'Meadowland Green', hex: '#9BB06A', code: 'Coloro 050-61-19' },
      { name: 'Clay', hex: '#BC8F78', code: 'Coloro 014-60-13' },
    ],
    body: `## 올해의 색: Luminous Blue
WGSN과 Coloro가 2027 올해의 색으로 Luminous Blue(Coloro 125-28-38)를 발표했어요. 신비롭고 개성 있는 느낌의 짙고 선명한 파랑이라, 행사·스포츠·일상 어디에나 어울린다는 설명이에요.
함께 발표한 S/S 27 핵심 컬러는 Energy Orange, Pop Pink, Meadowland Green, Clay예요. 위 팔레트의 HEX는 화면용 근사색이라, 정확한 값은 Coloro 코드로 확인해 주세요.

## 2027 비주얼 키워드 12
- 의도된 불완전함: 손맛이 남은 로파이, 핸드메이드 느낌
- 만지고 싶은 질감: 말랑하고 폭신한 3D 표면
- 감정을 담은 과장된 타이포그래피
- 다시 돌아온 선명한 색 (Luminous Blue 중심)
- 차분한 뉴트럴 + 넉넉한 여백
- 콜라주·몽타주·레이어 겹치기
- 왜곡·글리치·낯섦
- 요즘식 레트로 퓨처리즘, 80년대 감성
- 진(zine)·뉴스레터 같은 편집 레이아웃
- 꾸미지 않은 실제 사람과 생활 사진
- 구경거리가 아닌 '일상의 도우미'로서의 AI 표현
- 여러 매체에 맞춰 바뀌는 모듈형 브랜드 시스템

## 우리 작업에 써본다면
- 상세페이지: 큰 키 비주얼 대신 선명한 Luminous Blue 면 + 과장된 타이틀 타이포로 첫 화면 만들기
- 배너·팝업: 오렌지·핑크를 포인트로, 배경은 뉴트럴로 눌러서 정보는 차분하게
- 카드뉴스: 진·뉴스레터처럼 글이 많은 편집 레이아웃, 실제 수강생·강사 사진 활용
- 공통: 모듈형으로 만들어 두면 PC·MO·배너 사이즈를 바꿀 때 손이 덜 가요

의견이나 참고 레퍼런스가 있으면 댓글로 남겨 주세요.`,
    sources: [
      {
        title: 'WGSN · Colour of the Year 2027, Luminous Blue and S/S 27 Key Colours',
        url: 'https://www.wgsn.com/en/wgsn/press/press-releases/wgsn-and-coloro-reveal-colour-year-2027-luminous-blue-and-s-s-27-key',
      },
      {
        title: 'Lovart · 2027 Design Trend Predictions',
        url: 'https://www.lovart.ai/ko/blog/design-trends-2027',
      },
    ],
    relatedProjects: [],
    likes: ['김다은', '이혜진'],
    comments: [
      {
        id: 'c1',
        author: '김다은',
        text: '내년 1분기 상세페이지 리뉴얼 때 Luminous Blue 메인으로 시안 하나 잡아볼게요!',
        date: '2026-11-03',
      },
    ],
  },
  {
    id: 'post-naming',
    title: '[공지] 11월부터 새 폴더·파일 네이밍 규칙 적용',
    summary: '날짜_요청번호_프로젝트명_리소스_디자이너 규칙으로 통일해요. 등록할 때 자동 분류가 훨씬 정확해져요.',
    category: '공지',
    tags: ['네이밍', 'NAS'],
    author: '박정은',
    date: '2026-10-30',
    body: `## 폴더명
260120_15832_색채학 과정_산돌-AI_김다은

## 파일명
15832_상세_PC_v01.png

메뉴 > 네이밍 규칙에서 이름 만들기와 이름 검사를 쓸 수 있어요.`,
    likes: [],
    comments: [],
  },
];

export const INITIAL_POSTS: JournalPost[] = [...AI_NEWS_POSTS, ...EDITORIAL_POSTS];
