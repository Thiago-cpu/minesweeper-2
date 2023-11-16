/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import { create } from "zustand";
import config from "./config";
const size = config.size;
const minesAmount = config.mines;

const MINE = "💣";
const EMPTY_CELL = "";

type Mine = typeof MINE;
type EmptyCell = typeof EMPTY_CELL;

export interface Cords {
  x: number;
  y: number;
}

function rotateDegAccordingCenter(
  pointToRotate: Cords,
  center: number,
  degrees: number,
): Cords {
  const originPoint = {
    x: center,
    y: center,
  };
  const radians = (degrees * Math.PI) / 180;

  // Calculate the new coordinates
  const newX =
    Math.cos(radians) * (pointToRotate.x - originPoint.x) -
    Math.sin(radians) * (pointToRotate.y - originPoint.y) +
    originPoint.x;

  const newY =
    Math.sin(radians) * (pointToRotate.x - originPoint.x) +
    Math.cos(radians) * (pointToRotate.y - originPoint.y) +
    originPoint.y;

  const roundedX = parseFloat(newX.toFixed(10));
  const roundedY = parseFloat(newY.toFixed(10));

  return { x: roundedX, y: roundedY };
}

class Cell {
  value: number | Mine | EmptyCell;
  initialCol: number;
  initialRow: number;
  open: boolean;
  hasFlag: boolean;
  animation: {
    to: Cords;
  };

  constructor({
    value,
    cords,
  }: {
    value: number | Mine | EmptyCell;
    cords: Cords;
  }) {
    this.value = value;
    this.initialCol = cords.x;
    this.initialRow = cords.y;
    this.open = false;
    this.hasFlag = false;
    this.animation = {
      to: {
        x: 0,
        y: 0,
      },
    };
  }

  hide() {
    this.open = false;
  }
  show() {
    this.open = true;
  }

  get isMine() {
    return this.value === MINE;
  }

  toggleFlag() {
    this.hasFlag = !this.hasFlag;
  }

  rotate(degrees: number, center: number, gap = 0) {
    const actualPoint = {
      x: this.initialCol * 32 + 16 + gap * this.initialCol,
      y: this.initialRow * 32 + 16 + gap * this.initialRow,
    };
    const nextPoint = rotateDegAccordingCenter(actualPoint, center, degrees);
    this.animation.to = {
      x: nextPoint.x - (this.initialCol * 32 + 16 + gap * this.initialCol),
      y: nextPoint.y - (this.initialRow * 32 + 16 + gap * this.initialRow),
    };
  }
}

const emptyBoard = (): Board =>
  Array.from({ length: size }, () =>
    Array(size)
      .fill(0)
      .map(() => new Cell({ value: EMPTY_CELL, cords: { x: 0, y: 0 } })),
  );

const doAroundCell = (
  board: Board,
  cell: Cell,
  cb: (c: Cell) => void,
): Board => {
  const { initialRow: y, initialCol: x } = cell;

  for (let i = y - 1; i <= y + 1; i++) {
    for (let j = x - 1; j <= x + 1; j++) {
      const targetCell = board?.[i]?.[j];
      if (targetCell) cb(targetCell);
    }
  }

  return board;
};

function doAdjacentCell(board: Board, cell: Cell, cb: (c: Cell) => void) {
  const { initialRow: y, initialCol: x } = cell;

  for (let i = y - 1; i <= y + 1; i++) {
    for (let j = x - 1; j <= x + 1; j++) {
      if (i !== y || j !== x) {
        const targetCell = board?.[i]?.[j];
        if (targetCell) cb(targetCell);
      }
    }
  }
}

const newRandomMine = (exceptCells: Cell[]) => {
  let x = exceptCells[0]?.initialCol ?? 0;
  let y = exceptCells[0]?.initialRow ?? 0;
  while (exceptCells.some((c) => c.initialCol === x && c.initialRow === y)) {
    x = Math.floor(Math.random() * size);
    y = Math.floor(Math.random() * size);
  }
  return new Cell({ value: MINE, cords: { x, y } });
};

const newBoard = (cords: Cords): Board => {
  const mines: Cell[] = [];
  const clickedCell = new Cell({ value: EMPTY_CELL, cords });
  while (mines.length < minesAmount)
    mines.push(newRandomMine([clickedCell, ...mines]));
  const boardWithoutValues = emptyBoard().map((row, y) =>
    row.map((cell, x) => {
      const cords = { x, y };
      const mine = mines.find(
        (mine) => mine.initialCol === cords.x && mine.initialRow === cords.y,
      );
      if (!mine) return new Cell({ value: EMPTY_CELL, cords });
      return mine;
    }),
  );

  const board = boardWithoutValues.map((row) =>
    row.map((cell) => {
      if (cell.isMine) return cell;
      let countMines = 0;
      doAroundCell(boardWithoutValues, cell, (c) => c.isMine && countMines++);
      return new Cell({
        value: countMines > 0 ? countMines : EMPTY_CELL,
        cords: { x: cell.initialCol, y: cell.initialRow },
      });
    }),
  );
  return board;
};

type Board = Cell[][];

export const GAME_STATES = {
  playing: "playing",
  default: "default",
  loose: "loose",
} as const;

type GAME_STATE = keyof typeof GAME_STATES;

interface MinesweeperState {
  game: GAME_STATE;
  board: Board;
  expand: boolean;
  rotate: (degrees: number) => void;
  startGame: (cords: Cords) => void;
  showCell: (cords: Cords, board: Board) => void;
  click: (cords: Cords) => void;
  rightClick: (cords: Cords) => void;
}

export const useMinesweeper = create<MinesweeperState>()((set, get) => ({
  game: GAME_STATES.default,
  board: emptyBoard(),
  expand: false,
  rotate: (degrees) =>
    set((state) => {
      if (state.game !== GAME_STATES.playing) return {};
      const center = state.expand ? size * 16 + 16 * 7 : size * 16;
      state.board.forEach((row) =>
        row.forEach((cell) => {
          cell.rotate(degrees, center, state.expand ? 16 : 0);
        }),
      );

      return { board: state.board };
    }),
  startGame: (cords) =>
    set(() => {
      const board = newBoard(cords);
      get().showCell(cords, board);
      return {
        board,
        game: GAME_STATES.playing,
      };
    }),
  showCell: (cords, board) => {
    const cellSelected = board[cords.y]?.[cords.x];
    if (!cellSelected || cellSelected.open) return;
    cellSelected.show();
    if (cellSelected.value === EMPTY_CELL)
      doAdjacentCell(
        board,
        cellSelected,
        (c) =>
          !c.open &&
          get().showCell(
            {
              x: c.initialCol,
              y: c.initialRow,
            },
            board,
          ),
      );
  },
  click: (cords) =>
    set((state) => {
      const board = state.board;
      const cellSelected = board[cords.y]?.[cords.x];
      if (
        state.game === GAME_STATES.loose ||
        cellSelected?.hasFlag ||
        cellSelected?.open
      )
        return {};
      if (state.game === GAME_STATES.default) {
        get().startGame(cords);
        return {};
      }
      if (!cellSelected) return {};
      get().showCell(cords, board);
      if (cellSelected.isMine) {
        return { board, game: GAME_STATES.loose };
      }
      return {
        board,
        expand:
          state.board.reduce(
            (prev, curr) =>
              prev + curr.reduce((p2, curr2) => p2 + Number(curr2.open), 0),
            0,
          ) >
          (size * size - minesAmount) * 0.7,
      };
    }),
  rightClick: (cords) =>
    set((state) => {
      const cellSelected = state.board[cords.y]?.[cords.x];
      if (!cellSelected || cellSelected.open) return {};
      cellSelected.toggleFlag();
      return { board: state.board };
    }),
}));
