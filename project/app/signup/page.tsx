"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Signup() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("TEACHER");
  const [message, setMessage] = useState("");

  function signup() {
    if (!name || !email || !password) {
      setMessage("모든 항목을 입력해주세요.");
      return;
    }

    localStorage.setItem(
      "schoolcheck_account",
      JSON.stringify({
        name,
        email,
        password,
        role,
      })
    );

    alert("회원가입이 완료되었습니다.");

    router.push("/login");
  }

  return (
    <main className="login-page">
      <div className="login-box">
        <h1>회원가입</h1>

        <div className="field">
          <label>이름</label>

          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름"
          />
        </div>

        <div className="field">
          <label>이메일</label>

          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
          />
        </div>

        <div className="field">
          <label>비밀번호</label>

          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
          />
        </div>

        <div className="field">
          <label>역할</label>

          <select
            className="select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="TEACHER">교사</option>
            <option value="STUDENT">학생</option>
          </select>
        </div>

        {message && <div className="error">{message}</div>}

        <button
          className="btn"
          style={{ width: "100%" }}
          onClick={signup}
        >
          회원가입
        </button>

        <p style={{ marginTop: 20 }}>
          이미 계정이 있나요?{" "}
          <a href="/login" style={{ color: "#2563eb" }}>
            로그인
          </a>
        </p>
      </div>
    </main>
  );
}