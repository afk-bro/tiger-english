// src/features/lessons/data/sections/unit-2/vocabulary.ts
import type { Section } from "../../../lesson.types";
import { registerSection } from "../../sectionRegistry";

const vocabulary: Section = {
  id: "u2-vocabulary",
  unitSlug: "unit-2",
  key: "vocabulary",
  blocks: [
    {
      id: "u2-vocab-1-h",
      type: "heading",
      content: "Classroom Objects",
      translations: { vi: "Đồ vật trong lớp học" },
    },
    {
      id: "u2-vocab-1-t",
      type: "text",
      content: "Words for the things you see and use every day in a classroom.",
      translations: { vi: "Các từ chỉ những đồ vật bạn thấy và sử dụng hằng ngày trong lớp học." },
    },
    {
      id: "u2-vocab-1",
      type: "vocab-list",
      items: [
        { id: "u2-v-board", word: "board", translations: { vi: "bảng" } },
        { id: "u2-v-book", word: "book", translations: { vi: "sách" } },
        { id: "u2-v-bookshelf", word: "bookshelf", phonetic: "book-shelf", translations: { vi: "kệ sách" }, imagePrompt: "a tall wooden bookshelf with multiple shelves, each shelf filled with colorful books standing upright" },
        { id: "u2-v-bulletin-board", word: "bulletin board", phonetic: "bul-uh-tin bord", translations: { vi: "bảng tin" }, imagePrompt: "a cork bulletin board with several colorful blank flyers and notes pinned to it with thumbtacks" },
        { id: "u2-v-chair", word: "chair", translations: { vi: "ghế" } },
        { id: "u2-v-clock", word: "clock", translations: { vi: "đồng hồ" } },
        { id: "u2-v-computer", word: "computer", translations: { vi: "máy tính" } },
        { id: "u2-v-desk", word: "desk", translations: { vi: "bàn học" } },
        { id: "u2-v-dictionary", word: "dictionary", phonetic: "dik-shuh-ner-ee", translations: { vi: "từ điển" } },
        { id: "u2-v-globe", word: "globe", phonetic: "glohb", translations: { vi: "quả địa cầu" } },
        { id: "u2-v-map", word: "map", translations: { vi: "bản đồ" }, imagePrompt: "a flat square illustration of an unfolded paper world map showing all continents in pastel colors, no labels, no city names" },
        { id: "u2-v-notebook", word: "notebook", translations: { vi: "vở" } },
        { id: "u2-v-pen", word: "pen", translations: { vi: "bút mực" }, imagePrompt: "a single blue ballpoint pen with a click top and visible plastic body" },
        { id: "u2-v-pencil", word: "pencil", translations: { vi: "bút chì" } },
        { id: "u2-v-ruler", word: "ruler", translations: { vi: "thước kẻ" }, imagePrompt: "a yellow wooden ruler with evenly spaced black tick marks only on one long edge, completely blank everywhere else, no digits, no numerals, no characters, no letters, just plain tick marks" },
        { id: "u2-v-table", word: "table", translations: { vi: "bàn" } },
        { id: "u2-v-wall", word: "wall", translations: { vi: "tường" }, noImage: true },
      ],
    },
    {
      id: "u2-vocab-2-h",
      type: "heading",
      content: "Places at Home",
      translations: { vi: "Các phòng trong nhà" },
    },
    {
      id: "u2-vocab-2-t",
      type: "text",
      content: "Names of the rooms and spaces in a typical home.",
      translations: { vi: "Tên các phòng và khu vực trong một ngôi nhà điển hình." },
    },
    {
      id: "u2-vocab-2",
      type: "vocab-list",
      // Rooms are environments / spaces, not discrete objects — the
      // pipeline skips them. Vocab cards for rooms render text-only.
      items: [
        { id: "u2-v-attic", word: "attic", phonetic: "at-ik", translations: { vi: "gác mái" }, noImage: true },
        { id: "u2-v-basement", word: "basement", phonetic: "beys-muhnt", translations: { vi: "tầng hầm" }, noImage: true },
        { id: "u2-v-bathroom", word: "bathroom", translations: { vi: "phòng tắm" }, noImage: true },
        { id: "u2-v-bedroom", word: "bedroom", translations: { vi: "phòng ngủ" }, noImage: true },
        { id: "u2-v-dining-room", word: "dining room", phonetic: "dahy-ning room", translations: { vi: "phòng ăn" }, noImage: true },
        { id: "u2-v-garage", word: "garage", phonetic: "guh-rahzh", translations: { vi: "nhà để xe" }, noImage: true },
        { id: "u2-v-kitchen", word: "kitchen", translations: { vi: "nhà bếp" }, noImage: true },
        { id: "u2-v-living-room", word: "living room", translations: { vi: "phòng khách" }, noImage: true },
        { id: "u2-v-yard", word: "yard", translations: { vi: "sân" }, noImage: true },
      ],
    },
    {
      id: "u2-vocab-3-h",
      type: "heading",
      content: "Places Around Town",
      translations: { vi: "Các địa điểm trong thị trấn" },
    },
    {
      id: "u2-vocab-3-t",
      type: "text",
      content: "Common places you'll go in everyday life around town.",
      translations: { vi: "Những địa điểm quen thuộc bạn sẽ đến trong cuộc sống hằng ngày quanh thị trấn." },
    },
    {
      id: "u2-vocab-3",
      type: "vocab-list",
      // Town places are buildings / environments — illustrated as
      // exteriors with signage, which would force text into every
      // image. Skip; vocab cards render text-only.
      items: [
        { id: "u2-v-bank", word: "bank", translations: { vi: "ngân hàng" }, noImage: true },
        { id: "u2-v-hospital", word: "hospital", phonetic: "hos-pi-tuhl", translations: { vi: "bệnh viện" }, noImage: true },
        { id: "u2-v-library", word: "library", phonetic: "lahy-brer-ee", translations: { vi: "thư viện" }, noImage: true },
        { id: "u2-v-movie-theater", word: "movie theater", phonetic: "moo-vee thee-uh-ter", translations: { vi: "rạp chiếu phim" }, noImage: true },
        { id: "u2-v-park", word: "park", translations: { vi: "công viên" }, noImage: true },
        { id: "u2-v-post-office", word: "post office", translations: { vi: "bưu điện" }, noImage: true },
        { id: "u2-v-restaurant", word: "restaurant", phonetic: "res-tuh-rahnt", translations: { vi: "nhà hàng" }, noImage: true },
        { id: "u2-v-supermarket", word: "supermarket", phonetic: "soo-per-mahr-kit", translations: { vi: "siêu thị" }, noImage: true },
        { id: "u2-v-zoo", word: "zoo", translations: { vi: "sở thú" }, noImage: true },
      ],
    },
  ],
};

registerSection(vocabulary);
export default vocabulary;
