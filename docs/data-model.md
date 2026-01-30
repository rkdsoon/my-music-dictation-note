 # 데이터 모델 (MVP 초안)
 
 ---
 
 ## 1) 개념 구조
 
 - Document
 - Line
 - Token (단어 또는 음절)
 - Symbol
 
 ---
 
 ## 2) 타입 정의 (의사 코드)
 
 ```
 Document {
   id: string
   title: string
   lines: Line[]
   symbols: Symbol[]
   createdAt: string (ISO)
   updatedAt: string (ISO)
 }
 
 Line {
   lineId: string
   rawText: string
   tokens: Token[]
 }
 
 Token {
   tokenId: string
   text: string
   startIndex: number
   endIndex: number
 }
 
 Symbol {
   symbolId: string
   type: "basic"
   key: string
   position: {
     lineIndex: number
     tokenIndex: number
     offsetX: number
     offsetY: number
   }
   style: {
     color: string
     size: number
   }
 }
 ```
 
 ---
 
 ## 3) 기본 청음 기호 세트 (기본 제공)
 
 - key: "breath-required", label: "✧"
 - key: "breath-optional", label: "○"
 - key: "accent", label: "★"
 - key: "accent-strong", label: "‼"
 - key: "pitch-up", label: "↑"
 - key: "pitch-down", label: "↓"
 - key: "pitch-up-strong", label: "↑↑"
 - key: "pitch-down-strong", label: "↓↓"
 - key: "sustain", label: "~~~"
 - key: "vibrato", label: "🌀"
 - key: "soft", label: "•"
 - key: "legato", label: "→"
 
 ---
 
 ## 4) 저장 포맷 (MVP)
 
 - 로컬스토리지 키: "cheongeum-documents"
 - 저장 단위: Document 배열
 - 최신 문서 id를 별도 키로 저장 (예: "cheongeum-last-opened")
 
 ---
 
 ## 5) 파싱 규칙 (가사 -> Line/Token)
 
 - 줄바꿈 기준으로 Line 분리
 - 기본 단위는 공백 기준 토큰화
 - 옵션: 음절 단위 토큰화는 MVP 범위에서 제외
 
 ---
 
 ## 6) 렌더링 좌표 기준
 
 - lineIndex 기준으로 오선지 세로 위치 계산
 - tokenIndex 기준으로 가사 단어의 X 좌표 계산
 - offsetX / offsetY는 사용자 드롭 위치 미세 조정
