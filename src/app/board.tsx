"use client";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import config from "./config";
import { type Cords, useMinesweeper } from "./useMinesweeper";

const size = config.size;

type Board = number[][];

const possibleDegrees = [90, -90, 180] as const;

const randomDegrees = () =>
  possibleDegrees[Math.floor(Math.random() * possibleDegrees.length)]!;

export default function Board() {
  const { gameState, board, rotate, onClickCell, rightClick } = useMinesweeper(
    (state) => ({
      gameState: state.game,
      board: state.board,
      rotate: state.rotate,
      onClickCell: state.click,
      rightClick: state.rightClick,
    }),
  );

  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleAnimationEnd = (ev: AnimationEvent) => {
      if (ev.animationName === "cell-move" && gameState === "playing") {
        rotate(randomDegrees());
      }
    };
    element.addEventListener("animationiteration", handleAnimationEnd);
    return () =>
      element.removeEventListener("animationiteration", handleAnimationEnd);
  }, [gameState, rotate]);

  const handleClick = (cords: Cords) => () => {
    onClickCell(cords);
  };

  const handleRightClick =
    (cords: Cords) => (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      rightClick(cords);
    };

  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
    >
      {board.map((row, y) =>
        row.map((cell, x) => {
          const isFirst = y === 0 && x === 0;
          return (
            <button
              key={`${x}-${y}`}
              onClick={handleClick({ x, y })}
              onContextMenu={handleRightClick({ x, y })}
              ref={isFirst ? ref : null}
              className={cn(
                "flex h-8 w-8 animate-cell-move items-center justify-center border border-red-400",
                {
                  "border-red-400": (x + y) % 2 === 0,
                  "border-green-400": (x + y) % 2 === 1,
                },
              )}
              style={{
                ["--from-x" as PropertyKey]: `${cell.animation.from.x}px`,
                ["--from-y" as PropertyKey]: `${cell.animation.from.y}px`,
                ["--to-x" as PropertyKey]: `${cell.animation.to.x}px`,
                ["--to-y" as PropertyKey]: `${cell.animation.to.y}px`,
              }}
            >
              {cell.open ? cell.value : cell.hasFlag && "🚩"}
            </button>
          );
        }),
      )}
    </div>
  );
}
