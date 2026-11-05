import { ThumbsDown, ThumbsUp } from 'lucide-react';

/** Contagem compacta de likes e dislikes, para listas e tabelas. */
export function MiniVotes({ likes, dislikes }: { likes: number; dislikes: number }) {
  return (
    <span className="inline-flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
      <span className="inline-flex items-center gap-1" title="Likes">
        <ThumbsUp className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Likes:</span>
        {likes}
      </span>
      <span className="inline-flex items-center gap-1" title="Dislikes">
        <ThumbsDown className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Dislikes:</span>
        {dislikes}
      </span>
    </span>
  );
}
