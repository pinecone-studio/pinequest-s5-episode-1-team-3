import type { BoardPhraseId, Situation } from "@/lib/phraseBoard";
import type { IconName } from "./types";

// Унших чадвар сул хэрэглэгч бичвэрээс илүү дүрсээр танина.
export const SITUATION_ICONS: Record<Situation, IconName> = {
  daily: "chatbubbles-outline", hospital: "medkit-outline", shop: "cart-outline",
  office: "business-outline", transport: "bus-outline", emergency: "warning-outline",
};

export const PHRASE_ICONS: Record<BoardPhraseId, IconName> = {
  yes: "checkmark-circle-outline", no: "close-circle-outline", repeat: "refresh-outline",
  slower: "speedometer-outline", wait: "hand-left-outline",
  intro: "ear-outline", greeting: "hand-right-outline", thanks: "heart-outline",
  sorry: "sad-outline", goodbye: "exit-outline", helpMe: "help-buoy-outline",
  seeDoctor: "medkit-outline", headache: "medical-outline", stomachache: "body-outline",
  fever: "thermometer-outline", howLongWait: "time-outline",
  howMuch: "pricetag-outline", takeThis: "bag-check-outline", payByCard: "card-outline",
  whereIsIt: "search-outline", tooExpensive: "cash-outline",
  withdrawMoney: "cash-outline", whichWindow: "grid-outline", closingTime: "time-outline",
  needId: "id-card-outline", writeDown: "create-outline",
  busStop: "bus-outline", busRoute: "map-outline", getOffHere: "location-outline", callTaxi: "car-outline",
  needHelp: "alert-circle-outline", ambulance: "medkit", police: "shield-outline",
  lost: "compass-outline", callFamily: "call-outline",
};
