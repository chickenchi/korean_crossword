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

const setup = () => {
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      grid[y][x] = null;
    }
  }

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      rowRestrictGrid[y][x] = false;
      colRestrictGrid[y][x] = false;
    }
  }

  for (let i = 0; i < 8; i++) {
    rowRestrictGrid[7][i] = true;
    colRestrictGrid[i][7] = true;
  }

  sharedList.clear();
  for (let i = 0; i < 63; i++) {
    sharedList.insertLast(i);
  }

  nodes.clear();
};

export const create_crossword = async (): Promise<
  [(string | null)[][], Map<string, NodeInfo>]
> => {
  setup();

  await create_cross();
  await insert_crossword();

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
    if (value.word) continue;

    let possible = true;
    let randomWord: { word: string };
    let word: string;

    const exclude: string[] = [];

    do {
      randomWord = await getRandomWord({
        len: value.len,
        exclude: exclude,
      });

      word = randomWord.word;

      const [x, y] = value.axis;
      const length = value.len;

      if (value.crossedNumbers.length === 0) {
        nodes.set(key, { ...value, word: word });
        break;
      }

      for (let i = 0; i < value.crossedNumbers.length; i++) {
        const crossedNumber = value.crossedNumbers[i]; // 겹친 노드의 번호
        const crossedKey = "tile-" + crossedNumber; // 겹친 노드의 키
        const crossedNode = nodes.get(crossedKey); // 겹친 노드
        const [crossedNodeX, crossedNodeY] = crossedNode!.axis; // 겹친 노드의 좌표
        const crossedLength = crossedNode!.len;

        const { x: crossedX, y: crossedY } = value.crossedCoordinates[i]; // 겹친 부분의 좌표

        const placement = Math.abs(crossedX - x) + Math.abs(crossedY - y); // 겹친 부분의 자리(본인 기준)
        const placementInitial = word[placement]; // 겹친 부분의 글자

        const crossedPlacement =
          Math.abs(crossedNodeX - crossedX) +
          Math.abs(crossedNodeY - crossedY) +
          1; // 겹친 노드의 자리(chN을 위해 +1)

        let passed = await isPossiblePlace({
          length,
          placementInitial,
          crossedLength,
          crossedPlacement,
        });

        if (!passed) {
          possible = false;
          console.log(`${placementInitial}(이)라는 들어올 수 없는 글자가 있습니다.
by: ${key} from: insert_crossword`);
          break;
        } else {
          let prev = crossedNode!.word || "_".repeat(crossedLength);

          let arr = prev.split("");
          arr[crossedPlacement - 1] = placementInitial;

          const condition = arr.join("");

          nodes.set(crossedKey, { ...crossedNode!, word: condition });
          nodes.set(key, { ...value, word: word });
          possible = await dfs(crossedKey);
        }
      }

      if (!possible) exclude.push(word);
    } while (!possible);
  }

  return;
};

const dfs = async (key: string) => {
  const value = nodes.get(key);
  if (!value) return false;

  let condition = value.word;

  if (condition && !condition.includes("_")) return true;

  const exclude: string[] = [];

  const [x, y] = value.axis;
  const length = value.len;

  let valid = true;

  do {
    const randomWord = await getRandomWord({
      len: length,
      condition: condition,
      exclude: exclude,
    });

    if (!randomWord) {
      console.log(`${condition}에서 단어를 찾을 수 없었습니다.
by: ${key} from: dfs`);
      nodes.set(key, { ...value, word: "" });
      return false;
    }

    const word = randomWord.word;

    nodes.set(key, { ...value, word: word });

    for (let i = 0; i < value.crossedNumbers.length; i++) {
      const val = nodes.get(key);
      const crossedNumber = val!.crossedNumbers[i];
      const crossedKey = "tile-" + crossedNumber;
      const crossedNode = nodes.get(crossedKey);

      if (crossedNode!.word) continue;

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
by: ${key} from: dfs`);
        valid = false;
        break;
      } else {
        let prev = crossedNode!.word || "_".repeat(crossedLength);

        let arr = prev.split("");
        arr[crossedPlacement - 1] = placementInitial;

        const condition = arr.join("");

        nodes.set(crossedKey, { ...crossedNode!, word: condition });
      }
    }

    if (!valid) {
      exclude.push(word);
      continue;
    }

    for (let i = 0; i < value.crossedNumbers.length; i++) {
      const val = nodes.get(key);
      const crossedNumber = val!.crossedNumbers[i];
      const crossedKey = "tile-" + crossedNumber;

      const crossedNode = nodes.get(crossedKey);
      if (crossedNode!.word && !crossedNode!.word.includes("_")) continue;

      const possible = await dfs(crossedKey);
      if (!possible) {
        valid = false;
        break;
      }
    }
  } while (valid == false);

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

const showStatus = () => {
  console.log("-- Result --");
  for (let row = 0; row < 8; row++) {
    const line = grid[row]
      .map((cell) =>
        cell === null ? "  .  " : ` ${cell.replace("tile-", "")} `
      )
      .join(" ");
    console.log(line + "\n"); // 각 행 뒤에 줄 바꿈 추가
    console.log("\n"); // 각 행 뒤에 줄 바꿈 추가
  }

  console.log("=== rowRestrictGrid ===");
  for (let y = 0; y < 8; y++) {
    console.log(rowRestrictGrid[y].map((v) => (v ? " 1 " : " 0 ")).join(" "));
    console.log("");
  }

  console.log("\n=== colRestrictGrid ===");
  for (let y = 0; y < 8; y++) {
    console.log(colRestrictGrid[y].map((v) => (v ? " 1 " : " 0 ")).join(" "));
    console.log("");
  }
};
