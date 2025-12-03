import React, { useEffect, useState, useRef } from "react";

// 英単語タイピング練習アプリ
// - 単語（英語 ⇄ 日本語）を自由に追加・編集・削除
// - CSVのインポート/エクスポート（簡易）
// - 練習モード：日本語を見て英単語をタイプする（正誤判定、経過時間、正確度）
// - 簡易スペースドリピティション（レベル管理：1-5）
// - localStorageに保存

export default function App() {
  const [words, setWords] = useState([]); // {id, en, ja, level, lastPracticed}
  const [enInput, setEnInput] = useState("");
  const [jaInput, setJaInput] = useState("");
  const [query, setQuery] = useState("");

  const [mode, setMode] = useState("idle"); // idle | practicing | review
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTarget, setCurrentTarget] = useState(null);
  const [typed, setTyped] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [stats, setStats] = useState({ total: 0, correct: 0, wrong: 0 });
  const inputRef = useRef(null);

  useEffect(() => {
    const raw = localStorage.getItem("et_words");
    if (raw) {
      try {
        setWords(JSON.parse(raw));
      } catch (e) {
        setWords([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("et_words", JSON.stringify(words));
  }, [words]);

  // ユーティリティ
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function resetForm() {
    setEnInput("");
    setJaInput("");
  }

  function addWord() {
    if (!enInput.trim() || !jaInput.trim()) return;
    const newWord = {
      id: uid(),
      en: enInput.trim(),
      ja: jaInput.trim(),
      level: 3, // 初期は中間レベル
      lastPracticed: null,
    };
    setWords((s) => [newWord, ...s]);
    resetForm();
  }

  function updateWord(id, patch) {
    setWords((s) => s.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }

  function removeWord(id) {
    setWords((s) => s.filter((w) => w.id !== id));
  }

  // CSV import/export
  function exportCSV() {
    const header = "en,ja,level";
    const lines = words.map((w) => `${escapeCsv(w.en)},${escapeCsv(w.ja)},${w.level}`);
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "words.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function escapeCsv(s) {
    if (s.includes(",") || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  function importCSV(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const parsed = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        if (cols.length >= 2) {
          parsed.push({ id: uid(), en: cols[0], ja: cols[1], level: cols[2] ? Number(cols[2]) || 3 : 3, lastPracticed: null });
        }
      }
      if (parsed.length > 0) setWords((s) => [...parsed, ...s]);
    };
    reader.readAsText(file, "UTF-8");
  }

  function parseCsvLine(line) {
    const res = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          cur += ch;
        }
      } else {
        if (ch === ',') {
          res.push(cur);
          cur = "";
        } else if (ch === '"') {
          inQuotes = true;
        } else {
          cur += ch;
        }
      }
    }
    res.push(cur);
    return res;
  }

  // 練習ロジック
  function startPractice() {
    if (words.length === 0) return;
    // 練習候補をレベルと最終実施日でソート（簡易）
    const sorted = [...words].sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level; // レベル低いもの優先
      return (a.lastPracticed || 0) - (b.lastPracticed || 0);
    });
    setWords(sorted);
    setMode("practicing");
    setCurrentIndex(0);
    setStats({ total: 0, correct: 0, wrong: 0 });
    setTyped("");
    setStartTime(null);
    setCurrentTarget(sorted[0]);
    setTimeout(() => inputRef.current && inputRef.current.focus(), 50);
  }

  function stopPractice() {
    setMode("idle");
    setCurrentTarget(null);
    setTyped("");
    setStartTime(null);
  }

  function submitAnswer() {
    if (!currentTarget) return;
    const correct = typed.trim().toLowerCase() === currentTarget.en.trim().toLowerCase();
    const elapsed = startTime ? (Date.now() - startTime) / 1000 : 0;
    setStats((s) => ({ total: s.total + 1, correct: s.correct + (correct ? 1 : 0), wrong: s.wrong + (correct ? 0 : 1) }));
    // レベル更新（簡易）：正解ならレベルを上げる、間違いなら下げる
    updateWord(currentTarget.id, { level: Math.max(1, Math.min(5, currentTarget.level + (correct ? 1 : -1))), lastPracticed: Date.now() });
    // 次へ
    const nextIdx = currentIndex + 1;
    if (nextIdx >= words.length) {
      // 終了
      setMode("idle");
      setCurrentTarget(null);
      setTyped("");
      setStartTime(null);
    } else {
      setCurrentIndex(nextIdx);
      setCurrentTarget(words[nextIdx]);
      setTyped("");
      setStartTime(null);
      setTimeout(() => inputRef.current && inputRef.current.focus(), 50);
    }
  }

  useEffect(() => {
    if (mode === "practicing" && currentTarget) {
      setStartTime(Date.now());
    }
  }, [currentTarget, mode]);

  // 入力ハンドラ
  function handleTypedChange(e) {
    setTyped(e.target.value);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      submitAnswer();
    }
  }

  // フィルタリング
  const filtered = words.filter((w) => w.en.includes(query) || w.ja.includes(query));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">英単語タイピング練習アプリ</h1>
          <p className="mt-1 text-sm text-gray-600">自分で単語を追加してタイピングで覚えよう。CSVで出入力できます。</p>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* サイドバー：単語追加・CSV */}
          <section className="md:col-span-1 bg-white p-4 rounded-2xl shadow-sm">
            <h2 className="font-semibold">単語を追加</h2>
            <div className="mt-3">
              <label className="block text-xs">英語</label>
              <input value={enInput} onChange={(e) => setEnInput(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="apple" />
              <label className="block text-xs mt-2">日本語</label>
              <input value={jaInput} onChange={(e) => setJaInput(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="りんご" />
              <div className="flex gap-2 mt-3">
                <button onClick={addWord} className="flex-1 py-2 rounded-2xl bg-sky-500 text-white font-medium">追加</button>
                <button onClick={() => { setEnInput(""); setJaInput(""); }} className="py-2 px-3 rounded-2xl border">クリア</button>
              </div>
            </div>

            <hr className="my-4" />
            <h3 className="font-semibold">CSV</h3>
            <div className="mt-2 text-sm text-gray-700">
              <p>CSVフォーマット: en,ja,level</p>
              <div className="flex gap-2 mt-2">
                <button onClick={exportCSV} className="py-2 px-3 rounded-2xl border">エクスポート</button>
                <label className="py-2 px-3 rounded-2xl border cursor-pointer">
                  インポート
                  <input className="hidden" type="file" accept=".csv,text/csv" onChange={(e) => importCSV(e.target.files[0])} />
                </label>
              </div>
            </div>

            <hr className="my-4" />
            <div className="text-sm text-gray-700">
              <p>練習モード</p>
              <div className="flex gap-2 mt-2">
                <button onClick={startPractice} className="flex-1 py-2 rounded-2xl bg-emerald-500 text-white">練習開始</button>
                <button onClick={stopPractice} className="py-2 px-3 rounded-2xl border">停止</button>
              </div>
              <p className="mt-2">状態: <strong>{mode}</strong></p>
              <p className="mt-1 text-xs text-gray-500">練習は自動でレベル調整されます（簡易アルゴリズム）。</p>
            </div>
          </section>

          {/* メイン：練習画面 */}
          <section className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold">練習エリア</h2>
                <p className="text-sm text-gray-600">日本語を見て英語をタイプ。Enterで送信。</p>
              </div>
              <div className="text-sm">
                <p>問題数: {words.length}</p>
                <p>進捗: {stats.total} 回中 {stats.correct} 正解</p>
              </div>
            </div>

            <div className="mt-6">
              {mode !== "practicing" && (
                <div className="text-center py-12 border-dashed border-2 border-gray-200 rounded-2xl">
                  <p className="text-lg">練習を開始してね！</p>
                </div>
              )}

              {mode === "practicing" && currentTarget && (
                <div>
                  <div className="bg-gray-50 p-6 rounded-2xl">
                    <div className="text-sm text-gray-500">日本語</div>
                    <div className="text-2xl font-bold mt-2">{currentTarget.ja}</div>
                    <div className="mt-4 text-xs text-gray-500">レベル: {currentTarget.level}</div>
                  </div>

                  <div className="mt-4">
                    <input ref={inputRef} value={typed} onChange={handleTypedChange} onKeyDown={handleKeyDown} className="w-full p-3 border rounded-2xl text-lg" placeholder="ここに英語を入力してEnter" />
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button onClick={submitAnswer} className="py-2 px-4 rounded-2xl bg-sky-500 text-white">送信</button>
                    <button onClick={() => { setTyped(currentTarget.en); }} className="py-2 px-4 rounded-2xl border">答えを見る</button>
                  </div>
                </div>
              )}

              {mode === "idle" && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-2xl">
                    <h3 className="font-semibold">今日の成績</h3>
                    <p className="mt-2">合計: {stats.total}</p>
                    <p>正解: {stats.correct}</p>
                    <p>正答率: {stats.total ? Math.round((stats.correct / stats.total) * 100) + '%' : '---'}</p>
                  </div>

                  <div className="p-4 border rounded-2xl">
                    <h3 className="font-semibold">操作ヒント</h3>
                    <ul className="mt-2 text-sm list-disc list-inside text-gray-600">
                      <li>単語を追加して練習開始を押すだけ！</li>
                      <li>Enterで答えを送信、回答後は自動で次の問題へ移動する。</li>
                      <li>CSVで単語をまとめて読み込める。</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 単語リスト */}
          <section className="md:col-span-3 bg-white p-4 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">単語リスト</h2>
              <div className="flex items-center gap-2">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="検索 (英語 or 日本語)" className="p-2 border rounded" />
                <button onClick={() => { setWords([]); localStorage.removeItem('et_words'); }} className="py-2 px-3 border rounded">全削除</button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-sm text-gray-500 border-b">
                    <th className="py-2">英語</th>
                    <th className="py-2">日本語</th>
                    <th className="py-2">レベル</th>
                    <th className="py-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((w) => (
                    <tr key={w.id} className="border-b">
                      <td className="py-2 align-top">
                        <input value={w.en} onChange={(e) => updateWord(w.id, { en: e.target.value })} className="p-1 border rounded" />
                      </td>
                      <td className="py-2 align-top">
                        <input value={w.ja} onChange={(e) => updateWord(w.id, { ja: e.target.value })} className="p-1 border rounded" />
                      </td>
                      <td className="py-2 align-top">
                        <select value={w.level} onChange={(e) => updateWord(w.id, { level: Number(e.target.value) })} className="p-1 border rounded">
                          <option value={1}>1 (要復習)</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                          <option value={4}>4</option>
                          <option value={5}>5 (習熟)</option>
                        </select>
                      </td>
                      <td className="py-2 align-top">
                        <div className="flex gap-2">
                          <button onClick={() => { navigator.clipboard && navigator.clipboard.writeText(w.en); }} className="py-1 px-2 border rounded">コピー</button>
                          <button onClick={() => removeWord(w.id)} className="py-1 px-2 border rounded">削除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-500">単語がありません</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>

        <footer className="mt-6 text-center text-sm text-gray-500">作った人: あなた。改善したい点あったら言ってね！</footer>
      </div>
    </div>
  );
}
