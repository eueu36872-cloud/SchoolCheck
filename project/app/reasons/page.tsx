"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Student = {
  id: number;
  number: number;
  name: string;
  email?: string;
  grade: number;
  classNumber: number;
};

type ClassInfo = {
  grade: number;
  classNumber: number;
};

type ReasonStatus =
  | "대기"
  | "승인"
  | "반려";

type Reason = {
  id: number;
  studentId: number;
  studentName: string;
  type: string;
  date: string;
  content: string;
  status: ReasonStatus;
  grade: number;
  classNumber: number;
};

export default function ReasonsPage() {
  const [selectedClass, setSelectedClass] =
    useState<ClassInfo | null>(null);

  const [students, setStudents] =
    useState<Student[]>([]);

  const [reasons, setReasons] =
    useState<Reason[]>([]);

  const [studentId, setStudentId] =
    useState("");

  const [type, setType] =
    useState("결석");

  const [date, setDate] =
    useState("");

  const [content, setContent] =
    useState("");

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    // =========================
    // 현재 학급 불러오기
    // =========================

    const savedClass =
      localStorage.getItem(
        "schoolcheck_class"
      );

    if (!savedClass) {
      return;
    }

    const classInfo: ClassInfo =
      JSON.parse(savedClass);

    setSelectedClass(classInfo);

    // =========================
    // 현재 학급 학생 불러오기
    // =========================

    const savedStudents =
      localStorage.getItem(
        "schoolcheck_students"
      );

    if (savedStudents) {
      const allStudents: Student[] =
        JSON.parse(savedStudents);

      const classStudents =
        allStudents.filter(
          (student) =>
            student.grade ===
              classInfo.grade &&
            student.classNumber ===
              classInfo.classNumber
        );

      setStudents(classStudents);
    } else {
      setStudents([]);
    }

    // =========================
    // 현재 학급 사유서 불러오기
    // =========================

    const savedReasons =
      localStorage.getItem(
        "schoolcheck_reasons"
      );

    if (savedReasons) {
      const allReasons: Reason[] =
        JSON.parse(savedReasons);

      const classReasons =
        allReasons.filter(
          (reason) =>
            reason.grade ===
              classInfo.grade &&
            reason.classNumber ===
              classInfo.classNumber
        );

      setReasons(classReasons);
    } else {
      setReasons([]);
    }

    // 기본 날짜
    const today =
      new Date()
        .toISOString()
        .split("T")[0];

    setDate(today);
  }

  // =========================
  // 학급 변경
  // =========================

  function changeClass() {
    window.location.href = "/";
  }

  // =========================
  // 사유서 등록
  // =========================

  function addReason() {
    if (!selectedClass) {
      alert(
        "먼저 학급을 선택해주세요."
      );
      return;
    }

    if (!studentId) {
      alert(
        "학생을 선택해주세요."
      );
      return;
    }

    if (!date) {
      alert(
        "날짜를 선택해주세요."
      );
      return;
    }

    if (!content.trim()) {
      alert(
        "사유 내용을 입력해주세요."
      );
      return;
    }

    const selectedStudent =
      students.find(
        (student) =>
          student.id ===
          Number(studentId)
      );

    if (!selectedStudent) {
      alert(
        "학생 정보를 찾을 수 없습니다."
      );
      return;
    }

    const savedReasons =
      localStorage.getItem(
        "schoolcheck_reasons"
      );

    const allReasons: Reason[] =
      savedReasons
        ? JSON.parse(savedReasons)
        : [];

    const newReason: Reason = {
      id: Date.now(),
      studentId:
        selectedStudent.id,
      studentName:
        selectedStudent.name,
      type,
      date,
      content:
        content.trim(),
      status: "대기",
      grade:
        selectedClass.grade,
      classNumber:
        selectedClass.classNumber,
    };

    // 다른 학급의 사유서는 그대로 유지하고
    // 현재 학급의 사유서만 추가한다.
    const newAllReasons = [
      ...allReasons,
      newReason,
    ];

    localStorage.setItem(
      "schoolcheck_reasons",
      JSON.stringify(
        newAllReasons
      )
    );

    setReasons([
      ...reasons,
      newReason,
    ]);

    // 입력 초기화
    setStudentId("");
    setContent("");

    alert(
      "사유서가 등록되었습니다."
    );
  }

  // =========================
  // 승인
  // =========================

  function approveReason(
    id: number
  ) {
    updateReasonStatus(
      id,
      "승인"
    );
  }

  // =========================
  // 반려
  // =========================

  function rejectReason(
    id: number
  ) {
    updateReasonStatus(
      id,
      "반려"
    );
  }

  // =========================
  // 상태 변경
  // =========================

  function updateReasonStatus(
    id: number,
    status: ReasonStatus
  ) {
    const savedReasons =
      localStorage.getItem(
        "schoolcheck_reasons"
      );

    if (!savedReasons) {
      return;
    }

    const allReasons: Reason[] =
      JSON.parse(savedReasons);

    const newAllReasons =
      allReasons.map(
        (reason) =>
          reason.id === id
            ? {
                ...reason,
                status,
              }
            : reason
      );

    localStorage.setItem(
      "schoolcheck_reasons",
      JSON.stringify(
        newAllReasons
      )
    );

    // 현재 학급 데이터도 갱신
    setReasons(
      newAllReasons.filter(
        (reason) =>
          selectedClass &&
          reason.grade ===
            selectedClass.grade &&
          reason.classNumber ===
            selectedClass.classNumber
      )
    );
  }

  // =========================
  // 사유서 삭제
  // =========================

  function deleteReason(
    id: number
  ) {
    const savedReasons =
      localStorage.getItem(
        "schoolcheck_reasons"
      );

    if (!savedReasons) {
      return;
    }

    const allReasons: Reason[] =
      JSON.parse(savedReasons);

    const newAllReasons =
      allReasons.filter(
        (reason) =>
          reason.id !== id
      );

    localStorage.setItem(
      "schoolcheck_reasons",
      JSON.stringify(
        newAllReasons
      )
    );

    setReasons(
      reasons.filter(
        (reason) =>
          reason.id !== id
      )
    );
  }

  // =========================
  // 학급 선택 안 된 경우
  // =========================

  if (!selectedClass) {
    return (
      <main className="login-page">
        <div className="login-box">
          <h1>
            학급 정보 없음
          </h1>

          <p className="sub">
            먼저 담당 학급을 선택해주세요.
          </p>

          <Link
            href="/"
            className="btn"
          >
            학급 선택하기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="container">
      {/* =========================
          사이드바
      ========================= */}

      <aside className="sidebar">
        <div className="logo">
          School<span>Check</span>
        </div>

        <div
          style={{
            padding: 10,
            marginBottom: 10,
            background: "#eef4ff",
            borderRadius: 10,
            color: "#2563eb",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          현재 확인 중인 학급
          <br />

          {selectedClass.grade}학년{" "}
          {selectedClass.classNumber}반
        </div>

        <button
          className="btn gray"
          style={{
            width: "100%",
            marginBottom: 15,
          }}
          onClick={changeClass}
        >
          학급 변경
        </button>

        <nav className="menu">
          <Link href="/">
            대시보드
          </Link>

          <Link href="/attendance">
            출결 체크
          </Link>

          <Link href="/statistics">
            출결 통계
          </Link>

          <Link href="/class">
            학생 관리
          </Link>

          <Link href="/reasons">
            사유서 관리
          </Link>
        </nav>
      </aside>

      {/* =========================
          메인
      ========================= */}

      <main className="main">
        <div className="header">
          <div>
            <h1 className="title">
              사유서 관리
            </h1>

            <div className="sub">
              {selectedClass.grade}학년{" "}
              {selectedClass.classNumber}반
              · 등록된 사유서{" "}
              {reasons.length}건
            </div>
          </div>
        </div>

        {/* =========================
            사유서 등록
        ========================= */}

        <div className="card">
          <h2>
            사유서 등록
          </h2>

          <p className="sub">
            현재 학급 학생의 출결 사유를
            등록해주세요.
          </p>

          {students.length === 0 ? (
            <div
              className="notice"
              style={{
                marginTop: 15,
              }}
            >
              현재 학급에 등록된 학생이 없습니다.
              <br />

              먼저 학생 관리에서
              학생을 등록해주세요.

              <div
                style={{
                  marginTop: 10,
                }}
              >
                <Link
                  href="/class"
                  className="btn"
                >
                  학생 관리
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* 학생 */}

              <div className="field">
                <label>
                  학생
                </label>

                <select
                  className="select"
                  value={studentId}
                  onChange={(e) =>
                    setStudentId(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    학생을 선택해주세요
                  </option>

                  {students.map(
                    (student) => (
                      <option
                        key={
                          student.id
                        }
                        value={
                          student.id
                        }
                      >
                        {student.number}번{" "}
                        {student.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* 사유 종류 */}

              <div className="field">
                <label>
                  사유 종류
                </label>

                <select
                  className="select"
                  value={type}
                  onChange={(e) =>
                    setType(
                      e.target.value
                    )
                  }
                >
                  <option value="결석">
                    결석
                  </option>

                  <option value="지각">
                    지각
                  </option>

                  <option value="조퇴">
                    조퇴
                  </option>

                  <option value="공결">
                    공결
                  </option>

                  <option value="병결">
                    병결
                  </option>
                </select>
              </div>

              {/* 날짜 */}

              <div className="field">
                <label>
                  날짜
                </label>

                <input
                  className="input"
                  type="date"
                  value={date}
                  onChange={(e) =>
                    setDate(
                      e.target.value
                    )
                  }
                />
              </div>

              {/* 사유 내용 */}

              <div className="field">
                <label>
                  사유 내용
                </label>

                <textarea
                  className="textarea"
                  placeholder="출결 사유를 입력해주세요."
                  value={content}
                  onChange={(e) =>
                    setContent(
                      e.target.value
                    )
                  }
                />
              </div>

              <button
                className="btn"
                onClick={
                  addReason
                }
              >
                사유서 등록
              </button>
            </>
          )}
        </div>

        {/* =========================
            사유서 목록
        ========================= */}

        <div className="table-card">
          <h2>
            사유서 목록
          </h2>

          {reasons.length === 0 ? (
            <div
              className="notice"
              style={{
                marginTop: 15,
              }}
            >
              현재 학급에 등록된 사유서가 없습니다.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>
                    학생
                  </th>

                  <th>
                    종류
                  </th>

                  <th>
                    날짜
                  </th>

                  <th>
                    사유
                  </th>

                  <th>
                    상태
                  </th>

                  <th>
                    관리
                  </th>
                </tr>
              </thead>

              <tbody>
                {reasons
                  .slice()
                  .sort(
                    (a, b) =>
                      b.id - a.id
                  )
                  .map(
                    (reason) => (
                      <tr
                        key={
                          reason.id
                        }
                      >
                        <td>
                          <strong>
                            {
                              reason.studentName
                            }
                          </strong>
                        </td>

                        <td>
                          {reason.type}
                        </td>

                        <td>
                          {reason.date}
                        </td>

                        <td
                          style={{
                            maxWidth: 300,
                          }}
                        >
                          {reason.content}
                        </td>

                        <td>
                          {reason.status ===
                            "대기" && (
                            <span
                              style={{
                                fontWeight: 700,
                                color:
                                  "#d97706",
                              }}
                            >
                              대기
                            </span>
                          )}

                          {reason.status ===
                            "승인" && (
                            <span
                              style={{
                                fontWeight: 700,
                                color:
                                  "#16a34a",
                              }}
                            >
                              승인
                            </span>
                          )}

                          {reason.status ===
                            "반려" && (
                            <span
                              style={{
                                fontWeight: 700,
                                color:
                                  "#dc2626",
                              }}
                            >
                              반려
                            </span>
                          )}
                        </td>

                        <td>
                          <div
                            style={{
                              display:
                                "flex",
                              gap: 5,
                              flexWrap:
                                "wrap",
                            }}
                          >
                            {reason.status ===
                              "대기" && (
                              <>
                                <button
                                  className="btn"
                                  onClick={() =>
                                    approveReason(
                                      reason.id
                                    )
                                  }
                                >
                                  승인
                                </button>

                                <button
                                  className="btn red"
                                  onClick={() =>
                                    rejectReason(
                                      reason.id
                                    )
                                  }
                                >
                                  반려
                                </button>
                              </>
                            )}

                            <button
                              className="btn gray"
                              onClick={() =>
                                deleteReason(
                                  reason.id
                                )
                              }
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}