import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';

interface ChapterContent {
  title: string;
  content: string[];
}

export async function generateChapterContent(title: string, chapter: number): Promise<ChapterContent> {
  const prompts = {
    1: `Generate a detailed Chapter 1 for a final year project titled "${title}". Include the following sections:
        1. Objective (clear, measurable objectives of the project)
        2. Problem Statement (clear description of the problem being addressed)
        3. Scope of Research (clear boundaries and limitations of the research)
        Format the response in clear sections with detailed content for each section.`,
    2: `Generate a comprehensive literature review (Chapter 2) for a final year project titled "${title}".
        Focus only on relevant papers and research directly related to the project topic.
        Include:
        1. Recent research papers (within last 5 years)
        2. Critical analysis of methodologies used
        3. Gaps in current research
        Format as a coherent review with proper citations and subsections.`,
    3: `Generate a detailed methodology chapter (Chapter 3) for a final year project titled "${title}".
        Include:
        1. Research approach and design
        2. Methods and tools to be used
        3. Data collection and analysis procedures
        4. Project timeline and milestones
        Format with clear sections and step-by-step procedures.`
  };

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompts[chapter as keyof typeof prompts],
        chapter: chapter
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate chapter ${chapter}`);
    }

    const data = await response.json();
    return {
      title: `Chapter ${chapter}`,
      content: data.content.split('\n\n')
    };
  } catch (error) {
    console.error('Error generating chapter:', error);
    throw error;
  }
}

export async function createWordDocument(title: string, chapters: ChapterContent[]): Promise<Uint8Array> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: title,
          heading: HeadingLevel.TITLE,
          spacing: {
            after: 400,
          },
        }),
        ...chapters.flatMap(chapter => [
          new Paragraph({
            text: chapter.title,
            heading: HeadingLevel.HEADING_1,
            spacing: {
              before: 400,
              after: 200,
            },
          }),
          ...chapter.content.map(text => 
            new Paragraph({
              children: [
                new TextRun({
                  text: text,
                  size: 24,
                }),
              ],
              spacing: {
                before: 200,
                after: 200,
              },
            })
          ),
        ]),
      ],
    }],
  });

  return await Packer.toBuffer(doc);
}
