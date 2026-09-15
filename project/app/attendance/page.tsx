"use client";

import { useEffect, useMemo, useState } from "react";

type Status =
  | "출석"
  | "지각"
  | "결석"
  | "조퇴"
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

type SelectedClass = {
  grade: number;
  classNumber: number;
};

const statusList: Status[] = [
  "출석",
  "지각",
  "결석",
  "조퇴",
  "공결",
  "병결",
];

export default function AttendancePage() {
  const [selectedClass, setSelectedClass] =
    useState<SelectedClass | null>(null);

  const [students, setStudents] =
    useState<Student[]>([]);

  const [attendance, setAttendance] =
    useState<AttendanceData | null>(null);

  const [date, setDate] =
    useState("");

  // 선택하지 않은 학생은 아예 값이 없음
  const [statusMap, setStatusMap] =
    useState<Record<number, Status>>({});

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  // =========================
  // 학급 / 학생 불러오기
  // =========================

  useEffect(() => {
    const classData =
      localStorage.getItem(
        "schoolcheck_class"
      );

    if (classData) {
      try {
        const parsedClass =
          JSON.parse(classData);

        if (
          parsedClass &&
          typeof parsedClass.grade ===
            "number" &&
          typeof parsedClass.classNumber ===
            "number"
        ) {
          setSelectedClass(
            parsedClass
          );
        }
      } catch {
        setSelectedClass(null);
      }
    }

    const studentData =
      localStorage.getItem(
        "schoolcheck_students"
      );

    if (studentData) {
      try {
        const parsedStudents =
          JSON.parse(studentData);

        if (
          Array.isArray(
            parsedStudents
          )
        ) {
          setStudents(
            parsedStudents
          );
        }
      } catch {
        setStudents([]);
      }
    }
  }, []);

  // =========================
  // 현재 학급 학생
  // =========================

  const classStudents =
    useMemo(() => {
      if (!selectedClass) {
        return [];
      }

      return students
        .filter(
          (student) =>
            student.grade ===
              selectedClass.grade &&
            student.classNumber ===
              selectedClass.classNumber
        )
        .sort(
          (a, b) =>
            a.number - b.number
        );
    }, [
      students,
      selectedClass,
    ]);

  // =========================
  // 날짜 선택
  // =========================

  function handleDateChange(
    newDate: string
  ) {
    setDate(newDate);

    // 날짜를 바꾸면 이전 날짜의 출결 상태 제거
    setMessage("");
    setAttendance(null);
    setStatusMap({});
  }

  // =========================
  // 선택한 날짜의 출결 조회
  // =========================

  useEffect(() => {
    if (
      !selectedClass ||
      !date
    ) {
      setAttendance(null);
      setStatusMap({});
      return;
    }

    const grade =
      selectedClass.grade;

    const classNumber =
      selectedClass.classNumber;

    async function loadDateAttendance() {
      try {
        setLoading(true);
        setMessage("");

        const response =
          await fetch(
            `/api/attendance?grade=${grade}&classNumber=${classNumber}&date=${date}`,
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

        // =========================
        // 해당 날짜에 저장된 기록이 없음
        // =========================

        if (
          !Array.isArray(data) ||
          data.length === 0
        ) {
          setAttendance(null);

          // 중요:
          // 새 날짜에는 아무 상태도 자동으로 선택하지 않음
          setStatusMap({});

          return;
        }

        // =========================
        // 해당 날짜의 기록 사용
        // =========================

        const item = data[0];

        const convertedData:
          AttendanceData = {
          id: String(
            item._id
          ),

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
        };

        setAttendance(
          convertedData
        );

        // =========================
        // 저장되어 있는 상태만 표시
        // =========================

        const newStatusMap:
          Record<number, Status> =
          {};

        convertedData.students.forEach(
          (student) => {
            newStatusMap[
              student.id
            ] = student.status;
          }
        );

        setStatusMap(
          newStatusMap
        );
      } catch (error) {
        console.error(
          "출결 조회 오류:",
          error
        );

        setAttendance(null);

        // 오류가 발생해도 자동 출석 처리하지 않음
        setStatusMap({});

        setMessage(
          "출결 데이터를 불러오지 못했습니다."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDateAttendance();
  }, [
    selectedClass,
    date,
    classStudents,
  ]);

  // =========================
  // 출결 상태 변경
  // =========================

  function changeStatus(
    studentId: number,
    status: Status
  ) {
    setStatusMap(
      (prev) => ({
        ...prev,
        [studentId]: status,
      })
    );

    setMessage("");
  }

  // =========================
  // 출결 저장
  // =========================

  async function saveAttendance() {
    if (!selectedClass) {
      setMessage(
        "먼저 학급을 선택해주세요."
      );
      return;
    }

    if (!date) {
      setMessage(
        "출결 날짜를 먼저 선택해주세요."
      );
      return;
    }

    if (
      classStudents.length === 0
    ) {
      setMessage(
        "등록된 학생이 없습니다. 학생 관리에서 학생을 등록해주세요."
      );
      return;
    }

    // =========================
    // 모든 학생의 상태 선택 여부 확인
    // =========================

    const unselectedStudents =
      classStudents.filter(
        (student) =>
          !statusMap[student.id]
      );

    if (
      unselectedStudents.length > 0
    ) {
      const names =
        unselectedStudents
          .map(
            (student) =>
              student.name
          )
          .join(", ");

      setMessage(
        `모든 학생의 출결 상태를 선택해주세요. 미선택: ${names}`
      );

      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const attendanceStudents =
        classStudents.map(
          (student) => ({
            studentId:
              student.id,

            number:
              student.number,

            name:
              student.name,

            // 이제 자동 "출석" 없음
            status:
              statusMap[
                student.id
              ] as Status,
          })
        );

      const response =
        await fetch(
          "/api/attendance",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                grade:
                  selectedClass.grade,

                classNumber:
                  selectedClass.classNumber,

                date,

                students:
                  attendanceStudents,
              }),
          }
        );

      if (!response.ok) {
        const errorData =
          await response
            .json()
            .catch(
              () => null
            );

        throw new Error(
          errorData?.message ||
            "출결 저장에 실패했습니다."
        );
      }

      const savedData =
        await response.json();

      const convertedData:
        AttendanceData = {
        id: String(
          savedData._id
        ),

        grade:
          savedData.grade,

        classNumber:
          savedData.classNumber,

        date:
          savedData.date,

        students:
          Array.isArray(
            savedData.students
          )
            ? savedData.students.map(
                (
                  student: {
                    studentId: number;
                    number: number;
                    name: string;
                    email?: string;
                    status: Status;
                  }
                ) => ({
                  id:
                    student.studentId,

                  number:
                    student.number,

                  name:
                    student.name,

                  email:
                    student.email,

                  grade:
                    savedData.grade,

                  classNumber:
                    savedData.classNumber,

                  status:
                    student.status,
                })
              )
            : [],
      };

      // 현재 선택한 날짜의 데이터만 변경
      setAttendance(
        convertedData
      );

      // 저장된 상태를 화면에 반영
      const newStatusMap:
        Record<number, Status> =
        {};

      convertedData.students.forEach(
        (student) => {
          newStatusMap[
            student.id
          ] = student.status;
        }
      );

      setStatusMap(
        newStatusMap
      );

      setMessage(
        `${date} 아침 조회 출결이 저장되었습니다.`
      );
    } catch (error) {
      console.error(
        "출결 저장 오류:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "출결 저장에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // 학급 변경
  // =========================

  function changeClass() {
    localStorage.setItem(
      "schoolcheck_change_class",
      "true"
    );

    window.location.href =
      "/";
  }

  // =========================
  // 현재 통계
  // =========================

  const currentStats =
    useMemo(() => {
      const stats: Record<
        Status,
        number
      > = {
        출석: 0,
        지각: 0,
        결석: 0,
        조퇴: 0,
        공결: 0,
        병결: 0,
      };

      Object.values(
        statusMap
      ).forEach(
        (status) => {
          if (
            status in stats
          ) {
            stats[status]++;
          }
        }
      );

      return stats;
    }, [statusMap]);

  return (
    <div className="container">
      {/* =========================
          사이드바
      ========================= */}

      <aside className="sidebar">
        <div className="logo">
          School<span>Check</span>
        </div>

        <nav className="menu">
          <a href="/">
            대시보드
          </a>

          <a href="/attendance">
            출결 확인
          </a>

          <a href="/statistics">
            출결 통계
          </a>

          <a href="/class">
            학생 관리
          </a>

          <a href="/reasons">
            사유 관리
          </a>

          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              changeClass();
            }}
          >
            학급 변경
          </a>
        </nav>
      </aside>

      {/* =========================
          메인
      ========================= */}

      <main className="main">
        <div className="header">
          <div>
            <h1 className="title">
              출결 확인
            </h1>

            <div className="sub">
              {selectedClass
                ? `${selectedClass.grade}학년 ${selectedClass.classNumber}반`
                : "학급을 선택해주세요."}
            </div>
          </div>

          {selectedClass && (
            <button
              className="btn gray"
              onClick={
                changeClass
              }
            >
              학급 변경
            </button>
          )}
        </div>

        {!selectedClass ? (
          <div className="notice">
            먼저 학급을 선택해주세요.
          </div>
        ) : (
          <>
            {/* =========================
                날짜 선택
            ========================= */}

            <div className="card">
              <div className="field">
                <label>
                  출결 날짜
                </label>

                <input
                  className="input"
                  type="date"
                  value={date}
                  onChange={(e) =>
                    handleDateChange(
                      e.target.value
                    )
                  }
                />
              </div>

              <div
                style={{
                  marginTop: 10,
                  color: "#667085",
                  fontSize: 14,
                }}
              >
                출결을 확인할 날짜를
                선택해주세요.
              </div>
            </div>

            {!date ? (
              <div
                className="notice"
                style={{
                  marginTop: 18,
                }}
              >
                날짜를 선택하면 해당 날짜의
                출결을 확인할 수 있습니다.
              </div>
            ) : (
              <>
                {/* =========================
                    선택한 날짜
                ========================= */}

                <div
                  className="card"
                  style={{
                    marginTop: 18,
                    background:
                      "#eef4ff",
                    borderColor:
                      "#cfe0ff",
                  }}
                >
                  <div
                    style={{
                      color:
                        "#667085",
                      fontSize: 14,
                    }}
                  >
                    선택한 날짜
                  </div>

                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      marginTop: 6,
                    }}
                  >
                    {date}
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      gap: 15,
                      flexWrap:
                        "wrap",
                      fontSize: 14,
                    }}
                  >
                    <span>
                      출석{" "}
                      <strong>
                        {
                          currentStats.출석
                        }
                      </strong>
                    </span>

                    <span>
                      지각{" "}
                      <strong>
                        {
                          currentStats.지각
                        }
                      </strong>
                    </span>

                    <span>
                      결석{" "}
                      <strong>
                        {
                          currentStats.결석
                        }
                      </strong>
                    </span>

                    <span>
                      조퇴{" "}
                      <strong>
                        {
                          currentStats.조퇴
                        }
                      </strong>
                    </span>

                    <span>
                      공결{" "}
                      <strong>
                        {
                          currentStats.공결
                        }
                      </strong>
                    </span>

                    <span>
                      병결{" "}
                      <strong>
                        {
                          currentStats.병결
                        }
                      </strong>
                    </span>
                  </div>
                </div>

                {/* =========================
                    학생 출결
                ========================= */}

                <div
                  className="table-card"
                  style={{
                    marginTop: 18,
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      gap: 15,
                      marginBottom:
                        15,
                      flexWrap:
                        "wrap",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: 0,
                        }}
                      >
                        {date} 아침 조회
                        출결
                      </h3>

                      <div
                        style={{
                          marginTop: 5,
                          color:
                            "#667085",
                          fontSize: 14,
                        }}
                      >
                        학생{" "}
                        {
                          classStudents.length
                        }
                        명
                        {attendance
                          ? " · 저장된 출결"
                          : " · 새 출결"}
                      </div>
                    </div>
                  </div>

                  {loading && (
                    <div
                      className="notice"
                      style={{
                        marginBottom: 15,
                      }}
                    >
                      출결 데이터를
                      불러오는 중입니다...
                    </div>
                  )}

                  {classStudents.length ===
                  0 ? (
                    <div className="notice">
                      등록된 학생이 없습니다.
                      <br />
                      학생 관리에서 학생을
                      먼저 등록해주세요.
                    </div>
                  ) : (
                    <>
                      <table>
                        <thead>
                          <tr>
                            <th>
                              번호
                            </th>

                            <th>
                              학생
                            </th>

                            <th>
                              출결 상태
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {classStudents.map(
                            (
                              student
                            ) => {
                              // 선택하지 않은 학생은
                              // 아무 버튼도 활성화하지 않음
                              const currentStatus =
                                statusMap[
                                  student.id
                                ];

                              return (
                                <tr
                                  key={
                                    student.id
                                  }
                                >
                                  <td>
                                    {
                                      student.number
                                    }
                                  </td>

                                  <td>
                                    <strong>
                                      {
                                        student.name
                                      }
                                    </strong>
                                  </td>

                                  <td>
                                    <div className="status-buttons">
                                      {statusList.map(
                                        (
                                          status
                                        ) => (
                                          <button
                                            key={`${student.id}-${status}`}
                                            type="button"
                                            className={
                                              currentStatus ===
                                              status
                                                ? "active"
                                                : ""
                                            }
                                            onClick={() =>
                                              changeStatus(
                                                student.id,
                                                status
                                              )
                                            }
                                          >
                                            {
                                              status
                                            }
                                          </button>
                                        )
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>

                      {message && (
                        <div
                          className="notice"
                          style={{
                            marginTop: 18,
                            marginBottom: 0,
                          }}
                        >
                          {message}
                        </div>
                      )}

                      <div
                        style={{
                          marginTop: 20,
                          display:
                            "flex",
                          justifyContent:
                            "flex-end",
                        }}
                      >
                        <button
                          className="btn"
                          onClick={
                            saveAttendance
                          }
                          disabled={
                            loading
                          }
                        >
                          {loading
                            ? "저장 중..."
                            : attendance
                            ? "출결 수정 저장"
                            : "출결 저장"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}