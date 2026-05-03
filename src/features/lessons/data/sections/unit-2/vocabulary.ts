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
        { id: "u2-v-bookshelf", word: "bookshelf", phonetic: "book-shelf", translations: { vi: "kệ sách" } },
        { id: "u2-v-bulletin-board", word: "bulletin board", phonetic: "bul-uh-tin bord", translations: { vi: "bảng tin" } },
        { id: "u2-v-chair", word: "chair", translations: { vi: "ghế" } },
        { id: "u2-v-clock", word: "clock", translations: { vi: "đồng hồ" } },
        { id: "u2-v-computer", word: "computer", translations: { vi: "máy tính" } },
        { id: "u2-v-desk", word: "desk", translations: { vi: "bàn học" } },
        { id: "u2-v-dictionary", word: "dictionary", phonetic: "dik-shuh-ner-ee", translations: { vi: "từ điển" } },
        { id: "u2-v-globe", word: "globe", phonetic: "glohb", translations: { vi: "quả địa cầu" } },
        { id: "u2-v-map", word: "map", translations: { vi: "bản đồ" } },
        { id: "u2-v-notebook", word: "notebook", translations: { vi: "vở" } },
        { id: "u2-v-pen", word: "pen", translations: { vi: "bút mực" } },
        { id: "u2-v-pencil", word: "pencil", translations: { vi: "bút chì" } },
        { id: "u2-v-ruler", word: "ruler", translations: { vi: "thước kẻ" } },
        { id: "u2-v-table", word: "table", translations: { vi: "bàn" } },
        { id: "u2-v-wall", word: "wall", translations: { vi: "tường" } },
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
      items: [
        { id: "u2-v-attic", word: "attic", phonetic: "at-ik", translations: { vi: "gác mái" } },
        { id: "u2-v-basement", word: "basement", phonetic: "beys-muhnt", translations: { vi: "tầng hầm" } },
        { id: "u2-v-bathroom", word: "bathroom", translations: { vi: "phòng tắm" } },
        { id: "u2-v-bedroom", word: "bedroom", translations: { vi: "phòng ngủ" } },
        { id: "u2-v-dining-room", word: "dining room", phonetic: "dahy-ning room", translations: { vi: "phòng ăn" } },
        { id: "u2-v-garage", word: "garage", phonetic: "guh-rahzh", translations: { vi: "nhà để xe" } },
        { id: "u2-v-kitchen", word: "kitchen", translations: { vi: "nhà bếp" } },
        { id: "u2-v-living-room", word: "living room", translations: { vi: "phòng khách" } },
        { id: "u2-v-yard", word: "yard", translations: { vi: "sân" } },
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
      items: [
        { id: "u2-v-bank", word: "bank", translations: { vi: "ngân hàng" } },
        { id: "u2-v-hospital", word: "hospital", phonetic: "hos-pi-tl", translations: { vi: "bệnh viện" } },
        { id: "u2-v-library", word: "library", phonetic: "lahy-brer-ee", translations: { vi: "thư viện" } },
        { id: "u2-v-movie-theater", word: "movie theater", phonetic: "moo-vee thee-uh-ter", translations: { vi: "rạp chiếu phim" } },
        { id: "u2-v-park", word: "park", translations: { vi: "công viên" } },
        { id: "u2-v-post-office", word: "post office", translations: { vi: "bưu điện" } },
        { id: "u2-v-restaurant", word: "restaurant", phonetic: "res-tuh-rahnt", translations: { vi: "nhà hàng" } },
        { id: "u2-v-supermarket", word: "supermarket", phonetic: "soo-per-mahr-kit", translations: { vi: "siêu thị" } },
        { id: "u2-v-zoo", word: "zoo", translations: { vi: "sở thú" } },
      ],
    },
  ],
};

registerSection(vocabulary);
export default vocabulary;
