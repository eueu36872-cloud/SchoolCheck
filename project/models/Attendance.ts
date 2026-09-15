import mongoose, {
  Schema,
  Model,
} from "mongoose";

export type AttendanceStatus =
  | "출석"
  | "지각"
  | "결석"
  | "조퇴"
  | "공결"
  | "병결";

export interface IAttendanceStudent {
  studentId: number;
  number: number;
  name: string;
  status: AttendanceStatus;
}

export interface IAttendance {
  grade: number;
  classNumber: number;
  date: string;
  students: IAttendanceStudent[];
}

const AttendanceStudentSchema =
  new Schema<IAttendanceStudent>(
    {
      studentId: {
        type: Number,
        required: true,
      },

      number: {
        type: Number,
        required: true,
      },

      name: {
        type: String,
        required: true,
      },

      status: {
        type: String,
        enum: [
          "출석",
          "지각",
          "결석",
          "조퇴",
          "공결",
          "병결",
        ],
        required: true,
      },
    },
    {
      _id: false,
    }
  );

const AttendanceSchema =
  new Schema<IAttendance>(
    {
      grade: {
        type: Number,
        required: true,
      },

      classNumber: {
        type: Number,
        required: true,
      },

      date: {
        type: String,
        required: true,
      },

      students: {
        type: [
          AttendanceStudentSchema,
        ],
        required: true,
      },
    },
    {
      timestamps: true,
      collection: "attendances",
    }
  );

// 같은 학급 + 같은 날짜에
// 출결 기록이 하나만 존재하도록 설정
AttendanceSchema.index(
  {
    grade: 1,
    classNumber: 1,
    date: 1,
  },
  {
    unique: true,
  }
);

const Attendance: Model<IAttendance> =
  mongoose.models.Attendance ||
  mongoose.model<IAttendance>(
    "Attendance",
    AttendanceSchema
  );

export default Attendance;