/** Sidebar chips on KDS/BDS — always follow the active post, never a merged all-posts list. */
export function kdsSidebarMessages(
  activePost: { quickComments?: string[] } | null | undefined,
  ctx: { quickComments?: string[]; allQuickComments?: string[] },
): string[] {
  if (activePost) return activePost.quickComments ?? [];
  if (ctx.allQuickComments?.length) return ctx.allQuickComments;
  return ctx.quickComments ?? [];
}

/** Attribute pass send to the post that owns the chip (allPosts tablet). */
export function resolveKdsSendingPost<T extends { quickComments: string[] }>(
  messageText: string,
  activePost: T | null,
  posts: T[],
): T | null {
  const trimmed = messageText.trim();
  if (trimmed) {
    const owners = posts.filter((post) =>
      post.quickComments.some((chip) => chip.trim() === trimmed),
    );
    if (owners.length === 1) return owners[0]!;
  }
  return activePost;
}
