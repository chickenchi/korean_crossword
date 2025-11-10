import { LinkedList } from "@datastructures-js/linked-list";

interface NodeInfo {
  dir: "vertical" | "horizontal";
  len: number;
  axis: [number, number];
}

// 배열 셀 집합
/** 가로, 세로에서의 공통된 연결 리스트 */
const sharedList = new LinkedList<number>();
// 8열 8행에는 아래 방향, 오른 방향 고정이므로 올 수 없기에 64가 아니고 63이 왔다.
for (let i = 0; i < 63; i++) {
  sharedList.insertLast(i);
}

// 들어올 타일 집합
const nodes = new Map<string, NodeInfo>();

// 십자말풀이 배열
const grid: (string | null)[][] = Array(8)
  .fill(null)
  .map(() => Array(8).fill(null));

// 열 제한 배열
const colRestrictGrid: boolean[][] = Array(8)
  .fill(false)
  .map(() => Array(8).fill(false));

for (let i = 0; i < 8; i++) {
  colRestrictGrid[i][7] = true;
}

// 행 제한 배열
const rowRestrictGrid: boolean[][] = Array(8)
  .fill(false)
  .map(() => Array(8).fill(false));

for (let i = 0; i < 8; i++) {
  rowRestrictGrid[7][i] = true;
}

export const create_cross = () => {
  for (let i = 0; i <= 10; i++) {
    createRandomTile(i);
    if (i > 0) restrictCrossPoint();
  }
  showStatus();

  return;
};

const isEmptyCell = (r: number, c: number): boolean => {
  return r >= 0 && r < 8 && c >= 0 && c < 8 && grid[r][c] == null;
};

export const restrictCrossPoint = () => {
  for (let i = 0; i < 8; i++)
    for (let j = 0; j < 8; j++) {
      let upLeft: boolean =
        isEmptyCell(i - 1, j - 1) && grid[i - 1][j] && grid[i][j - 1]
          ? true
          : false;
      let upRight: boolean =
        isEmptyCell(i - 1, j + 1) && grid[i - 1][j] && grid[i][j + 1]
          ? true
          : false;
      let downLeft: boolean =
        isEmptyCell(i + 1, j - 1) && grid[i + 1][j] && grid[i][j - 1]
          ? true
          : false;
      let downRight: boolean =
        isEmptyCell(i + 1, j + 1) && grid[i + 1][j] && grid[i][j + 1]
          ? true
          : false;

      if (downRight || upRight || upLeft || downLeft) {
        sharedList.removeEach((node) => node.getValue() === i * 8 + j);
      }
    }
  return;
};

const createRandomTile = (index: number) => {
  let randomValue: number;

  // 1차원을 2차원으로 변경
  // 행
  let row: number;
  // 열
  let col: number;

  // 방향 설정
  let dir: "horizontal" | "vertical";

  // 단어 길이
  let len: number;

  while (true) {
    // (가능한 최대 길이) - (제한된 셀의 개수) = 받아온 리스트의 크기
    randomValue = sharedList.toArray().map((n) => n.getValue())[
      Math.floor(Math.random() * sharedList.count())
    ];

    row = Math.floor(randomValue / 8);
    col = randomValue % 8;

    if (colRestrictGrid[row][col] && rowRestrictGrid[row][col]) {
      sharedList.removeEach((node) => node.getValue() === row * 8 + col);
      continue;
    }

    // 가로 끝 -> 세로만 가능
    if (col == 7 || colRestrictGrid[row][col]) {
      dir = "vertical";
    }
    // 세로 끝 -> 가로만 가능
    else if (row == 7 || rowRestrictGrid[row][col]) {
      dir = "horizontal";
    }
    // 나머지 -> 랜덤
    else {
      dir = Math.random() < 0.5 ? "horizontal" : "vertical";
    }

    // 2~6 중의 수이지만(작성은 5까지만 나오지만 겹치는 경우 6자가 나옴) 오버플로 방지
    // 세로
    if (dir == "vertical") {
      // rowRestrict or notSharedList
      let limit: number;

      for (limit = 1; limit <= Math.min(7 - row, 4); limit++) {
        if (row + limit >= 8 || rowRestrictGrid[row + limit][col]) {
          break;
        }
      }

      limit--; // 반복문이 초과되든, rowRestrict 조건을 만족하든 간에 한 칸 빼야 함

      if (limit < 1) {
        sharedList.removeEach((node) => node.getValue() === row * 8 + col);
        continue;
      }

      len = Math.floor(Math.random() * limit) + 2;
    } else {
      // colRestrict or notSharedList
      let limit: number;

      for (limit = 1; limit <= Math.min(7 - col, 4); limit++) {
        if (col + limit >= 8 || colRestrictGrid[row][col + limit]) {
          break;
        }
      }

      limit--; // 반복문이 초과되든, rowRestrict 조건을 만족하든 간에 한 칸 빼야 함

      if (limit < 1) {
        sharedList.removeEach((node) => node.getValue() === row * 8 + col);
        continue;
      }

      len = Math.floor(Math.random() * limit) + 2;
    }

    break;
  }

  // 등록; 가로 혹은 세로 제약 추가
  for (let i = 0; i < len; i++) {
    if (dir == "vertical") {
      grid[row + i][col] = `tile-${index}`;

      for (let j = -1; j <= 1; j++) {
        if (col + j >= 0 && col + j < 8)
          rowRestrictGrid[row + i][col + j] = true;
      }
    } else {
      grid[row][col + i] = `tile-${index}`;

      for (let j = -1; j <= 1; j++) {
        if (row + j >= 0 && row + j < 8)
          colRestrictGrid[row + j][col + i] = true;
      }
    }
  }

  // 공통 제약 셀 제거
  // 세로
  if (dir == "vertical") {
    if (row + len <= 7) {
      sharedList.removeEach(
        (node) => node.getValue() === (row + len) * 8 + col
      );
      rowRestrictGrid[row + len][col] = true;
      colRestrictGrid[row + len][col] = true;
    }
    if (row - 1 >= 0) {
      sharedList.removeEach((node) => node.getValue() === (row - 1) * 8 + col);
      rowRestrictGrid[row - 1][col] = true;
      colRestrictGrid[row - 1][col] = true;
    }
  } else {
    if (col + len <= 7) {
      sharedList.removeEach(
        (node) => node.getValue() === row * 8 + (col + len)
      );
      rowRestrictGrid[row][col + len] = true;
      colRestrictGrid[row][col + len] = true;
    }
    if (col - 1 >= 0) {
      sharedList.removeEach((node) => node.getValue() === row * 8 + (col - 1));
      rowRestrictGrid[row][col - 1] = true;
      colRestrictGrid[row][col - 1] = true;
    }
  }

  // 랜덤으로 작성된 내용 적용
  nodes.set(`tile-${index}`, { dir: dir, len: len, axis: [row, col] });
};

const showStatus = () => {
  console.log("-- Result --");
  for (let row = 0; row < 8; row++) {
    const line = grid[row]
      .map((cell) => (cell === null ? "  .  " : " ㅁ "))
      .join(" ");
    console.log(line + "\n"); // 각 행 뒤에 줄 바꿈 추가
    console.log("\n"); // 각 행 뒤에 줄 바꿈 추가
  }

  //   console.log("-- Deep Result --");
  //   for (let row = 0; row < 8; row++) {
  //     const line = grid[row]
  //       .map((cell) => (cell === null ? "--X--" : cell))
  //       .join(" ");
  //     console.log(line + "\n"); // 각 행 뒤에 줄 바꿈 추가
  //     console.log("\n"); // 각 행 뒤에 줄 바꿈 추가
  //   }

  //   console.log("-- rowRestrictGrid --");
  //   for (let i = 0; i < 8; i++) {
  //     let line = "";
  //     for (let j = 0; j < 8; j++) {
  //       // 예시: row 제한이면 R, 아니면 -
  //       line += rowRestrictGrid[i][j] ? "R " : "- ";
  //     }
  //     console.log(line); // 한 행 출력
  //     console.log("\n"); // 추가 줄 바꿈
  //   }

  //   console.log("-- colRestrictGrid --");
  //   for (let i = 0; i < 8; i++) {
  //     let line = "";
  //     for (let j = 0; j < 8; j++) {
  //       line += colRestrictGrid[i][j] ? "C " : "- ";
  //     }
  //     console.log(line);
  //     console.log("\n");
  //   }
};
