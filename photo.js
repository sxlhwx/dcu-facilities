/**
 * photo.js: 시설별 사진 업데이트 날짜, 원본 출처, 메모 및 매칭 파일 관리
 */
const PHOTO_UPDATES = {
  "gym_prog": [
    { 
      file: "gym_prog_1.jpg", // 이 데이터에 대응하는 파일명
      date: "2026.03.08", 
      url: "https://dcugym.cu.ac.kr/sub02/sub01.htm",
      memo: "휴무에 방학 포함되어 있는데 방학 중 운영시간도 있음. 확인요망" 
    },
    {
    file: "gym_prog_2.jpg",
    date: "2026.03.09",
    url: "https://www.cu.ac.kr/plaza/notice/notice?mode=view&mv_data=aWR4PTE4MzczMSZzdGFydFBhZ2U9MSZsaXN0Tm89MSZ0YWJsZT1jc19iYnNfZGF0YSZjb2RlPW5vdGljZSZzZWFyY2hfaXRlbT1zdWJqZWN0JnNlYXJjaF9vcmRlcj3ssrTroKUmb3JkZXJfbGlzdD0mbGlzdF9zY2FsZT0=%7C%7C",
    memo: "이상없음"
    }
    
  ],
  "gym_3f": [
    { 
      file: "gym_3f_1.jpg", 
      date: "2026.03.08", 
      url: "https://www.cu.ac.kr/plaza/notice/notice?mode=view&mv_data=aWR4PTE4MzczMSZzdGFydFBhZ2U9MSZsaXN0Tm89MSZ0YWJsZT1jc19iYnNfZGF0YSZjb2RlPW5vdGljZSZzZWFyY2hfaXRlbT1zdWJqZWN0JnNlYXJjaF9vcmRlcj3ssrTroKUmb3JkZXJfbGlzdD0mbGlzdF9zY2FsZT0=%7C%7C",
      memo: "이상없음" 
    },
    { 
      file: "gym_3f_2.jpg", // 두 번째 사진 파일명 명시
      date: "2026.03.10", 
      url: "https://dcugym.cu.ac.kr/sub02/sub01.htm",
      memo: "이상없음" 
    }
  ]
};