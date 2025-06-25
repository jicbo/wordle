"use client";

import React, { useState, useEffect, useCallback } from "react";
import { LetterButton } from "@/components/ui/letter-button"; // Assuming this component is set up for variants
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Settings } from "lucide-react";
import { BookA } from "lucide-react";
import { Gamepad2 } from "lucide-react";

function createEmptyBoard(rows: number, cols: number): [string, number][][] {
	const board: [string, number][][] = [];
	for (let i = 0; i < rows; i++) {
		board[i] = [];
		for (let j = 0; j < cols; j++) {
			board[i][j] = ["", -1];
		}
	}
	return board;
}

const KEYBOARD_LAYOUT = [
	["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
	["A", "S", "D", "F", "G", "H", "J", "K", "L"],
	["Enter", "Z", "X", "C", "V", "B", "N", "M", "Del"],
];

export default function Wordle() {
	const [wordLength, setWordLength] = useState(5);
	const [maxAttempts, setMaxAttempts] = useState(6);

	const [tempWordLength, setTempWordLength] = useState(5);
	const [tempMaxAttempts, setTempMaxAttempts] = useState(6);

	const [isSettingsOpen, setIsSettingsOpen] = useState(false);

	const [usedWords, setUsedWords] = useState<string[]>([]);

	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (isSettingsOpen) {
			setTempWordLength(wordLength);
			setTempMaxAttempts(maxAttempts);
		}
	}, [isSettingsOpen, wordLength, maxAttempts]);

	const [board, setBoard] = useState<[string, number][][]>(() =>
		createEmptyBoard(maxAttempts, wordLength)
	);

	const [currentRow, setCurrentRow] = useState(0);

	const [currentCol, setCurrentCol] = useState(0);

	const [message, setMessage] = useState<string | null>(null);

	const [gameOver, setGameOver] = useState(false);

	const [solution, setSolution] = useState("");

	const [keyboardState, setKeyboardState] = useState<
		Record<string, "default" | "absent" | "present" | "correct">
	>(() => {
		const initialState: Record<
			string,
			"default" | "absent" | "present" | "correct"
		> = {};
		KEYBOARD_LAYOUT.flat().forEach((key) => {
			if (key.length === 1) {
				initialState[key] = "default";
			}
		});
		return initialState;
	});

	const resetGame = useCallback(() => {
		setUsedWords([]);
		setBoard(createEmptyBoard(maxAttempts, wordLength));
		setCurrentRow(0);
		setCurrentCol(0);
		setMessage(null);
		setGameOver(false);
		setKeyboardState(() => {
			const initialState: Record<
				string,
				"default" | "absent" | "present" | "correct"
			> = {};
			KEYBOARD_LAYOUT.flat().forEach((key) => {
				if (key.length === 1) {
					initialState[key] = "default";
				}
			});
			return initialState;
		});

		fetch(`https://random-word-api.herokuapp.com/word?length=${wordLength}`)
			.then((res) => res.json())
			.then((data) => {
				if (data && data.length > 0) {
					setSolution(data[0].toUpperCase());
				} else {
					setSolution("ERROR");
				}
			})
			.catch((error) => {
				console.error("Error fetching word:", error);
				setSolution("ERROR");
			});
	}, [maxAttempts, wordLength, setSolution]);

	const handleSaveChanges = useCallback(() => {
		setWordLength(tempWordLength);
		setMaxAttempts(tempMaxAttempts);
		localStorage.setItem("wordLength", tempWordLength.toString());
		localStorage.setItem("maxAttempts", tempMaxAttempts.toString());
		setIsSettingsOpen(false);
	}, [tempWordLength, tempMaxAttempts, setIsSettingsOpen]);

	useEffect(() => {
		if (typeof window !== "undefined") {
			const savedWordLength = localStorage.getItem("wordLength");
			const savedMaxAttempts = localStorage.getItem("maxAttempts");
			if (savedWordLength) {
				setWordLength(parseInt(savedWordLength, 10));
			}
			if (savedMaxAttempts) {
				setMaxAttempts(parseInt(savedMaxAttempts, 10));
			}
		}
		resetGame();
	}, [wordLength, maxAttempts, resetGame]);

	const handleCharInput = useCallback(
		(char: string) => {
			if (
				gameOver ||
				currentRow >= maxAttempts ||
				currentCol >= wordLength
			) {
				return;
			}

			setBoard((prevBoard) => {
				const newBoard = [...prevBoard];
				newBoard[currentRow] = [...newBoard[currentRow]];
				newBoard[currentRow][currentCol] = [char, -1];
				return newBoard;
			});

			setCurrentCol((prevCol) => prevCol + 1);
		},
		[currentRow, currentCol, gameOver]
	);

	const handleEnter = useCallback(async () => {
		if (gameOver) return;

		if (currentCol < wordLength) {
			toast.error("Not enough letters!");
			return;
		}

		const currentGuess = board[currentRow]
			.map((cell) => cell[0]) // Extract letters from the current row
			.join("");

		if (currentGuess.length !== wordLength) {
			toast.error("Word is too short!");
			return;
		}

		if (usedWords.includes(currentGuess)) {
			toast.error("Word has already been used!");
			return;
		}

		setIsLoading(true);

		try {
			const response = await fetch("/api/validate-word", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ word: currentGuess }),
			});

			const data = await response.json();

			if (!data.isValid) {
				toast.error(`${currentGuess} is not in the dictionary.`);
				return;
			}

			const newBoard = [...board];
			newBoard[currentRow] = [...newBoard[currentRow]];

			let solved = true;

			const solutionLetters: (string | null)[] = solution.split("");

			for (let i = 0; i < wordLength; i++) {
				if (currentGuess[i] === solution[i]) {
					newBoard[currentRow][i] = [currentGuess[i], 1];
					solutionLetters[i] = null;
				}
			}

			for (let i = 0; i < wordLength; i++) {
				if (newBoard[currentRow][i][1] === 1) {
					continue;
				}

				const letter = currentGuess[i];
				const solutionIndex = solutionLetters.indexOf(letter);

				if (solutionIndex !== -1) {
					newBoard[currentRow][i] = [letter, 2];
					solutionLetters[solutionIndex] = null;
				} else {
					newBoard[currentRow][i] = [letter, 0];
				}
			}

			setBoard(newBoard);

			setKeyboardState((prevKeyboardState) => {
				const newKeyboardState = { ...prevKeyboardState };
				for (let i = 0; i < wordLength; i++) {
					const letter = currentGuess[i];
					const status = newBoard[currentRow][i][1];

					if (status === 1) {
						newKeyboardState[letter] = "correct";
					} else if (
						status === 2 &&
						newKeyboardState[letter] !== "correct"
					) {
						newKeyboardState[letter] = "present";
					} else if (
						status === 0 &&
						newKeyboardState[letter] !== "correct" &&
						newKeyboardState[letter] !== "present"
					) {
						newKeyboardState[letter] = "absent";
					}
				}
				return newKeyboardState;
			});

			if (currentGuess === solution) {
				setMessage("You guessed it! The word was ${solution}");
				setGameOver(true);
				return;
			} else if (currentRow === maxAttempts - 1) {
				setMessage(`Game Over! The word was ${solution}`);
				setGameOver(true);
				return;
			} else {
				setCurrentRow((prevRow) => prevRow + 1);
				setCurrentCol(0);
				setUsedWords((prevWords) => [...prevWords, currentGuess]);
			}
		} finally {
			setIsLoading(false);
		}
	}, [
		board,
		currentRow,
		currentCol,
		gameOver,
		setKeyboardState,
		wordLength,
		maxAttempts,
		solution,
		usedWords,
		isLoading,
	]);

	const handleDelete = useCallback(() => {
		if (gameOver || currentCol === 0) {
			return;
		}

		setBoard((prevBoard) => {
			const newBoard = [...prevBoard];
			newBoard[currentRow] = [...newBoard[currentRow]];
			newBoard[currentRow][currentCol - 1] = ["", -1];
			return newBoard;
		});

		setCurrentCol((prevCol) => prevCol - 1);
		setMessage(null);
	}, [currentRow, currentCol, gameOver]);

	useEffect(() => {
		const handleKeyPress = (event: KeyboardEvent) => {
			if (gameOver || isLoading) return;

			const key = event.key.toUpperCase();

			if (key === "BACKSPACE" || key === "DELETE") {
				handleDelete();
			} else if (key === "ENTER") {
				handleEnter();
			} else if (key.length === 1 && key >= "A" && key <= "Z") {
				handleCharInput(key);
			}
		};

		window.addEventListener("keydown", handleKeyPress);

		return () => {
			window.removeEventListener("keydown", handleKeyPress);
		};
	}, [handleCharInput, handleEnter, handleDelete, gameOver, isLoading]);

	return (
		<div id="wordle" className="flex flex-col space-y-6 relative">
			<AlertDialog
				open={gameOver && !!message}
				onOpenChange={() => setMessage(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{message === "You guessed it! You won!"
								? "Congratulations!"
								: "Game Over"}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{message}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="flex justify-between">
						<AlertDialogAction onClick={() => setMessage(null)}>
							Close
						</AlertDialogAction>
						<AlertDialogAction
							onClick={() => {
								setMessage(null);
								resetGame();
							}}
						>
							<Gamepad2 className="h-5 w-5 mr-2" />
							New Game
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<div id="board">
				{board.map((row, rowIndex) => (
					<div key={rowIndex} className="flex justify-center">
						{row.map((cellData, colIndex) => {
							const [letter, status] = cellData;

							let cellVariant:
								| "empty"
								| "absent"
								| "correct"
								| "present"
								| "default";
							switch (status) {
								case -1:
									cellVariant = "empty";
									break;
								case 0:
									cellVariant = "absent";
									break;
								case 1:
									cellVariant = "correct";
									break;
								case 2:
									cellVariant = "present";
									break;
								default:
									cellVariant = "default";
									break;
							}

							return (
								<LetterButton
									key={`${rowIndex}-${colIndex}`}
									className={`m-1 ${
										rowIndex === currentRow &&
										colIndex === currentCol
											? "border-2 border-blue-500"
											: ""
									}`}
									variant={cellVariant}
								>
									{letter}
								</LetterButton>
							);
						})}
					</div>
				))}
			</div>

			<div id="keyboard">
				{KEYBOARD_LAYOUT.map((row, rowIndex) => (
					<div key={rowIndex} className="flex justify-center">
						{row.map((keyChar, keyIndex) => (
							<LetterButton
								key={`${rowIndex}-${keyIndex}`}
								className="m-2"
								size={
									keyChar === "Enter" || keyChar === "Del"
										? "auto"
										: "input"
								}
								onClick={() => {
									if (keyChar === "Enter") {
										handleEnter();
									} else if (keyChar === "Del") {
										handleDelete();
									} else {
										handleCharInput(keyChar);
									}
								}}
								variant={keyboardState[keyChar] || "default"}
							>
								{keyChar}
							</LetterButton>
						))}
					</div>
				))}
			</div>

			<div className="flex justify-center mt-4 space-x-2">
				<Button
					variant="outline"
					size="lg"
					onClick={() =>
						window.open(
							`https://random-word-api.herokuapp.com/all`,
							"_blank"
						)
					}
				>
					<BookA className="h-5 w-5 mr-2" />
					Word Dict
				</Button>
				<Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
					<DialogTrigger asChild>
						<Button variant="outline" size="lg">
							<Settings className="h-5 w-5 mr-2" /> Settings
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Game Settings</DialogTitle>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid grid-cols-4 items-center gap-4">
								<Label
									htmlFor="word-length"
									className="text-right"
								>
									Word Length
								</Label>
								<Input
									id="word-length"
									type="number"
									value={tempWordLength}
									onChange={(e) =>
										setTempWordLength(
											Number(e.target.value)
										)
									}
									min={2}
									max={15}
									className="col-span-3"
								/>
							</div>
							<div className="grid grid-cols-4 items-center gap-4">
								<Label
									htmlFor="max-attempts"
									className="text-right"
								>
									Max Attempts
								</Label>
								<Input
									id="max-attempts"
									type="number"
									value={tempMaxAttempts}
									onChange={(e) =>
										setTempMaxAttempts(
											Number(e.target.value)
										)
									}
									min={1}
									max={12}
									className="col-span-3"
								/>
							</div>
						</div>
						<DialogFooter>
							<Button type="submit" onClick={handleSaveChanges}>
								Save changes
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
				<Button variant="outline" size="lg" onClick={resetGame}>
					<Gamepad2 className="h-5 w-5 mr-2" />
					New Game
				</Button>
			</div>
		</div>
	);
}
