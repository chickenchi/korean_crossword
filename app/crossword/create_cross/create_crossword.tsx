import { LinkedList } from "@datastructures-js/linked-list";
import { getRandomWord } from "../lib/get_random_word";
import { isPossiblePlace } from "../lib/is_possible_placement";

type Coord = { x: number; y: number };

export interface NodeInfo {
  dir: "vertical" | "horizontal";
  len: number;
  axis: [number, number];
  word: string;
  crossedNumbers: number[];
  crossedCoordinates: Coord[];
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

// 제외 단어 목록
const exclude: string[] = [];

const setup = () => {
  // 제외 단어 목록 초기화
  exclude.length = 0;

  // grid 초기화
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      grid[y][x] = null;
    }
  }

  // rowRestrictGrid, colRestrictGrid 초기화
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      rowRestrictGrid[y][x] = false;
      colRestrictGrid[y][x] = false;
    }
  }

  // 가장자리 제약
  for (let i = 0; i < 8; i++) {
    rowRestrictGrid[7][i] = true;
    colRestrictGrid[i][7] = true;
  }

  // sharedList 초기화
  sharedList.clear();

  for (let i = 0; i < 63; i++) {
    sharedList.insertLast(i);
  }

  // nodes 초기화
  nodes.clear();
};

export const create_crossword = async (): Promise<
  [(string | null)[][], Map<string, NodeInfo>]
> => {
  setup();

  await create_cross();
  await insert_crossword();

  console.log(nodes);

  return [grid, nodes];
};

const isAllTrue = (grid: boolean[][]) =>
  grid.every((row) => row.every((cell) => cell === true));

const create_cross = () => {
  for (let i = 0; i <= 19; i++) {
    if (!sharedList.count()) break;

    if (isAllTrue(rowRestrictGrid) && isAllTrue(colRestrictGrid)) break;

    createRandomTile(i);

    if (i > 0) {
      extending_nodes();
      restrictCrossPoint();
    }
  }
};

const extending_nodes = () => {
  for (const key of nodes.keys()) {
    for (let i = 0; i < 4; i++) {
      const value = nodes.get(key)!;

      let len = value.len;
      let dir = value.dir;

      let elX = value.axis[0];
      let elY = value.axis[1];

      let neighborX = [0, 0, -1, len];
      let neighborY = [-1, len, 0, 0];

      let index = Number(key.replace("tile-", ""));

      let x = elX + neighborX[i];
      let y = elY + neighborY[i];

      if (dir == "vertical" && !neighborY[i]) continue;
      if (dir == "horizontal" && !neighborX[i]) continue;

      // 외부 양끝에 겹치는 부분이 있으면
      if (x >= 0 && x < 8 && y >= 0 && y < 8 && grid[y][x]) {
        const mapKey = grid[y][x];

        if (mapKey) {
          insertCrossInfo(
            mapKey,
            x,
            y,
            index,
            value.crossedCoordinates,
            value.crossedNumbers
          ); // 겹침 부분 표시 후

          len++;

          // 초기 지점이면
          if (neighborX[i] == -1 || neighborY[i] == -1) {
            // 초기 지점 좌표 이동
            elX = elX + neighborX[i];
            elY = elY + neighborY[i];
          }

          // 제약
          for (let j = -1; j <= 1; j++) {
            switch (dir) {
              case "vertical":
                if (elX + j >= 0 && elX + j < 8)
                  rowRestrictGrid[elY][elX + j] = true;
                break;

              case "horizontal":
                if (elY + j >= 0 && elY + j < 8)
                  colRestrictGrid[elY + j][elX] = true;
                break;
            }
          }

          // 공통 제약 셀 제거
          // 세로
          if (dir == "vertical") {
            if (elY + len <= 7) {
              sharedList.removeEach(
                (node) => node.getValue() === (elY + len) * 8 + elX
              );
              rowRestrictGrid[elY + len][elX] = true;
              colRestrictGrid[elY + len][elX] = true;
            }
            if (elY - 1 >= 0) {
              sharedList.removeEach(
                (node) => node.getValue() === (elY - 1) * 8 + elX
              );
              rowRestrictGrid[elY - 1][elX] = true;
              colRestrictGrid[elY - 1][elX] = true;
            }
          } else {
            if (elX + len <= 7) {
              sharedList.removeEach(
                (node) => node.getValue() === elY * 8 + (elX + len)
              );
              rowRestrictGrid[elY][elX + len] = true;
              colRestrictGrid[elY][elX + len] = true;
            }
            if (elX - 1 >= 0) {
              sharedList.removeEach(
                (node) => node.getValue() === elY * 8 + (elX - 1)
              );
              rowRestrictGrid[elY][elX - 1] = true;
              colRestrictGrid[elY][elX - 1] = true;
            }
          }

          nodes.set(key, {
            ...value,
            len: len,
            axis: [elX, elY],
          });
        }
      }
    }
  }
};

const insert_crossword = async () => {
  for (const [key, value] of nodes.entries()) {
    if (value.word) continue; // 이미 단어가 있으면 패스

    const possible = await dfs(key);
    if (!possible) {
      console.log(`생성 실패.`);
      return;
    }
  }

  delete_unintersected_nodes();
};

const delete_unintersected_nodes = () => {
  for (const [key, value] of nodes.entries()) {
    if (value.crossedNumbers.length == 0) {
      nodes.delete(key);
    }
  }

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const cell = grid[y][x];
      if (cell && !nodes.has(cell)) {
        grid[y][x] = null;
      }
    }
  }
};

const dfs = async (key: string) => {
  // 현재 노드 정보 가져오기
  const value = nodes.get(key);
  // 값은 당연히 있으나 typescript 오류 방지용
  if (!value) return false;

  // 조건
  let condition = value.word;
  console.log(condition);

  // 단어가 완성되어 있으면 패스
  if (condition && !condition.includes("_")) return true;

  // 올 수 없는 단어 목록
  const impossible: string[] = [];

  const [x, y] = value.axis;
  const length = value.len;

  let possible = true;

  let word: string;

  do {
    possible = true;

    // 1. 단어 가져오기
    const randomWord = await getRandomWord({
      len: length,
      condition: condition,
      exclude: exclude,
      impossible: impossible,
    });

    if (!randomWord) {
      console.log(`${condition}에서 단어를 찾을 수 없었습니다.
by: ${key}`);
      // 임시 단어 비우기
      nodes.set(key, { ...value, word: "" });
      return false;
    }

    word = randomWord.word;

    // 임시 단어 설정
    nodes.set(key, { ...value, word: word });

    const backup = new Map<string, string>();

    for (let i = 0; i < value.crossedNumbers.length; i++) {
      const val = nodes.get(key);
      const crossedNumber = val!.crossedNumbers[i];
      const crossedKey = "tile-" + crossedNumber;
      const crossedNode = nodes.get(crossedKey);

      if (crossedNode!.word && !crossedNode!.word.includes("_")) continue;

      const [crossedNodeX, crossedNodeY] = crossedNode!.axis;
      const crossedLength = crossedNode!.len;

      const { x: crossedX, y: crossedY } = val!.crossedCoordinates[i];

      const placement = Math.abs(crossedX - x) + Math.abs(crossedY - y);
      const placementInitial = word[placement];

      const crossedPlacement =
        Math.abs(crossedNodeX - crossedX) +
        Math.abs(crossedNodeY - crossedY) +
        1;

      let passed = await isPossiblePlace({
        length,
        placementInitial,
        crossedLength,
        crossedPlacement,
      });

      if (!passed.possible) {
        console.log(`${placementInitial}(이)라는 들어올 수 없는 글자가 있습니다.
by: ${key}`);
        possible = false;
        break;
      } else {
        const updatedCrossedNode = nodes.get(crossedKey);
        backup.set(crossedKey, updatedCrossedNode!.word);
        let prev = updatedCrossedNode!.word || "_".repeat(crossedLength);

        let arr = prev.split("");
        arr[crossedPlacement - 1] = placementInitial;
        const condition = arr.join("");

        nodes.set(crossedKey, { ...updatedCrossedNode!, word: condition });
      }
    }

    if (!possible) {
      impossible.push(word);
      continue;
    }

    for (let i = 0; i < value.crossedNumbers.length; i++) {
      const val = nodes.get(key);
      const crossedNumber = val!.crossedNumbers[i];
      const crossedKey = "tile-" + crossedNumber;

      const crossedNode = nodes.get(crossedKey);
      if (crossedNode!.word && !crossedNode!.word.includes("_")) continue;

      const possibleDFS = await dfs(crossedKey);
      if (!possibleDFS) {
        possible = false;
        impossible.push(word);
        console.log(`${word}: 위 단어를 사용할 수 없습니다.
사유: 이후 단어에서 사용 불가`);

        // 복구
        nodes.set(crossedKey, {
          ...crossedNode!,
          word: backup.get(crossedKey)!,
        });
        break;
      }
    }
  } while (possible == false);

  // 사용한 단어는 제외 목록에 추가
  exclude.push(word);
  return true;
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
    if (!sharedList.count()) return;

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

    // 2~6 중의 수이지만(작성은 4까지만 나오지만 겹치는 경우 6자가 나옴) 오버플로 방지
    // 세로

    let limit: number;

    switch (dir) {
      case "vertical":
        // rowRestrict or notSharedList

        for (limit = 1; limit <= Math.min(7 - row, 3); limit++) {
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
        break;

      case "horizontal":
        // colRestrict or notSharedList

        for (limit = 1; limit <= Math.min(7 - col, 3); limit++) {
          if (col + limit >= 8 || colRestrictGrid[row][col + limit]) {
            break;
          }
        }

        limit--; // 반복문이 초과되든, rowRestrict 조건을 만족하든 간에 한 칸 빼야 함

        if (limit < 1) {
          sharedList.removeEach((node) => node.getValue() === row * 8 + col);
          continue;
        }

        len = Math.min(Math.floor(Math.random() * limit) + 2, 4);
        break;
    }

    break;
  }

  let crossingCoordinates: Coord[] = [];
  let crossingNumbers: number[] = [];

  // 등록
  for (let i = 0; i < len; i++) {
    let x = dir == "horizontal" ? col + i : col;
    let y = dir == "vertical" ? row + i : row;

    if (grid[y][x]) {
      const key = grid[y][x];
      const keyByNumber = Number(key?.replace("tile-", ""));
      const isExistsNumber = crossingNumbers.includes(keyByNumber);

      if (key && !isExistsNumber)
        insertCrossInfo(key, x, y, index, crossingCoordinates, crossingNumbers);
    }

    grid[y][x] = `tile-${index}`;

    for (let j = -1; j <= 1; j++) {
      switch (dir) {
        case "vertical":
          if (x + j >= 0 && x + j < 8) rowRestrictGrid[y][x + j] = true;
          break;

        case "horizontal":
          if (y + j >= 0 && y + j < 8) colRestrictGrid[y + j][x] = true;
          break;
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
  nodes.set(`tile-${index}`, {
    dir: dir,
    len: len,
    axis: [col, row],
    word: "",
    crossedNumbers: crossingNumbers,
    crossedCoordinates: crossingCoordinates,
  });
};

const insertCrossInfo = (
  key: string,
  x: number,
  y: number,
  index: number,
  crossingCoordinates: Coord[],
  crossingNumbers: number[]
) => {
  const prev = nodes.get(key);
  let cell = key.replace("tile-", "");
  let cellByNumber: number = Number(cell);
  crossingCoordinates.push({ x: x, y: y });
  crossingNumbers.push(cellByNumber);

  if (prev) {
    prev.crossedCoordinates.push({ x: x, y: y });
    prev.crossedNumbers.push(index);
  }
};
