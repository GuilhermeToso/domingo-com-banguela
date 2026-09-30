/* =============================================================================
   onadate — "Grande Aventura" edition (Como Treinar o Seu Dragão) — CONFIG
   -----------------------------------------------------------------------------
   This is the ONLY file you edit to customize the site.
   No need to touch app.js or styles.css.

   HER_NAME is shown in the invitation title (inviteTitle).
   ============================================================================= */

const CONFIG = {
  // --- who ---
  MY_NAME: "Guilherme",        // shown as the sign-off on the final card
  HER_NAME: "Tayná",

  // --- headings (pt-BR) ---
  inviteTitle: "Tayná, bora fazer alguma coisa comigo no domingo?",
  dateTitle: "Que horas e onde a gente se encontra?",
  placePlaceholder: "Local de encontro (ex: Fonte dos Amores)",
  foodTitle: "E o que você quer fazer domingo?",
  cardKicker: "É uma grande aventura! 🐉",
  signoffLine: "mal posso esperar 💙",

  // --- messages shown when she goes near / tries the "Não" button ---
  noMessages: [
    "Resposta errada 😅",
    "O Banguela não gostou nada disso 😾",
    "Por que você tá tentando o 'não'?? 🙈",
    "Olha a carinha dele... 🥺",
    "Não vou deixar você clicar nisso 😌",
    "Cuidado, ele solta plasma! 🔥",
    "Vou insistir... o 'sim' tá ali ó 👉",
    "Nem o Soluço clicaria nisso 😜",
    "Tenta de novo... no 'sim'! 💙",
    "Dragões não aceitam 'não' 🐉"
  ],

  // --- what to do on Sunday (Poços de Caldas ideas) ---
  foodOptions: [
    { emoji: "🚡", label: "Teleférico + Cristo" },
    { emoji: "🥾", label: "Trilha (Pedra Balão)" },
    { emoji: "🌳", label: "Passeio na praça" },
    { emoji: "⛩️", label: "Recanto Japonês" },
    { emoji: "💧", label: "Fonte dos Amores" },
    { emoji: "♨️", label: "Termas" },
    { emoji: "🎬", label: "Cinema" },
    { emoji: "☕", label: "Um café" },
    { emoji: "🍦", label: "Sorvete" },
    { emoji: "🍕", label: "Pizza" },
    { emoji: "🍣", label: "Sushi" },
    { emoji: "🧺", label: "Piquenique" }
  ],

  // --- the special "I can cook for you" branch ---
  cookOption: {
    emoji: "👨‍🍳",
    label: "ou... eu posso cozinhar pra você",
    prompt: "O que você quer que eu faça? 🍳",
    placeholder: "ex: aquele macarrão especial",
    fallbackDish: "uma surpresa"
  }
};
