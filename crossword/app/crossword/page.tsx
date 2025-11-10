"use client";
import styled from "styled-components";
import { create_cross } from "./create_cross/create_cross";
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
    create_cross();
  }, []);

  return (
    <CrosswordDiv>
      <></>
    </CrosswordDiv>
  );
}
