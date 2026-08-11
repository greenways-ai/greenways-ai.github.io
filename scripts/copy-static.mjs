import { cp, copyFile, mkdir } from "node:fs/promises";

await mkdir("dist", { recursive: true });
for (const file of ["CNAME", "LICENSE", "favicon.svg", "sigil.svg"]) {
  await copyFile(file, `dist/${file}`);
}
for (const directory of ["governance", "rfcs", "specs"]) {
  await cp(directory, `dist/${directory}`, { recursive: true });
}
console.log("Copied canonical domain, licence, governance, RFC, and specification assets.");
