"use client"

import React, { useState } from "react";
import { LetterButton } from "@/components/ui/letter-button";
import { div } from "motion/react-client";

const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;
const SOLUTION = "REACT"; // You can randomize this or fetch from a list

const KEYBOARD = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["Enter","Z","X","C","V","B","N","M", "Del"]
]


export default function Wordle() {
  return (
    <>
        {KEYBOARD.map((row, rowIndex) => (
        <div
          key={rowIndex} // Use rowIndex as key for rows (simple arrays, no unique IDs)
          className="flex justify-center"
        >
          {row.map((key, keyIndex) => (
            <LetterButton
              key={`${rowIndex}-${keyIndex}`} // Combine row and key index for a unique key
              className="m-2"
              size="input"
            >
              {key}
            </LetterButton>
          ))}
        </div>
      ))}
    </>
  );
}