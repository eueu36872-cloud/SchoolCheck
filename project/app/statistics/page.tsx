"use client";

import {
  Fragment,
  useEffect,
  useMemo,
  useState,
} from "react";

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

type SelectedClass = {
  grade: number;
  classNumber: number;
};

type PeriodType =
  | "year"
  | "month"
  | "date";

const statusList: Status[] = [
  "출석",
  "지각",
  "조퇴",
  "결석",
  "공결",
  "병결",
];

const statusColor: Record<Status, string> = {
  출석: "#2563eb",
  지각: "#f59e0b",
  조퇴: "#8b5cf6",
  결석: "#ef4444",
  공결: "#10b981",
  병결: "#64748b",
};

function getCurrentYear() {
  return new Date().getFullYear();
}

function getCurrentMonth() {
  return String(
    new Date().getMonth() + 1
  ).padStart(2, "0");
}

function getToday() {
  const now = new Date();

  const year =
    now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createEmptyStats(): Record<
  Status,
  number
> {
  return {
    출석: 0,
    지각: 0,
    조퇴: 0,
    결석: 0,
    공결: 0,
    병결: 0,
  };
}

function formatDate(date: string) {
  if (!date) {
    return "-";
  }

  const [
    year,
    month,
    day,
  ] = date.split("-");

  return `${year}.${month}.${day}`;
}

function getWeekday(date: string) {
  const day =
    new Date(
      `${date}T00:00:00`
    ).getDay();

  const weekdays = [
    "일",
    "월",
    "화",
    "수",
    "목",
    "금",
    "토",
  ];

  return weekdays[day];
}

export default function StatisticsPage() {
  const [selectedClass, setSelectedClass] =
    useState<SelectedClass | null>(
      null
    );

  const [attendance, setAttendance] =
    useState<AttendanceData[]>([]);

  const [students, setStudents] =
    useState<Student[]>([]);

  const [loading, setLoading] =
    useState(true);

  // 통계 기간
  const [periodType, setPeriodType] =
    useState<PeriodType>("year");

  const [selectedYear, setSelectedYear] =
    useState(
      String(getCurrentYear())
    );

  const [selectedMonth, setSelectedMonth] =
    useState(getCurrentMonth());

  // 날짜별 상세
  const [selectedDate, setSelectedDate] =
    useState(getToday());

  const [expandedDate, setExpandedDate] =
    useState<string | null>(null);

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
  // MongoDB 출결 조회
  // =========================

  useEffect(() => {
    if (!selectedClass) {
      setAttendance([]);
      setLoading(false);
      return;
    }

    const grade =
      selectedClass.grade;

    const classNumber =
      selectedClass.classNumber;

    async function loadAttendance() {
      try {
        setLoading(true);

        const response =
          await fetch(
            `/api/attendance?grade=${grade}&classNumber=${classNumber}`,
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

        setAttendance(
          convertedData
        );
      } catch (error) {
        console.error(
          "출결 통계 조회 오류:",
          error
        );

        setAttendance([]);
      } finally {
        setLoading(false);
      }
    }

    loadAttendance();
  }, [selectedClass]);

  // =========================
  // 현재 학급 학생
  // =========================

  const classStudents = useMemo(() => {
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
  // 현재 학급 날짜별 기록
  // =========================

  const classAttendance = useMemo(() => {
    if (!selectedClass) {
      return [];
    }

    const result =
      attendance.filter(
        (record) =>
          record.grade ===
            selectedClass.grade &&
          record.classNumber ===
            selectedClass.classNumber
      );

    const latestMap =
      new Map<
        string,
        AttendanceData
      >();

    result.forEach((record) => {
      latestMap.set(
        record.date,
        record
      );
    });

    return Array.from(
      latestMap.values()
    ).sort((a, b) =>
      b.date.localeCompare(
        a.date
      )
    );
  }, [
    attendance,
    selectedClass,
  ]);

  // =========================
  // 선택한 날짜
  // =========================

  const selectedAttendance =
    useMemo(() => {
      return (
        classAttendance.find(
          (record) =>
            record.date ===
            selectedDate
        ) || null
      );
    }, [
      classAttendance,
      selectedDate,
    ]);

  // =========================
  // 선택한 날짜 통계
  // =========================

  const dailyStats = useMemo(() => {
    const result =
      createEmptyStats();

    if (
      !selectedAttendance ||
      !Array.isArray(
        selectedAttendance.students
      )
    ) {
      return result;
    }

    selectedAttendance.students.forEach(
      (student) => {
        if (
          student.status in
          result
        ) {
          result[
            student.status
          ]++;
        }
      }
    );

    return result;
  }, [selectedAttendance]);

  const dailyTotal =
    Object.values(
      dailyStats
    ).reduce(
      (sum, value) =>
        sum + value,
      0
    );

  const dailyRate =
    dailyTotal > 0
      ? Math.round(
          (dailyStats.출석 /
            dailyTotal) *
            100
        )
      : 0;

  // =========================
  // 1년 / 월별 출결 필터
  // =========================

  const periodAttendance =
    useMemo(() => {
      const year =
        Number(selectedYear);

      return classAttendance.filter(
        (record) => {
          const [
            recordYear,
            recordMonth,
          ] = record.date.split("-");

          if (
            Number(recordYear) !==
            year
          ) {
            return false;
          }

          if (
            periodType ===
            "month"
          ) {
            return (
              recordMonth ===
              selectedMonth
            );
          }

          return true;
        }
      );
    }, [
      classAttendance,
      selectedYear,
      selectedMonth,
      periodType,
    ]);

  // =========================
  // 기간 전체 통계
  // =========================

  const periodStats = useMemo(() => {
    const result: Record<
      Status,
      number
    > = createEmptyStats();

    periodAttendance.forEach(
      (record) => {
        record.students.forEach(
          (student) => {
            if (
              student.status in
              result
            ) {
              result[
                student.status
              ]++;
            }
          }
        );
      }
    );

    return result;
  }, [periodAttendance]);

  const periodTotal =
    Object.values(
      periodStats
    ).reduce(
      (sum, value) =>
        sum + value,
      0
    );

  const periodRate =
    periodTotal > 0
      ? Math.round(
          (periodStats.출석 /
            periodTotal) *
            100
        )
      : 0;

  // =========================
  // 기간별 학생 통계
  // =========================

  const periodStudentStats =
    useMemo(() => {
      return classStudents.map(
        (student) => {
          const stats =
            createEmptyStats();

          periodAttendance.forEach(
            (record) => {
              const attendanceStudent =
                record.students.find(
                  (item) =>
                    item.id ===
                    student.id
                );

              if (
                attendanceStudent
              ) {
                stats[
                  attendanceStudent
                    .status
                ]++;
              }
            }
          );

          const total =
            Object.values(
              stats
            ).reduce(
              (sum, value) =>
                sum + value,
              0
            );

          const rate =
            total > 0
              ? Math.round(
                  (stats.출석 /
                    total) *
                    100
                )
              : 0;

          return {
            ...student,
            stats,
            total,
            rate,
          };
        }
      );
    }, [
      classStudents,
      periodAttendance,
    ]);

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
  // 날짜 선택
  // =========================

  function selectDate(
    date: string
  ) {
    setSelectedDate(date);
    setExpandedDate(date);
    setPeriodType("date");
  }

  function toggleDate(
    date: string
  ) {
    setSelectedDate(date);

    setExpandedDate(
      (previous) =>
        previous === date
          ? null
          : date
    );

    setPeriodType("date");
  }

  // =========================
  // 날짜별 통계
  // =========================

  function getDailyStats(
    record: AttendanceData
  ) {
    const stats =
      createEmptyStats();

    if (
      Array.isArray(
        record.students
      )
    ) {
      record.students.forEach(
        (student) => {
          if (
            student.status in
            stats
          ) {
            stats[
              student.status
            ]++;
          }
        }
      );
    }

    return stats;
  }

  // =========================
  // 기간 제목
  // =========================

  function getPeriodTitle() {
    if (
      periodType ===
      "year"
    ) {
      return `${selectedYear}년 전체`;
    }

    if (
      periodType ===
      "month"
    ) {
      return `${selectedYear}년 ${Number(
        selectedMonth
      )}월`;
    }

    return `${formatDate(
      selectedDate
    )}`;
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
              출결 통계
            </h1>

            <div className="sub">
              {selectedClass
                ? `${selectedClass.grade}학년 ${selectedClass.classNumber}반 출결 현황`
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
            {loading && (
              <div
                className="notice"
                style={{
                  marginBottom: 18,
                }}
              >
                MongoDB 출결 데이터를
                불러오는 중입니다...
              </div>
            )}

            {/* =========================
                통계 기간 선택
            ========================= */}

            <div className="card">
              <h3
                style={{
                  marginTop: 0,
                }}
              >
                통계 기간
              </h3>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <button
                  className={
                    periodType ===
                    "year"
                      ? "btn"
                      : "btn gray"
                  }
                  onClick={() =>
                    setPeriodType(
                      "year"
                    )
                  }
                >
                  1년 전체
                </button>

                <button
                  className={
                    periodType ===
                    "month"
                      ? "btn"
                      : "btn gray"
                  }
                  onClick={() =>
                    setPeriodType(
                      "month"
                    )
                  }
                >
                  월별
                </button>

                <button
                  className={
                    periodType ===
                    "date"
                      ? "btn"
                      : "btn gray"
                  }
                  onClick={() =>
                    setPeriodType(
                      "date"
                    )
                  }
                >
                  날짜별
                </button>
              </div>

              {periodType !==
                "date" && (
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginTop: 18,
                    flexWrap:
                      "wrap",
                  }}
                >
                  <div
                    className="field"
                    style={{
                      margin: 0,
                      minWidth: 160,
                    }}
                  >
                    <label>
                      연도
                    </label>

                    <select
                      className="input"
                      value={
                        selectedYear
                      }
                      onChange={(e) =>
                        setSelectedYear(
                          e.target
                            .value
                        )
                      }
                    >
                      <option value="2026">
                        2026년
                      </option>

                      <option value="2027">
                        2027년
                      </option>

                      <option value="2028">
                        2028년
                      </option>
                    </select>
                  </div>

                  {periodType ===
                    "month" && (
                    <div
                      className="field"
                      style={{
                        margin: 0,
                        minWidth: 160,
                      }}
                    >
                      <label>
                        월
                      </label>

                      <select
                        className="input"
                        value={
                          selectedMonth
                        }
                        onChange={(
                          e
                        ) =>
                          setSelectedMonth(
                            e.target
                              .value
                          )
                        }
                      >
                        {Array.from(
                          {
                            length: 12,
                          },
                          (
                            _,
                            index
                          ) => {
                            const month =
                              String(
                                index +
                                  1
                              ).padStart(
                                2,
                                "0"
                              );

                            return (
                              <option
                                key={
                                  month
                                }
                                value={
                                  month
                                }
                              >
                                {
                                  index +
                                    1
                                }
                                월
                              </option>
                            );
                          }
                        )}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {periodType ===
                "date" && (
                <div
                  className="field"
                  style={{
                    marginTop: 18,
                    maxWidth: 300,
                  }}
                >
                  <label>
                    확인할 날짜
                  </label>

                  <input
                    className="input"
                    type="date"
                    value={
                      selectedDate
                    }
                    onChange={(e) =>
                      selectDate(
                        e.target
                          .value
                      )
                    }
                  />
                </div>
              )}

              <div
                style={{
                  marginTop: 12,
                  color: "#667085",
                  fontSize: 14,
                }}
              >
                현재 통계:{" "}
                <strong>
                  {getPeriodTitle()}
                </strong>
              </div>
            </div>

            {/* =========================
                기간 통계
            ========================= */}

            {periodType !==
              "date" && (
              <>
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
                    {getPeriodTitle()}
                  </div>

                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 700,
                      marginTop: 6,
                    }}
                  >
                    총{" "}
                    {
                      periodAttendance.length
                    }
                    일 출결 기록
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      color:
                        "#667085",
                      fontSize: 14,
                    }}
                  >
                    저장된 날짜의 출결
                    데이터를 합산했습니다.
                  </div>
                </div>

                <div
                  className="cards"
                  style={{
                    marginTop: 18,
                  }}
                >
                  {statusList.map(
                    (status) => (
                      <div
                        className="card"
                        key={status}
                      >
                        <div className="card-title">
                          {status}
                        </div>

                        <div
                          className="number"
                          style={{
                            color:
                              statusColor[
                                status
                              ],
                          }}
                        >
                          {
                            periodStats[
                              status
                            ]
                          }
                        </div>

                        <div
                          style={{
                            marginTop: 6,
                            color:
                              "#98a2b3",
                            fontSize: 13,
                          }}
                        >
                          명
                        </div>
                      </div>
                    )
                  )}
                </div>

                <div
                  className="card"
                  style={{
                    marginTop: 18,
                  }}
                >
                  <div className="card-title">
                    {getPeriodTitle()}{" "}
                    출석률
                  </div>

                  <div className="number">
                    {periodTotal >
                    0
                      ? `${periodRate}%`
                      : "-"}
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      color:
                        "#667085",
                      fontSize: 14,
                    }}
                  >
                    출석 횟수를 전체 출결
                    횟수로 나누어 계산했습니다.
                  </div>
                </div>

                {/* =========================
                    기간별 학생 통계
                ========================= */}

                <div
                  className="table-card"
                  style={{
                    marginTop: 18,
                  }}
                >
                  <h3
                    style={{
                      marginTop: 0,
                    }}
                  >
                    {getPeriodTitle()}{" "}
                    학생별 출결
                  </h3>

                  {classStudents.length ===
                  0 ? (
                    <div className="notice">
                      등록된 학생이 없습니다.
                      <br />
                      학생 관리에서 학생을
                      먼저 등록해주세요.
                    </div>
                  ) : (
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
                            출석
                          </th>

                          <th>
                            지각
                          </th>

                          <th>
                            조퇴
                          </th>

                          <th>
                            결석
                          </th>

                          <th>
                            공결
                          </th>

                          <th>
                            병결
                          </th>

                          <th>
                            출석률
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {periodStudentStats.map(
                          (
                            student
                          ) => (
                            <tr
                              key={`${student.id}-${student.number}`}
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
                                {
                                  student
                                    .stats
                                    .출석
                                }
                              </td>

                              <td>
                                {
                                  student
                                    .stats
                                    .지각
                                }
                              </td>

                              <td>
                                {
                                  student
                                    .stats
                                    .조퇴
                                }
                              </td>

                              <td>
                                {
                                  student
                                    .stats
                                    .결석
                                }
                              </td>

                              <td>
                                {
                                  student
                                    .stats
                                    .공결
                                }
                              </td>

                              <td>
                                {
                                  student
                                    .stats
                                    .병결
                                }
                              </td>

                              <td>
                                {student.total >
                                0
                                  ? `${student.rate}%`
                                  : "-"}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}

            {/* =========================
                날짜별 통계
            ========================= */}

            {periodType ===
              "date" && (
              <>
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
                    선택한 출결 날짜
                  </div>

                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      marginTop: 6,
                    }}
                  >
                    {formatDate(
                      selectedDate
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      color:
                        "#667085",
                      fontSize: 14,
                    }}
                  >
                    {selectedAttendance
                      ? "해당 날짜의 출결 기록이 있습니다."
                      : "해당 날짜에는 저장된 출결 기록이 없습니다."}
                  </div>
                </div>

                <div
                  className="cards"
                  style={{
                    marginTop: 18,
                  }}
                >
                  {statusList.map(
                    (status) => (
                      <div
                        className="card"
                        key={status}
                      >
                        <div className="card-title">
                          {status}
                        </div>

                        <div
                          className="number"
                          style={{
                            color:
                              statusColor[
                                status
                              ],
                          }}
                        >
                          {
                            dailyStats[
                              status
                            ]
                          }
                        </div>

                        <div
                          style={{
                            marginTop: 6,
                            color:
                              "#98a2b3",
                            fontSize: 13,
                          }}
                        >
                          명
                        </div>
                      </div>
                    )
                  )}
                </div>

                <div
                  className="card"
                  style={{
                    marginTop: 18,
                  }}
                >
                  <div className="card-title">
                    {formatDate(
                      selectedDate
                    )}{" "}
                    출석률
                  </div>

                  <div className="number">
                    {dailyTotal >
                    0
                      ? `${dailyRate}%`
                      : "-"}
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      color:
                        "#667085",
                      fontSize: 14,
                    }}
                  >
                    선택한 날짜의 아침 조회
                    출결만 계산했습니다.
                  </div>
                </div>

                {/* =========================
                    날짜별 학생
                ========================= */}

                <div
                  className="table-card"
                  style={{
                    marginTop: 18,
                  }}
                >
                  <h3
                    style={{
                      marginTop: 0,
                    }}
                  >
                    {formatDate(
                      selectedDate
                    )}{" "}
                    학생별 출결
                  </h3>

                  {classStudents.length ===
                  0 ? (
                    <div className="notice">
                      등록된 학생이 없습니다.
                    </div>
                  ) : (
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
                            출결
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {classStudents.map(
                          (
                            student
                          ) => {
                            const record =
                              selectedAttendance?.students.find(
                                (
                                  item
                                ) =>
                                  item.id ===
                                  student.id
                              );

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
                                  {record ? (
                                    <span
                                      style={{
                                        display:
                                          "inline-block",
                                        padding:
                                          "5px 10px",
                                        borderRadius:
                                          8,
                                        background:
                                          "#fff",
                                        border:
                                          "1px solid #e5e7eb",
                                        color:
                                          statusColor[
                                            record
                                              .status
                                          ],
                                        fontWeight:
                                          700,
                                      }}
                                    >
                                      {
                                        record.status
                                      }
                                    </span>
                                  ) : (
                                    <span
                                      style={{
                                        color:
                                          "#98a2b3",
                                      }}
                                    >
                                      기록 없음
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}

            {/* =========================
                날짜별 출결 기록
            ========================= */}

            <div
              className="table-card"
              style={{
                marginTop: 18,
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                }}
              >
                날짜별 출결 기록
              </h3>

              <p
                className="sub"
                style={{
                  marginBottom: 15,
                }}
              >
                날짜를 클릭하면 해당 날짜의
                출결을 확인할 수 있습니다.
              </p>

              {classAttendance.length ===
              0 ? (
                <div className="notice">
                  저장된 출결 기록이 없습니다.
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>
                        날짜
                      </th>

                      <th>
                        요일
                      </th>

                      <th>
                        출석
                      </th>

                      <th>
                        지각
                      </th>

                      <th>
                        조퇴
                      </th>

                      <th>
                        결석
                      </th>

                      <th>
                        공결
                      </th>

                      <th>
                        병결
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {classAttendance.map(
                      (record) => {
                        const stats =
                          getDailyStats(
                            record
                          );

                        const isExpanded =
                          expandedDate ===
                          record.date;

                        const isSelected =
                          selectedDate ===
                          record.date;

                        return (
                          <Fragment
                            key={
                              record.id
                            }
                          >
                            <tr
                              onClick={() =>
                                toggleDate(
                                  record.date
                                )
                              }
                              style={{
                                cursor:
                                  "pointer",
                                background:
                                  isSelected
                                    ? "#f8faff"
                                    : undefined,
                              }}
                            >
                              <td>
                                <strong>
                                  {formatDate(
                                    record.date
                                  )}
                                </strong>
                              </td>

                              <td>
                                {getWeekday(
                                  record.date
                                )}
                              </td>

                              <td>
                                {
                                  stats
                                    .출석
                                }
                              </td>

                              <td>
                                {
                                  stats
                                    .지각
                                }
                              </td>

                              <td>
                                {
                                  stats
                                    .조퇴
                                }
                              </td>

                              <td>
                                {
                                  stats
                                    .결석
                                }
                              </td>

                              <td>
                                {
                                  stats
                                    .공결
                                }
                              </td>

                              <td>
                                {
                                  stats
                                    .병결
                                }
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr>
                                <td
                                  colSpan={8}
                                  style={{
                                    padding:
                                      0,
                                    background:
                                      "#f8faff",
                                  }}
                                >
                                  <div
                                    style={{
                                      padding:
                                        20,
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontSize:
                                          16,
                                        fontWeight:
                                          700,
                                        marginBottom:
                                          12,
                                      }}
                                    >
                                      {formatDate(
                                        record.date
                                      )}{" "}
                                      출결 상세
                                    </div>

                                    {record
                                      .students
                                      .length ===
                                    0 ? (
                                      <div className="notice">
                                        해당 날짜의
                                        학생 출결
                                        데이터가
                                        없습니다.
                                      </div>
                                    ) : (
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
                                          {[
                                            ...record.students,
                                          ]
                                            .sort(
                                              (
                                                a,
                                                b
                                              ) =>
                                                a.number -
                                                b.number
                                            )
                                            .map(
                                              (
                                                student
                                              ) => (
                                                <tr
                                                  key={`${record.id}-${student.id}`}
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
                                                    <span
                                                      style={{
                                                        display:
                                                          "inline-block",
                                                        padding:
                                                          "5px 10px",
                                                        borderRadius:
                                                          8,
                                                        background:
                                                          "#fff",
                                                        border:
                                                          "1px solid #e5e7eb",
                                                        color:
                                                          statusColor[
                                                            student
                                                              .status
                                                          ],
                                                        fontWeight:
                                                          700,
                                                      }}
                                                    >
                                                      {
                                                        student.status
                                                      }
                                                    </span>
                                                  </td>
                                                </tr>
                                              )
                                            )}
                                        </tbody>
                                      </table>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      }
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}