"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function login() {
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    localStorage.setItem(
      "schoolcheck_user",
      JSON.stringify({
        email,
        name: "김선생",
        role: "TEACHER",
      })
    );

    router.push("/");
  }

  return (
    <main className="login-page">
      <div className="login-box">
        <h1>SchoolCheck</h1>

        <p className="sub">
          스마트 학교 출결 관리 시스템
        </p>

        <div className="field">
          <label>이메일</label>

          <input
            className="input"
            type="email"
            placeholder="teacher@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="field">
          <label>비밀번호</label>

          <input
            className="input"
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <div className="error">{error}</div>}

        <button
          className="btn"
          style={{ width: "100%" }}
          onClick={login}
        >
          로그인
        </button>

        <p style={{ marginTop: 20 }}>
          계정이 없나요?{" "}
          <a href="/signup" style={{ color: "#2563eb" }}>
            회원가입
          </a>
        </p>
      </div>
    </main>
  );
}