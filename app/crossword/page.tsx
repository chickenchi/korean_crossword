"use client";
import styled from "styled-components";
import { create_crossword, NodeInfo } from "./create_cross/create_crossword";
import { useEffect, useState } from "react";
import { findDescription } from "./lib/find_description";
import { getHints } from "./lib/get_hints";
import { toInitials } from "../tools/toInitials";

const LoadingPreventDiv = styled.div`
  position: absolute;
  background-color: rgba(0, 0, 0, 0.5);

  width: 100vw;
  height: 100vh;

  font-size: 30pt;

  display: flex;
  align-items: center;
  justify-content: center;
`;

const CrosswordDiv = styled.div`
  display: flex;
  flex-direction: column;
`;
const CrosswordTableDiv = styled.div`
  display: flex;
`;
const CrosswordTable = styled.table`
  border-collapse: collapse;

  width: 50vw;
  aspect-ratio: 1 / 1;
`;
const CrosswordBody = styled.tbody`
  border: 1px solid white;
  border-collapse: collapse;
`;
const CrosswordColumn = styled.tr`
  border: 1px solid white;
`;

const CrosswordRow = styled.td<{ activated: boolean }>`
  background-color: ${({ activated }: { activated: boolean }) =>
    activated === true ? "rgba(255, 255, 255, 0.3)" : "none"};

  width: 30px;
  height: 30px;

  border: 1px solid white;
`;

const CrosswordAnswer = styled.div`
  background-color: rgba(0, 0, 0, 0);

  border: none;

  width: 100%;
  height: 100%;

  color: white;

  display: flex;
  align-items: center;
  justify-content: center;

  outline: none;
`;

const CrosswordAnswerDiv = styled.div`
  width: 40%;

  padding: 10px;
`;

const POSDiv = styled.div`
  width: 100%;

  font-size: 13pt;
  line-height: 1.3;
`;

const DefinitionDiv = styled.div`
  width: 100%;

  font-size: 13pt;
  line-height: 1.3;

  white-space: pre-line;
`;

const AnswerInputDiv = styled.div`
  margin-top: 5px;

  display: flex;
  align-items: center;
`;

const Hint = styled.button`
  width: 40px;
  height: 30px;

  margin-left: 5px;

  text-align: center;
`;

const CrosswordAnswerInput = styled.input`
  width: 120px;
  height: 25px;

  font-size: 13pt;
  text-align: center;

  outline: none;
`;

export default function Crossword() {
  const [grid, setGrid] = useState<(string | null)[][] | null>(null);
  const [nodes, setNodes] = useState<Map<string, NodeInfo> | null>(null);
  const [change, setChange] = useState(0);
  const [loading, setLoading] = useState(false);

  const [answer, setAnswer] = useState("");

  const [word, setWord] = useState("");
  const [definition, setDefinition] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("");
  const [key, setKey] = useState("");

  const onAnswerChange = (e: any) => {
    setAnswer(e.target.value);
  };

  useEffect(() => {
    const getGrid = async () => {
      setLoading(true);
      clear();

      const [grid, nodes] = await create_crossword();

      setNodes(nodes);
      setGrid(grid);
      setLoading(false);
    };

    getGrid();
  }, [change]);

  const clear = () => {
    setGrid(
      Array(8)
        .fill("")
        .map(() => Array(8).fill(""))
    );
  };

  const getDescription = async (key: string) => {
    setAnswer("");

    if (!nodes) return;

    const word = nodes.get(key)?.word;

    if (!word) return;

    const foundDefinition = await findDescription(word);
    const definition = foundDefinition.data.definition
      .replace(/「(\d+)」/g, "「$1」 ")
      .trim();
    setWord(word);
    setDefinition(definition);
    setPartOfSpeech(foundDefinition.data.part_of_speech);
    setKey(key);
  };

  const reset = () => {
    setWord("");
    setDefinition("");
    setPartOfSpeech("");
  };

  const checkAnswer = () => {
    if (!nodes) return;

    const value = nodes.get(key);
    if (!value) return;

    if (!grid) return;

    if (answer === word) {
      for (let i = 0; i < value.len; i++) {
        let dx = value.dir === "horizontal" ? 1 : 0;
        let dy = value.dir === "vertical" ? 1 : 0;

        setGrid((prev) => {
          if (!prev) return prev;

          const cloned = prev.map((row) => [...row]);

          const y = value.axis[1] + dy * i;
          const x = value.axis[0] + dx * i;

          cloned[y][x] = word[i];

          return cloned;
        });

        reset();
      }

      const sound = new Audio("./SE/correct.mp3");
      sound.currentTime = 0.12;
      sound.play();
    } else {
      setAnswer("");

      const sound = new Audio("./SE/wrong.wav");
      sound.currentTime = 0.3;
      sound.play();
    }
  };

  const hint = async () => {
    if (!word) return;

    const gotHints = await getHints(word);

    let hintKeys = Object.entries(gotHints.data)
      .filter(([key, value]) => value)
      .map(([key]) => key);

    hintKeys.push("initials");

    const randomHint = hintKeys[Math.floor(Math.random() * hintKeys.length)];

    let selectedHint = gotHints.data[randomHint];

    if (randomHint === "examples") {
      selectedHint = selectedHint.replaceAll(word, "○".repeat(word.length));
    }

    if (randomHint === "initials") {
      alert(toInitials(word));
    } else {
      alert(selectedHint);
    }
    //alert(hintKeys);
  };

  return (
    <CrosswordDiv>
      {loading && (
        <LoadingPreventDiv>잠시만 기다려 주세요...</LoadingPreventDiv>
      )}
      <CrosswordTableDiv>
        <CrosswordTable>
          <CrosswordBody>
            {Array.from({ length: 8 }).map((_, r) => (
              <CrosswordColumn key={r}>
                {Array.from({ length: 8 }).map((_, c) => (
                  <CrosswordRow
                    key={c}
                    activated={grid?.[r][c] != null}
                    onClick={() => {
                      const key = grid?.[r][c] ?? null;
                      if (!key) return;
                      getDescription(key);
                    }}
                  >
                    {!grid?.[r][c]?.includes("tile-") ? (
                      <CrosswordAnswer>{grid?.[r][c]}</CrosswordAnswer>
                    ) : (
                      <CrosswordAnswer></CrosswordAnswer>
                    )}
                  </CrosswordRow>
                ))}
              </CrosswordColumn>
            ))}
          </CrosswordBody>
        </CrosswordTable>

        <CrosswordAnswerDiv>
          <POSDiv>{partOfSpeech}</POSDiv>
          <DefinitionDiv>{definition}</DefinitionDiv>
          {word && (
            <AnswerInputDiv>
              <CrosswordAnswerInput
                maxLength={6}
                value={answer}
                onChange={onAnswerChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    checkAnswer();
                  }
                }}
              />
              <Hint onClick={() => hint()}>힌트</Hint>
            </AnswerInputDiv>
          )}
        </CrosswordAnswerDiv>
      </CrosswordTableDiv>

      {/* <button onClick={() => !loading && setChange(change + 1)}>
        정답 확인
      </button> */}
    </CrosswordDiv>
  );
}
