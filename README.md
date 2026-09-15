# SchoolCheck

> **Attendly - 스마트 학교 출결 관리 시스템**  
> 교사가 학생 출결을 간편하게 관리하고, 출결 현황·통계와 사유서까지 한곳에서 관리하는 학교 출결 관리 서비스입니다.

---

## 1. 프로젝트 소개

교사와 학생이 학교 출결 정보를 간편하게 기록하고 조회할 수 있는 웹 기반 출결 관리 서비스입니다.

* **교사**: 학급 관리, 학생 관리, 출결 입력, 출결 수정, 사유서 승인 및 반려
* **학생**: 본인 출결 조회, 지각·결석·조퇴 사유서 제출 및 처리 현황 확인
* **공통**: 출결 현황 분석 및 기간별 통계 조회

---

## 2. 기술 스택

### Frontend / Full-stack
* **Framework**: Next.js (App Router)
* **Library**: React 18, TypeScript
* **Styling**: CSS Modules / Tailwind CSS

### Backend & Database
* **API Handler**: Next.js Route Handlers
* **Authentication**: JWT 기반 인증 (Cookie / Bearer Token)
* **Database**: MongoDB (Mongoose ODM)

---

## 3. 핵심 기능

* **사용자 인증 및 권한 구분**: 교사(ADMIN)와 학생(USER) 역할(Role)에 따른 접근 제한
* **학급 및 학생 관리**: 학년/반 단위 데이터 등록 및 학생 목록 관리
* **날짜·교시별 출결 체크**: 출석, 지각, 결석, 조퇴 상태 실시간 기록 및 수정
* **출결 현황 및 통계 조회**: 일간/월간/학기별 출결 데이터 시각화 및 리포트
* **사유서 제출 및 승인**: 학생의 결석/지각 사유서 제출 및 교사의 승인/반려 기능

---

## 4. Database Schema (MongoDB)

### User
```ts
{
  _id: ObjectId,
  email: string,
  passwordHash: string,
  name: string,
  role: 'TEACHER' | 'STUDENT',
  grade?: number,
  classNum?: number,
  studentNum?: number
}