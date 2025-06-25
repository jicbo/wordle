import { LetterButton } from "@/components/ui/letter-button";
import { ModeToggle } from "@/components/theme-toggle";
import Wordle from "@/components/wordle";

export default function Home() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-24">
			<Wordle />
		</main>
	);
}
