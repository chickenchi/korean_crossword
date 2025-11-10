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

export const create_cross = () => {
  for (let i = 0; i <= 10; i++) {
    // 초기일 경우 제약이 없으므로 그냥 생성
    if (i == 0) {
      createRandomTile(i, sharedList);
      continue;
    } else {
      // 기존 셀 상태 얕은 복사(숫자라서 깊은 복사 효과)
      /** 가로와 세로를 체크를 위한 임시 연결 리스트 */
      let list = LinkedList.fromArray(
        sharedList.toArray().map((n) => n.getValue())
      );

      createRandomTile(i, list);
    }
  }

  restrictCrossPoint();

  showStatus();

  return;
};

/*
ㅁㅁㅁ
ㅁxㅁ
ㅁㅁㅁ
*/

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
        sharedList.removeAt(i * 8 + j);
      }
    }
  return;
};

const createRandomTile = (index: number, list: LinkedList<number>) => {
  // (가능한 최대 길이) - (제한된 셀의 개수) = 받아온 리스트의 크기
  const randomValue = list.toArray().map((n) => n.getValue())[
    Math.floor(Math.random() * list.count())
  ];

  // 1차원을 2차원으로 변경
  // 행
  const row = Math.floor(randomValue / 8);
  // 열
  const col = randomValue % 8;

  // 방향 설정
  let dir: "horizontal" | "vertical";

  // 가로 끝 -> 세로만 가능
  if (col == 7) {
    dir = "vertical";
  }
  // 세로 끝 -> 가로만 가능
  else if (row == 7) {
    dir = "horizontal";
  }
  // 나머지 -> 랜덤
  else {
    dir = Math.random() < 0.5 ? "horizontal" : "vertical";
  }

  let len;

  // 2~6 중의 수지만 오버플로 방지
  if (dir == "vertical")
    len = Math.floor(Math.random() * Math.min(7 - row, 5)) + 2;
  else len = Math.floor(Math.random() * Math.min(7 - col, 5)) + 2;

  // 등록
  for (let i = 0; i < len; i++) {
    if (dir == "vertical") grid[row + i][col] = `tile-${index}`;
    else grid[row][col + i] = `tile-${index}`;
  }

  // 공통 제약 셀 제거
  // 세로
  if (dir == "vertical") {
    if (row + len <= 7) {
      sharedList.removeAt((row + len) * 8 + col);
    }
    if (row - 1 >= 0) {
      sharedList.removeAt((row - 1) * 8 + col);
    }
  } else {
    if (col + len <= 7) {
      sharedList.removeAt(row * 8 + (col + len));
    }
    if (col - 1 >= 0) {
      sharedList.removeAt(row * 8 + (col - 1));
    }
  }

  // 랜덤으로 작성된 내용 적용
  nodes.set(`tile-${index}`, { dir: dir, len: len, axis: [row, col] });
};

const showStatus = () => {
  for (let row = 0; row < 8; row++) {
    const line = grid[row]
      .map((cell) => (cell === null ? "--X--" : cell))
      .join(" ");
    console.log(line + "\n"); // 각 행 뒤에 줄 바꿈 추가
    console.log("\n"); // 각 행 뒤에 줄 바꿈 추가
  }

  let a = sharedList.toArray().map((n) => n.getValue());
  let w = "";

  for (let i = 0; i < sharedList.count(); i++) {
    w += `${a[i]} `;
  }
  console.log(w);
};
