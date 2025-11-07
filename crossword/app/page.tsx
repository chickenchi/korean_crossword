"use client";
import { redirect } from "next/navigation";
import styled from "styled-components";

export default function Home() {
  redirect("/crossword");
}
