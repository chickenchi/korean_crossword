"use client";
import styled from "styled-components";
import { create_crossword } from "./create_cross/create_crossword";
import { useEffect } from "react";

const CrosswordDiv = styled.div``;
const CrosswordTable = styled.table`
  border: 1px solid white;
  border-collapse: collapse;
`;
const CrosswordColumn = styled.tr`
  border: 1px solid white;
`;
const CrosswordRow = styled.td`
  border: 1px solid white;
`;

export default function Crossword() {
  useEffect(() => {
    create_crossword();
  }, []);

  return (
    <CrosswordDiv>
      <></>
    </CrosswordDiv>
  );
}
