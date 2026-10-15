// Унших чадвар сул хэрэглэгч бичихгүйгээр ярина: нөхцөл байдлаа сонгоод, бэлэн өгүүлбэрийг хэлүүлнэ.
// Бичвэр нь strings.ts-д (talk.board), дуу нь assets/audio/<id>.mp3 (scripts/buildPhraseAudio.ts).
// Дохио бүр signDictionary-д байх ёстой (тест шалгана). Автомат биш, гараар сонгосон:
// автомат хайлт «Гарын үсэг»-ээс [ГАР] гэх мэт буруу утгатай дохио олдог.

export const SITUATIONS = ["daily", "hospital", "shop", "office", "transport", "emergency"] as const;
export type Situation = (typeof SITUATIONS)[number];

export const BOARD_PHRASES = {
  // Байнга харагдах богино хариултууд
  yes: { situation: null, signs: ["тийм"] },
  no: { situation: null, signs: ["үгүй"] },
  repeat: { situation: null, signs: ["дахин", "хэлэх"] },
  slower: { situation: null, signs: ["удаан", "ярих"] },
  wait: { situation: null, signs: ["хүлээх"] },

  intro: { situation: "daily", signs: ["би", "сонсголгүй", "утас", "ярих"] },
  greeting: { situation: "daily", signs: ["сайн байна уу"] },
  thanks: { situation: "daily", signs: ["баярлалаа"] },
  sorry: { situation: "daily", signs: ["уучлаарай"] },
  goodbye: { situation: "daily", signs: ["баяртай"] },
  helpMe: { situation: "daily", signs: ["би", "туслах"] },

  seeDoctor: { situation: "hospital", signs: ["би", "эмч"] },
  headache: { situation: "hospital", signs: ["толгой", "өвдөх"] },
  stomachache: { situation: "hospital", signs: ["ходоод", "өвдөх"] },
  fever: { situation: "hospital", signs: ["халуун"] },
  howLongWait: { situation: "hospital", signs: ["удаан", "хүлээх"] },

  howMuch: { situation: "shop", signs: ["хэд"] },
  takeThis: { situation: "shop", signs: ["авах"] },
  payByCard: { situation: "shop", signs: ["төлөх"] },
  whereIsIt: { situation: "shop", signs: ["хаана"] },
  tooExpensive: { situation: "shop", signs: ["үнэтэй"] },

  withdrawMoney: { situation: "office", signs: ["мөнгө", "авах"] },
  whichWindow: { situation: "office", signs: ["цонх", "очих"] },
  closingTime: { situation: "office", signs: ["хэд", "цаг", "хаах"] },
  needId: { situation: "office", signs: ["иргэний үнэмлэх", "хэрэгтэй"] },
  writeDown: { situation: "office", signs: ["бичих"] },

  busStop: { situation: "transport", signs: ["автобус", "хаана"] },
  busRoute: { situation: "transport", signs: ["автобус", "хаана", "явах"] },
  getOffHere: { situation: "transport", signs: ["би", "энд"] },
  callTaxi: { situation: "transport", signs: ["дуудах"] },

  needHelp: { situation: "emergency", signs: ["туслах", "хэрэгтэй"] },
  ambulance: { situation: "emergency", signs: ["эмнэлэг", "дуудах"] },
  police: { situation: "emergency", signs: ["цагдаа", "дуудах"] },
  lost: { situation: "emergency", signs: ["би", "хаана"] },
  callFamily: { situation: "emergency", signs: ["гэр бүл", "утас"] },
} as const satisfies Record<string, { situation: Situation | null; signs: readonly string[] }>;

export type BoardPhraseId = keyof typeof BOARD_PHRASES;
export const BOARD_PHRASE_IDS = Object.keys(BOARD_PHRASES) as BoardPhraseId[];

/** Байнга харагдах «Тийм», «Үгүй» … */
export const QUICK_REPLIES: readonly BoardPhraseId[] = BOARD_PHRASE_IDS.filter((id) => BOARD_PHRASES[id].situation === null);

export function phrasesFor(situation: Situation): BoardPhraseId[] {
  return BOARD_PHRASE_IDS.filter((id) => BOARD_PHRASES[id].situation === situation);
}
