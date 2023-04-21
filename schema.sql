--  RUN 1st
create extension vector;

-- RUN 2nd
create table training (
  id bigserial primary key,
  title text,
  date text,
  context text,
  people text,
  content text,
  content_length bigint,
  content_tokens bigint,
  embedding vector (1536)
);

-- RUN 3rd after running the scripts
create or replace function training_search (
  query_embedding vector(1536),
  similarity_threshold float,
  match_count int
)
returns table (
  id bigint,
  title text,
  date text,
  context text,
  people text,
  content text,
  content_length bigint,
  content_tokens bigint,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    training.id,
    training.title,
    training.date,
    training.context,
    training.people,
    training.content,
    training.content_length,
    training.content_tokens,
    1 - (training.embedding <=> query_embedding) as similarity
  from training
  where 1 - (training.embedding <=> query_embedding) > similarity_threshold
  order by training.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- RUN 4th
create index on training 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);