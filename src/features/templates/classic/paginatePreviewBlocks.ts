export type PreviewBlockKind = "heading" | "content";

export interface MeasuredPreviewBlock {
  id: string;
  kind: PreviewBlockKind;
  height: number;
}

/**
 * Distributes measured semantic blocks across pages. Section headings use a
 * one-block look-ahead so they stay with the content that follows them.
 */
export function paginatePreviewBlocks(
  blocks: MeasuredPreviewBlock[],
  firstPageHeaderHeight: number,
  pageContentHeight: number,
): string[][] {
  const pages: string[][] = [[]];
  let currentPage = pages[0];
  let usedHeight = firstPageHeaderHeight;

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (!block || !currentPage) continue;

    const nextBlock = blocks[index + 1];
    const keepWithNextHeight = block.kind === "heading" && nextBlock
      ? nextBlock.height
      : 0;
    const requiredHeight = block.height + keepWithNextHeight;
    const wouldOverflow = usedHeight + requiredHeight > pageContentHeight;

    // The first page also contains the resume header. If the first section
    // cannot fit below it, begin the section on a clean second page.
    if (wouldOverflow && (currentPage.length > 0 || usedHeight > 0)) {
      currentPage = [];
      pages.push(currentPage);
      usedHeight = 0;
    }

    currentPage.push(block.id);
    usedHeight += block.height;
  }

  return pages;
}
