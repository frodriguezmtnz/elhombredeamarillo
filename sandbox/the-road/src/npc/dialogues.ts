/**
 * Árboles de diálogo — datos locales (sin IA en runtime), 100% originales.
 * Cada NPC tiene nodos con opciones; los efectos marcan flags sencillos.
 */

export interface DialogueOption {
  text: string;
  /** id del nodo siguiente, o 'END' para cerrar */
  next: string;
  /** flag requerido para mostrar la opción */
  requires?: string;
  /** no mostrar si el flag existe */
  hiddenIf?: string;
  /** loop mínimo */
  requiresLoop?: number;
  /** flags que se activan al elegirla */
  set?: string[];
}

export interface DialogueNode {
  id: string;
  text: string;
  options?: DialogueOption[];
}

export interface DialogueTree {
  speaker: string;
  start: string;
  nodes: Record<string, DialogueNode>;
}

export const DIALOGUES: Record<string, DialogueTree> = {
  edith: {
    speaker: 'Edith Vane',
    start: 'root',
    nodes: {
      root: {
        id: 'root',
        text: "You must be the one on the blue wagon. Nobody else drives in anymore. Nobody drives out, either — but you didn't hear that from me.",
        options: [
          { text: 'What do you mean, nobody drives out?', next: 'road' },
          { text: 'How long have you been here?', next: 'years' },
          { text: 'Just passing through.', next: 'passing', set: ['edith_polite'] },
        ],
      },
      road: {
        id: 'road',
        text: 'The road out past the water tower. Walk it at night and count the curves. Then walk it back and count them again. Write the numbers down, if you like keeping proofs.',
        options: [
          { text: 'That makes no sense.', next: 'sense' },
          { text: 'Have you tried it yourself?', next: 'tried' },
        ],
      },
      sense: {
        id: 'sense',
        text: "No. It doesn't. That's rather the point, dear.",
        options: [{ text: '(Leave)', next: 'END' }],
      },
      tried: {
        id: 'tried',
        text: 'I tried things, years ago. Now I keep the store, I wind the clock, I mind my own mileage.',
        options: [{ text: '(Leave)', next: 'END', set: ['edith_warned'] }],
      },
      years: {
        id: 'years',
        text: 'Long enough that I stopped wondering. The town keeps us. Somebody has to keep the town.',
        options: [
          { text: 'Keeps us how?', next: 'keeps' },
          { text: '(Leave)', next: 'END' },
        ],
      },
      keeps: {
        id: 'keeps',
        text: 'Fed. Warm. Remembered. Ask the motel man what happens in the empty rooms, if you want a worse answer.',
        options: [{ text: '(Leave)', next: 'END', set: ['edith_keeps'] }],
      },
      passing: {
        id: 'passing',
        text: 'Of course you are. We all were.',
        options: [{ text: '(Leave)', next: 'END' }],
      },
    },
  },

  jonah: {
    speaker: 'Jonah Beck',
    start: 'root',
    nodes: {
      root: {
        id: 'root',
        text: "Hey. HEY. Your car — it still runs? The battery, the lights — everything works? Mine died a mile out of town and I walked back and the road just... I don't know what the road does.",
        options: [
          { text: 'You tried to leave?', next: 'tried' },
          { text: 'How long have you been here?', next: 'howlong' },
        ],
      },
      tried: {
        id: 'tried',
        text: "All night. I drove with the windows down so I wouldn't sleep. Around four the fog went silver, and then there was the gas station again. My tank was fuller than when I started. Fuller.",
        options: [
          { text: 'The fog went silver?', next: 'silver' },
          { text: '(Leave)', next: 'END' },
        ],
      },
      silver: {
        id: 'silver',
        text: "Like a photograph. Like the negative of a photograph. I don't want to talk about the fog.",
        options: [{ text: '(Leave)', next: 'END', set: ['jonah_fog'] }],
      },
      howlong: {
        id: 'howlong',
        text: 'Three days? I think. My phone says Tuesday. It has said Tuesday for three days.',
        options: [{ text: '(Leave)', next: 'END' }],
      },
    },
  },

  walt: {
    speaker: 'Walt Henner',
    start: 'root',
    nodes: {
      root: {
        id: 'root',
        text: 'Twenty-two years hauling freight. I know every mile of this county — shortcuts included. You want out? I know a way. Never failed me.',
        options: [
          { text: 'Tell me the way.', next: 'way' },
          { text: 'Has it failed you?', next: 'failed' },
        ],
      },
      way: {
        id: 'way',
        text: "Past the tower, past the bends, keep the water on your right. When you see the diner again — that's where you turn around, see. That's the trick. You turn around before it turns you.",
        options: [
          { text: 'That just sounds like coming back.', next: 'back' },
          { text: "Thanks. I'll try it.", next: 'try' },
        ],
      },
      back: {
        id: 'back',
        text: 'Everything here is coming back, friend. Question is whether you do it with the wheel in your hands.',
        options: [{ text: '(Leave)', next: 'END', set: ['walt_hint'] }],
      },
      try: {
        id: 'try',
        text: "Attaboy. And kid — if you pass the burnt wagon twice, don't stop to check the hubcap. It didn't have one the first time either.",
        options: [{ text: '(Leave)', next: 'END', set: ['walt_hint'] }],
      },
      failed: {
        id: 'failed',
        text: "A route doesn't fail you if it brings you home. Ask any trucker.",
        options: [{ text: '(Leave)', next: 'END' }],
      },
    },
  },

  june: {
    speaker: 'June Aldous',
    start: 'root',
    nodes: {
      root: {
        id: 'root',
        text: "Coffee's hot, pie's still warm from Tuesday. Which was today. Which is always today. Sit if you're staying.",
        options: [
          { text: 'Where is everybody from?', next: 'from' },
          { text: "What's outside this town?", next: 'outside' },
          { text: 'Just the coffee, thanks.', next: 'coffee' },
        ],
      },
      from: {
        id: 'from',
        text: 'Around. Some from further around than others. The motel book has more names than the town has beds — you do the arithmetic, I do the pie.',
        options: [{ text: '(Leave)', next: 'END' }],
      },
      outside: {
        id: 'outside',
        text: 'Sweetheart, I stopped putting that on the menu. People used to order it and never finish.',
        options: [
          { text: 'What happened to them?', next: 'happened' },
          { text: '(Leave)', next: 'END' },
        ],
      },
      happened: {
        id: 'happened',
        text: "They got full. There's a difference between full and finished, and the road knows it.",
        options: [{ text: '(Leave)', next: 'END', set: ['june_outside'] }],
      },
      coffee: {
        id: 'coffee',
        text: 'Good. Keep it simple around here. It helps.',
        options: [{ text: '(Leave)', next: 'END' }],
      },
    },
  },

  osei: {
    speaker: 'Mr. Osei',
    start: 'root',
    nodes: {
      root: {
        id: 'root',
        text: '...',
        options: [
          { text: 'Are you all right?', next: 'fine' },
          { text: '(Sit with him a while)', next: 'sit', requiresLoop: 1 },
          { text: '(Leave)', next: 'END' },
        ],
      },
      fine: {
        id: 'fine',
        text: 'I am watching the road. It is watching the bench. We have an understanding.',
        options: [
          { text: 'What do you see?', next: 'see' },
          { text: '(Leave)', next: 'END' },
        ],
      },
      see: {
        id: 'see',
        text: 'Cars. Cars going out and cars coming in. Sometimes the same car. Sometimes the same car with dust from a road it has never driven.',
        options: [{ text: '(Leave)', next: 'END', set: ['osei_seen'] }],
      },
      sit: {
        id: 'sit',
        text: 'You turned around. Good. It respects that, in its way. Or it is amused. After enough Tuesdays the two look alike.',
        options: [
          { text: 'What is IT?', next: 'it' },
          { text: '(Leave)', next: 'END' },
        ],
      },
      it: {
        id: 'it',
        text: 'The thing that measures. The town is a scale, friend. Nobody gets weighed forever. Some just weigh longer.',
        options: [{ text: '(Leave)', next: 'END', set: ['osei_it'] }],
      },
    },
  },
};
