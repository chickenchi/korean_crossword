"use client";
import styled from "styled-components";
import { create_crossword } from "./create_cross/create_crossword";
import { useEffect, useState } from "react";

const CrosswordDiv = styled.div``;
const CrosswordTable = styled.table`
  border-collapse: collapse;
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

  width: 40px;
  height: 40px;

  border: 1px solid white;
`;

const CrosswordAnswer = styled.input`
  background-color: rgba(0, 0, 0, 0);

  border: none;

  width: 100%;
  height: 100%;

  color: white;
  font-size: 14pt;
  text-align: center;

  outline: none;
`;

export default function Crossword() {
  const [grid, setGrid] = useState<(string | null)[][] | null>(null);

  useEffect(() => {
    const grid: (string | null)[][] = create_crossword();

    setGrid(grid);
  }, []);

  return (
    <CrosswordDiv>
      <CrosswordTable>
        <CrosswordBody>
          {Array.from({ length: 8 }).map((_, r) => (
            <CrosswordColumn key={r}>
              {Array.from({ length: 8 }).map((_, c) => (
                <CrosswordRow key={c} activated={grid?.[r][c] != null}>
                  <CrosswordAnswer
                    disabled={grid?.[r][c] == null}
                  ></CrosswordAnswer>
                </CrosswordRow>
              ))}
            </CrosswordColumn>
          ))}
        </CrosswordBody>
      </CrosswordTable>
    </CrosswordDiv>
  );
}
