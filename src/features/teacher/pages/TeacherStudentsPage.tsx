import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Users } from "lucide-react";

type Student = {
  id: string;
  name: string;
  level: string;
  target: string;
  lastActive: string;
};

const STUB_STUDENTS: Student[] = [
  { id: "s1", name: "Napat Suwannakorn", level: "A2", target: "B1", lastActive: "Today" },
  { id: "s2", name: "Wanjiku Kamau", level: "B1", target: "B2", lastActive: "Yesterday" },
  { id: "s3", name: "Supakorn Thanakit", level: "A1", target: "A2", lastActive: "3 days ago" },
];

export default function TeacherStudentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-semantic-text">{t("teacher.students")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {STUB_STUDENTS.length} students
          </p>
        </div>
      </div>

      {STUB_STUDENTS.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-base font-medium text-semantic-text">
            {t("teacher.noStudents")}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Level</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Target</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Last Active</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {STUB_STUDENTS.map((student) => (
                <tr
                  key={student.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/teacher/students/${student.id}`)}
                >
                  <td className="px-4 py-3 font-medium text-semantic-text">{student.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">
                      {student.level}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                      {student.target}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{student.lastActive}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/teacher/students/${student.id}`);
                      }}
                      className="text-primary-600 dark:text-primary-400 hover:underline text-xs font-medium"
                    >
                      View profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
