"use client";
import Board from "./board";

export default function Home() {
  return (
    <main
      onContextMenu={(e) => e.preventDefault()}
      className="flex min-h-screen items-center justify-center"
    >
      <Board />
    </main>
  );
}
