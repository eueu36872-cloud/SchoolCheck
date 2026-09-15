"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Status =
  | "출석"
  | "지각"
  | "조퇴"
  | "결석"
  | "공결"
  | "병결";

type Student = {
  id: number;
  number: number;
  name: string;
  email?: string;
  grade: number;
  classNumber: number;
};

type AttendanceStudent = {
  id: number;
  number: number;
  name: string;
  email?: string;
  grade: number;
  classNumber: number;
  status: Status;
};

type AttendanceData = {
  id: string;
  grade: number;
  classNumber: number;
  date: string;
  students: AttendanceStudent[];
};

type ClassInfo = {
  grade: number;
  classNumber: number;
};

export default function Home() {
  const [selectedClass, setSelectedClass] =
    useState<ClassInfo | null>(null);

  const [students, setStudents] =
    useState<Student[]>([]);

  const [attendance, setAttendance] =
    useState<AttendanceData[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [selectingClass, setSelectingClass] =
    useState(false);

  // =========================
  // 초기 데이터
  // =========================

  useEffect(() => {
    const savedClass =
      localStorage.getItem(
        "schoolcheck_class"
      );

    if (!savedClass) {
      setLoading(false);
      return;
    }

    try {
      const classInfo: ClassInfo =
        JSON.parse(savedClass);

      setSelectedClass(classInfo);

      loadClassData(classInfo);
    } catch {
      setSelectedClass(null);
      setLoading(false);
    }

    const changeClass =
      localStorage.getItem(
        "schoolcheck_change_class"
      );

    if (changeClass === "true") {
      localStorage.removeItem(
        "schoolcheck_change_class"
      );

      setSelectingClass(true);
    }
  }, []);

  // =========================
  // 학급 데이터 불러오기
  // =========================

  async function loadClassData(
    classInfo: ClassInfo
  ) {
    // =========================
    // 학생
    // =========================

    const savedStudents =
      localStorage.getItem(
        "schoolcheck_students"
      );

    if (savedStudents) {
      try {
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

        setStudents(
          classStudents.sort(
            (a, b) =>
              a.number - b.number
          )
        );
      } catch {
        setStudents([]);
      }
    } else {
      setStudents([]);
    }

    // =========================
    // 출결
    // MongoDB 조회
    // =========================

    try {
      const response =
        await fetch(
          `/api/attendance?grade=${classInfo.grade}&classNumber=${classInfo.classNumber}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

      if (!response.ok) {
        throw new Error(
          "출결 데이터를 불러오지 못했습니다."
        );
      }

      const data =
        await response.json();

      if (!Array.isArray(data)) {
        setAttendance([]);
        return;
      }

      const convertedData:
        AttendanceData[] =
        data.map((item) => ({
          id: String(item._id),

          grade:
            item.grade,

          classNumber:
            item.classNumber,

          date:
            item.date,

          students:
            Array.isArray(
              item.students
            )
              ? item.students.map(
                  (
                    student: {
                      studentId?: number;
                      id?: number;
                      number: number;
                      name: string;
                      email?: string;
                      grade?: number;
                      classNumber?: number;
                      status: Status;
                    }
                  ) => ({
                    id:
                      student.studentId ??
                      student.id ??
                      0,

                    number:
                      student.number,

                    name:
                      student.name,

                    email:
                      student.email,

                    grade:
                      student.grade ??
                      item.grade,

                    classNumber:
                      student.classNumber ??
                      item.classNumber,

                    status:
                      student.status,
                  })
                )
              : [],
        }));

      // =========================
      // 미래 날짜 제외
      // =========================

      const today =
        new Date();

      const todayString =
        `${today.getFullYear()}-${String(
          today.getMonth() + 1
        ).padStart(2, "0")}-${String(
          today.getDate()
        ).padStart(2, "0")}`;

      const filteredData =
        convertedData
          .filter(
            (item) =>
              item.date <=
              todayString
          )
          .sort(
            (a, b) =>
              b.date.localeCompare(
                a.date
              )
          );

      setAttendance(
        filteredData
      );
    } catch (error) {
      console.error(
        "출결 조회 오류:",
        error
      );

      setAttendance([]);
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // 학급 변경
  // =========================

  function changeClass() {
    setSelectingClass(true);
  }

  // =========================
  // 학급 선택
  // =========================

  function selectClass(
    grade: number,
    classNumber: number
  ) {
    const newClass: ClassInfo = {
      grade,
      classNumber,
    };

    localStorage.setItem(
      "schoolcheck_class",
      JSON.stringify(newClass)
    );

    setSelectedClass(
      newClass
    );

    setSelectingClass(false);

    setLoading(true);

    loadClassData(
      newClass
    );
  }

  // =========================
  // 로딩
  // =========================

  if (loading) {
    return (
      <main className="login-page">
        <div className="login-box">
          <h1>SchoolCheck</h1>

          <p className="sub">
            데이터를 불러오는 중입니다...
          </p>
        </div>
      </main>
    );
  }

  // =========================
  // 학급 선택
  // =========================

  if (
    !selectedClass ||
    selectingClass
  ) {
    return (
      <main className="login-page">
        <div
          className="login-box"
          style={{
            width: 650,
          }}
        >
          <h1>
            {selectedClass
              ? "학급 변경"
              : "담당 학급 선택"}
          </h1>

          <p className="sub">
            {selectedClass
              ? "확인할 학급을 선택해주세요."
              : "선생님의 담당 학급을 선택해주세요."}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, 1fr)",
              gap: 10,
              marginTop: 25,
            }}
          >
            {[1, 2, 3].map(
              (grade) =>
                [1, 2, 3, 4, 5, 6].map(
                  (classNumber) => (
                    <button
                      key={`${grade}-${classNumber}`}
                      className="btn gray"
                      onClick={() =>
                        selectClass(
                          grade,
                          classNumber
                        )
                      }
                    >
                      {grade}학년{" "}
                      {classNumber}반
                    </button>
                  )
                )
            )}
          </div>

          {selectedClass && (
            <button
              className="btn"
              style={{
                width: "100%",
                marginTop: 20,
              }}
              onClick={() =>
                setSelectingClass(false)
              }
            >
              현재 학급으로 돌아가기
            </button>
          )}
        </div>
      </main>
    );
  }

  // =========================
  // 최근 출결
  // =========================

  const latestAttendance =
    attendance.length > 0
      ? attendance[0]
      : null;

  let presentCount = 0;
  let lateCount = 0;
  let absentCount = 0;
  let earlyLeaveCount = 0;
  let excusedCount = 0;
  let sickLeaveCount = 0;

  if (latestAttendance) {
    latestAttendance.students.forEach(
      (student) => {
        if (
          student.status ===
          "출석"
        ) {
          presentCount++;
        }

        if (
          student.status ===
          "지각"
        ) {
          lateCount++;
        }

        if (
          student.status ===
          "결석"
        ) {
          absentCount++;
        }

        if (
          student.status ===
          "조퇴"
        ) {
          earlyLeaveCount++;
        }

        if (
          student.status ===
          "공결"
        ) {
          excusedCount++;
        }

        if (
          student.status ===
          "병결"
        ) {
          sickLeaveCount++;
        }
      }
    );
  }

  const attendanceRate =
    latestAttendance &&
    latestAttendance.students.length >
      0
      ? `${Math.round(
          (presentCount /
            latestAttendance.students
              .length) *
            100
        )}%`
      : "-";

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
            출결 확인
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
              대시보드
            </h1>

            <div className="sub">
              {selectedClass.grade}학년{" "}
              {selectedClass.classNumber}반
              출결 현황
            </div>
          </div>
        </div>

        {/* 학생 수 안내 */}

        {students.length === 0 ? (
          <div className="notice">
            현재 학급에 등록된 학생이 없습니다.
            <br />
            학생 관리에서 학생을 등록해주세요.
          </div>
        ) : (
          <div className="notice">
            현재{" "}
            {selectedClass.grade}학년{" "}
            {selectedClass.classNumber}반에{" "}
            <strong>
              {students.length}명
            </strong>
            의 학생이 등록되어 있습니다.
          </div>
        )}

        {/* 기본 카드 */}

        <div className="cards">
          <div className="card">
            <div className="card-title">
              학생 수
            </div>

            <div className="number">
              {students.length}명
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              최근 출결률
            </div>

            <div className="number">
              {attendanceRate}
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              지각
            </div>

            <div className="number">
              {latestAttendance
                ? `${lateCount}명`
                : "-"}
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              결석
            </div>

            <div className="number">
              {latestAttendance
                ? `${absentCount}명`
                : "-"}
            </div>
          </div>
        </div>

        {/* 출결 기록 없음 */}

        {!latestAttendance &&
          students.length > 0 && (
            <div
              className="card"
              style={{
                marginTop: 20,
              }}
            >
              <h2>
                아직 출결 기록이 없습니다.
              </h2>

              <p className="sub">
                출결 확인에서 날짜를 선택하고
                아침 조회 출결을 입력해주세요.
              </p>

              <Link
                href="/attendance"
                className="btn"
                style={{
                  marginTop: 10,
                }}
              >
                출결 확인하기
              </Link>
            </div>
          )}

        {/* 최근 출결 */}

        {latestAttendance && (
          <div
            className="table-card"
            style={{
              marginTop: 20,
            }}
          >
            <h2>
              최근 출결 현황
            </h2>

            <p className="sub">
              {latestAttendance.date}
              {" · "}
              아침 조회
            </p>

            <table>
              <thead>
                <tr>
                  <th>번호</th>
                  <th>학생</th>
                  <th>상태</th>
                </tr>
              </thead>

              <tbody>
                {latestAttendance.students.map(
                  (student) => (
                    <tr
                      key={student.id}
                    >
                      <td>
                        {student.number}
                      </td>

                      <td>
                        <strong>
                          {student.name}
                        </strong>
                      </td>

                      <td>
                        {student.status}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 출결 상세 */}

        {latestAttendance && (
          <div
            className="cards"
            style={{
              marginTop: 20,
            }}
          >
            <div className="card">
              <div className="card-title">
                출석
              </div>

              <div className="number">
                {presentCount}명
              </div>
            </div>

            <div className="card">
              <div className="card-title">
                지각
              </div>

              <div className="number">
                {lateCount}명
              </div>
            </div>

            <div className="card">
              <div className="card-title">
                조퇴
              </div>

              <div className="number">
                {earlyLeaveCount}명
              </div>
            </div>

            <div className="card">
              <div className="card-title">
                공결
              </div>

              <div className="number">
                {excusedCount}명
              </div>
            </div>

            <div className="card">
              <div className="card-title">
                병결
              </div>

              <div className="number">
                {sickLeaveCount}명
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}