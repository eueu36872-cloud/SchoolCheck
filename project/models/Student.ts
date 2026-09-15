import mongoose, {
  Schema,
  Model,
} from "mongoose";

export interface IStudent {
  studentId: number;
  number: number;
  name: string;
  email?: string;
  grade: number;
  classNumber: number;
}

const StudentSchema =
  new Schema<IStudent>(
    {
      studentId: {
        type: Number,
        required: true,
        unique: true,
      },

      number: {
        type: Number,
        required: true,
      },

      name: {
        type: String,
        required: true,
        trim: true,
      },

      email: {
        type: String,
        trim: true,
      },

      grade: {
        type: Number,
        required: true,
      },

      classNumber: {
        type: Number,
        required: true,
      },
    },
    {
      timestamps: true,
      collection: "students",
    }
  );

const Student: Model<IStudent> =
  mongoose.models.Student ||
  mongoose.model<IStudent>(
    "Student",
    StudentSchema
  );

export default Student;