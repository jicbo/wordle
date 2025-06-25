import { promises as fs } from "fs";
import path from "path";

export default async function handler(req: any, res: any) {
	if (req.method === "POST") {
		const { word } = req.body;

		if (!word) {
			return res.status(400).json({ error: "Word is required" });
		}

		try {
			const jsonDirectory = path.join(process.cwd(), "public");
			const fileContents = await fs.readFile(
				jsonDirectory + "/words_dictionary.json",
				"utf8"
			);
			const wordsArray = JSON.parse(fileContents);
			const wordSet = new Set(wordsArray);

			const isValid = wordSet.has(word.toLowerCase());

			res.status(200).json({ isValid });
		} catch (error) {
			console.error("Error reading dictionary file:", error);
			res.status(500).json({ error: "Failed to read dictionary" });
		}
	} else {
		res.status(405).json({ message: "Method Not Allowed" });
	}
}
