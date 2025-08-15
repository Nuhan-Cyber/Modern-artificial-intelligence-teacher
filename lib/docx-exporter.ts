import type { Notes } from '../types';

// The script tag in index.html puts `docx` on the window object.
// We declare it here to satisfy TypeScript.
declare const window: any;

export const exportNotesToDocx = (notes: Notes, title: string, t: (key: string, replacements?: Record<string, string | number>) => string) => {
    
    if (typeof window.docx === 'undefined') {
        console.error("The 'docx' library is not available on the window object. Check the script tag in index.html.");
        alert("Export functionality is currently unavailable.");
        return;
    }

    const { Packer, Document, Paragraph, HeadingLevel, TextRun, AlignmentType } = window.docx;

    const createHeading = (text: string) => {
        return new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text, bold: true, color: "2E74B5", size: 28 })],
            spacing: { after: 200, before: 400 },
            border: { bottom: { color: "auto", space: 1, value: "single", size: 6 } },
        });
    };
    
    const sections = [];

    // Title
    sections.push(
        new Paragraph({
            children: [new TextRun({ text: title, bold: true, size: 44, color: "1F4E79" })],
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
        })
    );

    // Summary
    sections.push(createHeading(t('notes_summary')));
    sections.push(new Paragraph({ text: notes.summary, style: "Normal" }));

    // Memorization Keys
    if (notes.memorizationKeys?.length > 0) {
        sections.push(createHeading(t('notes_memorization_keys')));
        notes.memorizationKeys.forEach(item => {
            sections.push(new Paragraph({
                children: [
                    new TextRun({ text: `${item.key}:\t`, bold: true, color: "5B9BD5" }),
                    new TextRun({ text: item.value }),
                ],
                bullet: { level: 0 }
            }));
        });
    }

    // Key Concepts
    if (notes.keyConcepts?.length > 0) {
        sections.push(createHeading(t('notes_key_concepts')));
        notes.keyConcepts.forEach(concept => {
            sections.push(new Paragraph({
                children: [new TextRun({ text: concept.concept, bold: true, color: "4472C4" })],
                spacing: { before: 200 },
            }));
            concept.points.forEach(point => {
                sections.push(new Paragraph({
                    text: point,
                    bullet: { level: 0 },
                }));
            });
        });
    }

    // Other Sections...
    const otherSections = [
        { title: t('notes_key_definitions'), data: notes.definitions, format: (item: any) => new Paragraph({ children: [new TextRun({text: `${item.term}: `, bold: true}), new TextRun(item.definition)], bullet: { level: 0 }}) },
        { title: t('notes_key_people'), data: notes.keyPeople, format: (item: any) => new Paragraph({ children: [new TextRun({text: `${item.name}: `, bold: true}), new TextRun(item.significance)], bullet: { level: 0 }}) },
        { title: t('notes_key_dates'), data: notes.keyDates, format: (item: any) => new Paragraph({ children: [new TextRun({text: `${item.date}: `, bold: true}), new TextRun(item.event)], bullet: { level: 0 }}) },
        { title: t('notes_key_locations'), data: notes.keyLocations, format: (item: any) => new Paragraph({ children: [new TextRun({text: `${item.name}: `, bold: true}), new TextRun(item.significance)], bullet: { level: 0 }}) },
        { title: t('notes_examples'), data: notes.examples, format: (item: any) => new Paragraph({ text: item, bullet: { level: 0 }}) },
        { title: t('notes_study_questions'), data: notes.studyQuestions, format: (item: any) => new Paragraph({ text: item, bullet: { level: 0 }}) },
    ];
    
    otherSections.forEach(sec => {
        if(sec.data && sec.data.length > 0) {
            sections.push(createHeading(sec.title));
            sec.data.forEach(item => sections.push(sec.format(item)));
        }
    });

    const doc = new Document({
        sections: [{
            children: sections
        }],
        styles: {
            paragraphStyles: [{
                id: "Normal",
                name: "Normal",
                run: { size: 24, color: "595959" },
                paragraph: { spacing: { after: 120 } }
            }]
        }
    });

    Packer.toBlob(doc).then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title.replace(/ /g, '_')}_notes.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    });
};