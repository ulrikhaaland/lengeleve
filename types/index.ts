export type Chapter = {
  title: string;
  date: string;
  topics: Topic[];
};

export type Topic = {
  title: string;
  date: string;
  chunks: Chunk[];
};

export type Chunk = {
  id?: number;
  title: string;
  date: string;
  context: string;
  people: string;
  content: string;
  content_length: number;
  content_tokens: number;
  embedding: number[];
};
