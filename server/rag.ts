import { db } from './db.js';
import { GroundedSource } from '../src/types.js';

interface Chunk {
  docId: string;
  docTitle: string;
  category: string;
  text: string;
}

export class RagService {
  /**
   * Split document contents into semantic chunks (lines/paragraphs/bullet points)
   */
  private getChunks(): Chunk[] {
    const docs = db.getKnowledgeDocuments();
    const chunks: Chunk[] = [];

    for (const doc of docs) {
      const paragraphs = doc.content
        .split(/\n\s*\n|\n(?=[-•\d]\s*)/)
        .map(p => p.trim())
        .filter(p => p.length > 20);

      if (paragraphs.length === 0 && doc.content.trim().length > 0) {
        chunks.push({
          docId: doc.id,
          docTitle: doc.title,
          category: doc.category,
          text: doc.content.trim(),
        });
      } else {
        for (const paragraph of paragraphs) {
          chunks.push({
            docId: doc.id,
            docTitle: doc.title,
            category: doc.category,
            text: paragraph,
          });
        }
      }
    }
    return chunks;
  }

  /**
   * Tokenize and normalize text for term matching
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !this.isStopword(w));
  }

  private isStopword(word: string): boolean {
    const stopwords = new Set([
      'the', 'and', 'for', 'that', 'this', 'with', 'from', 'have', 'will',
      'are', 'was', 'were', 'been', 'what', 'when', 'where', 'which', 'who',
      'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
      'some', 'such', 'into', 'then', 'than', 'them', 'their', 'they'
    ]);
    return stopwords.has(word);
  }

  /**
   * Evaluates if context retrieval is appropriate.
   * Requirement 17: "Do not make RAG mandatory for every query. Use grounding only when contextual information is needed."
   */
  shouldRetrieveContext(transcript: string): boolean {
    const tokens = this.tokenize(transcript);
    const knowledgeTerms = new Set([
      'rahul', 'ankit', 'siddharth', 'priya', 'smartpay', 'policy', 'guideline',
      'frontend', 'backend', 'api', 'model', 'security', 'password', 'transfer',
      'vendor', 'payment', 'deadline', 'sprint', 'review', 'qa', 'wire', 'money',
      'developer', 'responsibilities', 'team', 'authorization', 'disbursement'
    ]);

    let matchCount = 0;
    for (const token of tokens) {
      if (knowledgeTerms.has(token)) {
        matchCount++;
      }
    }

    return matchCount >= 1;
  }

  /**
   * Retrieve relevant chunks from knowledge base
   */
  retrieveContext(transcript: string, maxResults: number = 3): GroundedSource[] {
    const settings = db.getSettings();
    if (!settings.groundingEnabled) {
      return [];
    }

    if (!this.shouldRetrieveContext(transcript)) {
      return [];
    }

    const queryTokens = this.tokenize(transcript);
    if (queryTokens.length === 0) return [];

    const queryTokenSet = new Set(queryTokens);
    const chunks = this.getChunks();
    const scoredChunks: { chunk: Chunk; score: number }[] = [];

    for (const chunk of chunks) {
      const chunkTokens = this.tokenize(chunk.text);
      if (chunkTokens.length === 0) continue;

      let overlapCount = 0;
      for (const token of chunkTokens) {
        if (queryTokenSet.has(token)) {
          overlapCount++;
        }
      }

      // Exact phrase bonus if any query bigram matches
      let phraseBonus = 0;
      for (let i = 0; i < queryTokens.length - 1; i++) {
        const bigram = `${queryTokens[i]} ${queryTokens[i + 1]}`;
        if (chunk.text.toLowerCase().includes(bigram)) {
          phraseBonus += 0.2;
        }
      }

      const termOverlapRatio = overlapCount / Math.max(queryTokenSet.size, 1);
      const densityScore = overlapCount / Math.max(chunkTokens.length, 1);
      const totalScore = (termOverlapRatio * 0.6) + (densityScore * 0.3) + phraseBonus;

      if (totalScore > 0.15) {
        scoredChunks.push({ chunk, score: Math.min(Math.round(totalScore * 100), 98) });
      }
    }

    scoredChunks.sort((a, b) => b.score - a.score);

    return scoredChunks.slice(0, maxResults).map(sc => ({
      docId: sc.chunk.docId,
      docTitle: sc.chunk.docTitle,
      excerpt: sc.chunk.text,
      relevanceScore: sc.score,
    }));
  }

  /**
   * Format retrieved context for injection into Gemini prompt
   */
  formatContextForPrompt(sources: GroundedSource[]): string {
    if (!sources || sources.length === 0) {
      return 'No external contextual documents retrieved. Grounding was not required for this request.';
    }

    return sources.map((s, idx) => 
      `[Source ${idx + 1}: ${s.docTitle} (Relevance: ${s.relevanceScore}%)]\n${s.excerpt}`
    ).join('\n\n');
  }
}

export const ragService = new RagService();
