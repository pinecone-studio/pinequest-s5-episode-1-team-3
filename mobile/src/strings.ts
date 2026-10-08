// Every on-screen Mongolian string lives here, grouped by screen.
export const strings = {
  index: {
    title: "Сонсъё",
    modes: {
      home: "Гэр",
      queue: "Дугаар",
      name: "Нэр",
      talk: "Ярих",
    },
    shortcuts: {
      history: "Түүх",
      settings: "Тохиргоо",
      interpreter: "Хэлмэрч",
    },
  },
  home: {
    title: "Гэр",
    back: "Буцах",
    listen: "Сонсох",
    listening: "Сонсож байна",
    tapToStop: "Дахин дарж зогсооно",
    sounds: {
      knock: "Хаалга",
      bell: "Хонх",
      alarm: "Сэрүүлэг",
    },
  },
  talk: {
    title: "Ярих",
    back: "Буцах",
    staff: "Ажилтан",
    // Placeholder until the talk mode transcript comes from the server.
    sampleTranscript: "Та захиалгын дугаараа хэлнэ үү.",
    inputLabel: "Хариу бичих",
    inputPlaceholder: "Миний дугаар 125",
    quickReplies: [
      "Дахин хэлнэ үү",
      "Бичгээр харуулна уу",
      "Удаан ярина уу",
      "Баярлалаа",
    ],
    show: "Харуулах",
  },
  history: {
    title: "Түүх",
    back: "Буцах",
    empty: "Түүх хоосон байна",
    filters: {
      all: "Бүгд",
      home: "Гэр",
      queue: "Дараалал",
      name: "Нэр",
    },
    // Placeholder rows until services/storage exists.
    sample: {
      queue: { title: "А-024 дугаар · 3-р цонх", time: "Өнөөдөр 14:35" },
      knock: { title: "Хаалга тогшив", time: "Өнөөдөр 12:10" },
      doorbell: { title: "Хаалганы хонх", time: "Өнөөдөр 09:02" },
      name: { title: "Нэр дуудсан", time: "Өчигдөр 18:20" },
    },
  },
  settings: {
    title: "Тохиргоо",
    back: "Буцах",
    alerts: "Мэдэгдэл",
    vibration: "Чичиргээ",
    color: "Өнгө",
    light: "Гэрэл",
    appearance: "Харагдац",
    textSize: "Бичиг",
    textSizes: {
      large: "Том",
      xlarge: "Маш том",
    },
  },
} as const;