"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Student = {
  id: number;
  number: number;
  name: string;
  email: string;
  grade: number;
  classNumber: number;
};

type ClassInfo = {
  grade: number;
  classNumber: number;
};

export default function ClassPage() {
  const [selectedClass, setSelectedClass] =
    useState<ClassInfo | null>(null);

  const [students, setStudents] =
    useState<Student[]>([]);

  const [name, setName] =
    useState("");

  const [keyword, setKeyword] =
    useState("");

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
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

    loadStudents(classInfo);
  }

  // 현재 학급 학생만 불러오기
  function loadStudents(
    classInfo: ClassInfo
  ) {
    const savedStudents =
      localStorage.getItem(
        "schoolcheck_students"
      );

    if (!savedStudents) {
      setStudents([]);
      return;
    }

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
  }

  // 학생 등록
  function addStudent() {
    if (!name.trim()) {
      alert(
        "학생 이름을 입력해주세요."
      );
      return;
    }

    if (!selectedClass) {
      alert(
        "먼저 학급을 선택해주세요."
      );
      return;
    }

    const savedStudents =
      localStorage.getItem(
        "schoolcheck_students"
      );

    const allStudents: Student[] =
      savedStudents
        ? JSON.parse(savedStudents)
        : [];

    // 현재 반에서 가장 큰 번호 + 1
    const currentClassStudents =
      allStudents.filter(
        (student) =>
          student.grade ===
            selectedClass.grade &&
          student.classNumber ===
            selectedClass.classNumber
      );

    const nextNumber =
      currentClassStudents.length > 0
        ? Math.max(
            ...currentClassStudents.map(
              (student) =>
                student.number
            )
          ) + 1
        : 1;

    const newStudent: Student = {
      id: Date.now(),
      number: nextNumber,
      name: name.trim(),
      email: `${name.trim()}@school.com`,
      grade: selectedClass.grade,
      classNumber:
        selectedClass.classNumber,
    };

    const newAllStudents = [
      ...allStudents,
      newStudent,
    ];

    // 전체 반의 학생 데이터를 그대로 유지하면서
    // 새로운 학생만 추가
    localStorage.setItem(
      "schoolcheck_students",
      JSON.stringify(
        newAllStudents
      )
    );

    setStudents([
      ...students,
      newStudent,
    ]);

    setName("");
  }

  // 학생 삭제
  function deleteStudent(
    id: number
  ) {
    const savedStudents =
      localStorage.getItem(
        "schoolcheck_students"
      );

    if (!savedStudents) {
      return;
    }

    const allStudents: Student[] =
      JSON.parse(savedStudents);

    const newAllStudents =
      allStudents.filter(
        (student) =>
          student.id !== id
      );

    localStorage.setItem(
      "schoolcheck_students",
      JSON.stringify(
        newAllStudents
      )
    );

    setStudents(
      students.filter(
        (student) =>
          student.id !== id
      )
    );
  }

  // 학급 변경
  // 중요: schoolcheck_class만 변경하고
  // 학생 데이터는 절대 삭제하지 않는다.
  function changeClass() {
    window.location.href = "/";
  }

  const filteredStudents =
    students.filter(
      (student) =>
        student.name.includes(keyword)
    );

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

      <main className="main">

        <div className="header">
          <div>

            <h1 className="title">
              학생 관리
            </h1>

            <div className="sub">
              {selectedClass.grade}학년{" "}
              {selectedClass.classNumber}반
              · 학생 {students.length}명
            </div>

          </div>
        </div>

        {/* 학생 등록 */}

        <div className="card">

          <h2>
            학생 등록
          </h2>

          <p className="sub">
            현재 학급의 학생 이름을
            직접 등록해주세요.
          </p>

          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 15,
            }}
          >

            <input
              className="input"
              placeholder="학생 이름 입력"
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addStudent();
                }
              }}
            />

            <button
              className="btn"
              onClick={addStudent}
              style={{
                whiteSpace:
                  "nowrap",
                minWidth: 95,
              }}
            >
              학생 등록
            </button>

          </div>

        </div>

        {/* 학생 목록 */}

        <div className="table-card">

          <h2>
            {selectedClass.grade}학년{" "}
            {selectedClass.classNumber}반
            학생
          </h2>

          {students.length > 0 && (
            <input
              className="input"
              style={{
                maxWidth: 250,
                marginBottom: 15,
              }}
              placeholder="학생 검색"
              value={keyword}
              onChange={(e) =>
                setKeyword(
                  e.target.value
                )
              }
            />
          )}

          {students.length === 0 ? (
            <div
              className="notice"
              style={{
                marginTop: 15,
              }}
            >
              아직 등록된 학생이 없습니다.
              <br />
              위의 학생 등록에서
              현재 학급 학생을 등록해주세요.
            </div>
          ) : (
            <table>

              <thead>
                <tr>
                  <th>번호</th>
                  <th>이름</th>
                  <th>이메일</th>
                  <th>관리</th>
                </tr>
              </thead>

              <tbody>

                {filteredStudents.map(
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
                        {student.email}
                      </td>

                      <td>
                        <button
                          className="btn red"
                          onClick={() =>
                            deleteStudent(
                              student.id
                            )
                          }
                        >
                          삭제
                        </button>
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>
          )}

          {students.length > 0 &&
            filteredStudents.length ===
              0 && (
              <p className="sub">
                검색된 학생이 없습니다.
              </p>
            )}

        </div>

      </main>

    </div>
  );
}