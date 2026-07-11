const fs = require("node:fs");
const path = require("node:path");

const coveragePath = path.join(__dirname, "..", "docs", "user-story-coverage.md");
const coverage = fs.readFileSync(coveragePath, "utf8");
const missingStories = [];

for (let storyNumber = 1; storyNumber <= 50; storyNumber += 1) {
    const storyId = `US${String(storyNumber).padStart(2, "0")}`;
    const rowPattern = new RegExp(`\\| ${storyId} \\|.*\\| Completada(?: \\(.*\\))? \\|`);

    if (!rowPattern.test(coverage)) missingStories.push(storyId);
}

if (missingStories.length) {
    throw new Error(`Historias sin cobertura documentada: ${missingStories.join(", ")}`);
}

console.log("50 user stories documented as completed");
