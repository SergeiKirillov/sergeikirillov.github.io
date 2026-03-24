module.exports = async function (tp, app) {
	const file = app.workspace.getActiveFile();

	// очищаем текущий файл
	await app.vault.modify(file, "");

	const files = app.vault.getMarkdownFiles();

	// строим дерево
	const tree = {};

	for (const f of files) {
		const parts = f.path.split("/");
		let current = tree;

		// папки
		for (let i = 0; i < parts.length - 1; i++) {
			if (!current[parts[i]]) {
				current[parts[i]] = {};
			}
			current = current[parts[i]];
		}

		// файлы
		if (!current.__files) current.__files = [];
		current.__files.push(f);
	}
	
	function toGithubLink(file) {
		// GitHub любит URL-encoding для пробелов
		const path = encodeURI(file.path);
		return `[${file.basename}](${path})`;
	}
	
	function render(node, depth = 0) {
		let out = "";
		const indent = "  ".repeat(depth);

		// файлы
		if (node.__files) {
			const sorted = node.__files.sort((a, b) =>
				a.basename.localeCompare(b.basename)
			);

			for (const f of sorted) {
				out += `${indent}- ${toGithubLink(f)}\n`;
			}
		}

		// папки
		const folders = Object.keys(node)
			.filter(k => k !== "__files")
			.sort((a, b) => a.localeCompare(b));

//		for (const folder of folders) {
//			out += `\n${indent}<details>\n`;
//			out += `${indent}<summary>📁 ${folder}</summary>\n\n`;
//			out += render(node[folder], depth + 1);
//			out += `${indent}</details>\n`;
//		}
		
		for (const folder of folders) {
			out += `${indent}- 📁 ${folder}\n`;
			out += render(node[folder], depth + 1);
		}
		
		return out;
	}

	let output = "# Содержание хранилища\n\n";
	output += render(tree);

	return output;
};
