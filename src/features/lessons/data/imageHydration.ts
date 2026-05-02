// src/features/lessons/data/imageHydration.ts
// Pure helpers that produce a hydrated copy of a Unit/Section by looking up
// image URLs in a per-unit sidecar map. No mutation, no side effects.

import type { Unit, Section, SectionBlock, VocabItem, SectionKey } from "../lesson.types";
import type { UnitSidecar } from "./images";

export function sidecarKeyForUnit(): string {
  return "__unit__";
}

export function sidecarKeyForSection(key: SectionKey): string {
  return `__section__:${key}`;
}

export function hydrateUnit(unit: Unit, sidecar: UnitSidecar): Unit {
  const entry = sidecar[sidecarKeyForUnit()];
  if (!entry) return unit;
  return { ...unit, imageUrl: entry.url };
}

export function hydrateSection(section: Section, sidecar: UnitSidecar): Section {
  const sectionEntry = sidecar[sidecarKeyForSection(section.key)];
  let blocksChanged = false;
  const blocks = section.blocks.map((block) => {
    const next = hydrateBlock(block, sidecar);
    if (next !== block) blocksChanged = true;
    return next;
  });
  // Preserve input reference when nothing applies — SectionPage's useEffect
  // deps are referentially compared and a fresh object would re-trigger
  // markVisited every render, looping.
  if (!sectionEntry && !blocksChanged) return section;
  return {
    ...section,
    blocks: blocksChanged ? blocks : section.blocks,
    ...(sectionEntry ? { imageUrl: sectionEntry.url } : {}),
  };
}

function hydrateBlock(block: SectionBlock, sidecar: UnitSidecar): SectionBlock {
  if (block.type === "vocab-list") {
    let itemsChanged = false;
    const items = block.items.map<VocabItem>((item) => {
      const entry = sidecar[item.id];
      if (!entry) return item;
      itemsChanged = true;
      return { ...item, imageUrl: entry.url };
    });
    // Preserve block reference when no items matched — see hydrateSection
    // for the SectionPage rationale.
    return itemsChanged ? { ...block, items } : block;
  }
  if (block.type === "dialogue" || block.type === "exercise") {
    const entry = sidecar[block.id];
    return entry ? { ...block, imageUrl: entry.url } : block;
  }
  return block;
}
