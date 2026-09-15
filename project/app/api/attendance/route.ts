import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Attendance from "@/models/Attendance";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const grade = searchParams.get("grade");
    const classNumber = searchParams.get("classNumber");
    const date = searchParams.get("date");

    const query: Record<string, unknown> = {};

    if (grade) {
      query.grade = Number(grade);
    }

    if (classNumber) {
      query.classNumber = Number(classNumber);
    }

    if (date) {
      query.date = date;
    }

    const records = await Attendance.find(query)
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return NextResponse.json(records);
  } catch (error) {
    console.error("출결 조회 오류:", error);

    return NextResponse.json(
      { message: "출결 데이터를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const { grade, classNumber, date, students } = body;

    if (
      typeof grade !== "number" ||
      typeof classNumber !== "number" ||
      typeof date !== "string" ||
      !Array.isArray(students)
    ) {
      return NextResponse.json(
        { message: "잘못된 출결 데이터입니다." },
        { status: 400 }
      );
    }

    const result = await Attendance.findOneAndUpdate(
      {
        grade,
        classNumber,
        date,
      },
      {
        grade,
        classNumber,
        date,
        students,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("출결 저장 오류:", error);

    return NextResponse.json(
      { message: "출결 데이터를 저장하지 못했습니다." },
      { status: 500 }
    );
  }
}