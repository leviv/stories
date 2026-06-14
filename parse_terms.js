import fs from 'fs';

let fullText = fs.readFileSync('src/lib/jaywalking/terms.txt', 'utf8');

// Clean up pagination numbers and isolated dots
fullText = fullText.replace(/\n\d+\n/g, '\n').replace(/\n•\n/g, '\n');

const enText = fullText
	.substring(fullText.indexOf('IMPORTANT NOTICE TO USER:'), fullText.indexOf('用户服务协议'))
	.trim();
const zhText = fullText.substring(fullText.indexOf('重点提示:请您在使用')).trim();

const parseEn = (text) => {
	// English sections are indicated by digits followed by dot and space (e.g. "1. Acceptance")
	const sectionRegex = /\n(\d+\.\s+[A-Z][^\n]+)\n/g;
	let parts = text.split(sectionRegex);

	// parts[0] is intro
	let introText = parts[0].trim();
	// split intro into 2 paragraphs: "IMPORTANT NOTICE..." and "This Agreement is entered..."
	let introParagraphs = [
		introText.substring(0, introText.indexOf('This Agreement')),
		introText.substring(introText.indexOf('This Agreement'))
	].map((p) => p.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim());

	let sections = [];
	for (let i = 1; i < parts.length; i += 2) {
		let title = parts[i].trim();
		let bodyRaw = parts[i + 1].trim();

		// paragraphs in body start with e.g. "1.1. " or implicitly.
		// We can split by \n(\d+\.\d+\.\s) or \n(?=[A-Z]) but it's hard wrapped.
		// Let's just split by "\n\d+\.\d+\.\s" and the remaining bullets.
		// Actually, the text is hard-wrapped at 100 chars or so.
		// We can just use the paragraphs that are delimited by their numbers (1.1., 1.2., etc)
		// or bullet points.
		let pRegex = /(?=\n\d+\.\d+\.\s+)|(?=\n[A-Z][a-z]+(?:ing|ating|ting)\s)/;
		let paragraphs = bodyRaw
			.split(pRegex)
			.map((p) => p.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim())
			.filter(Boolean);

		sections.push({ title, body: paragraphs });
	}
	return { intro: introParagraphs, sections };
};

const parseZh = (text) => {
	// Chinese sections start with "一、 ", "二、 " etc.
	const sectionRegex = /\n([一二三四五六七八九十]+、\s+[^\n]+)\n/g;
	let parts = text.split(sectionRegex);

	let introText = parts[0].trim();
	let introParagraphs = [
		introText.substring(0, introText.indexOf('本协议由')),
		introText.substring(introText.indexOf('本协议由'))
	].map((p) => p.replace(/\n/g, '').replace(/\s+/g, '').trim()); // remove spaces for Chinese except maybe between english words, but it's fine.

	let sections = [];
	for (let i = 1; i < parts.length; i += 2) {
		let title = parts[i].trim();
		let bodyRaw = parts[i + 1].trim();

		let pRegex = /(?=\n\d+\.\d+\.\s+)|(?=\n(?:反对|捏造|未经|对本|干扰|利用))/;
		let paragraphs = bodyRaw
			.split(pRegex)
			.map((p) => p.replace(/\n/g, '').replace(/\s+/g, '').trim())
			.filter(Boolean);

		sections.push({ title, body: paragraphs });
	}
	return { intro: introParagraphs, sections };
};

const enTerms = parseEn(enText);
const zhTerms = parseZh(zhText);

const stringsJson = JSON.parse(fs.readFileSync('src/lib/jaywalking/strings.json', 'utf8'));
stringsJson.terms = {
	en: enTerms,
	zh: zhTerms
};

fs.writeFileSync('src/lib/jaywalking/strings.json', JSON.stringify(stringsJson, null, '\t') + '\n');
console.log('Successfully updated strings.json');
