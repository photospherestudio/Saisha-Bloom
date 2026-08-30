import type { Milestone } from './types';

export type Activity = {
  activityTitle?: string;
  activityText: string;
  tipText: string;
  frequency?: string;
  benefits?: string[];
  materials?: string[];
};
type ActivityDomain = 'movement_physical' | 'cognitive' | 'language_communication' | 'social_emotional';
type ActivityMilestone = Pick<Milestone, 'domain'> & Partial<Pick<Milestone, 'title'>>;

const milestoneActivities: Array<{ match: RegExp; activity: Activity }> = [
  { match: /feeds .*fingers/i, activity: { activityTitle: 'Make room for self-feeding', activityText: 'Offer soft, bite-sized foods and let your child pick up pieces at their own pace. Give them time to look, reach, grasp, and bring food to their mouth.', tipText: 'Stay close, use foods your child already manages safely, and let a little mess be part of learning.', frequency: 'A few minutes during one meal each day.', benefits: ['Builds hand-to-mouth coordination', 'Supports independence at mealtimes'], materials: ['Soft, bite-sized foods', 'A washable mat or bib'] } },
  { match: /drinks from a cup/i, activity: { activityTitle: 'Practice with an open cup', activityText: 'Offer a small open cup with a little water during meals. Let your child hold it with both hands, take slow sips, and place it down between tries.', tipText: 'Spills are part of learning; keep the cup light and stay close while your child drinks.', frequency: 'Try a few calm sips at one meal each day.', benefits: ['Builds hand and mouth coordination', 'Grows confidence with everyday routines'], materials: ['A small, lightweight open cup', 'A little water'] } },
  { match: /climbs on and off a couch or chair/i, activity: { activityTitle: 'A safe climb-and-down game', activityText: 'Place a cushion near a low, sturdy surface and invite your child to climb up and down with you close by. Let them choose whether to try, pause, or repeat it.', tipText: 'Clear sharp edges and stay within arm’s reach during climbing play.', frequency: 'Short, supervised play sessions a few times each week.', benefits: ['Builds balance and body awareness', 'Practises planning a movement sequence'], materials: ['A clear floor area', 'A low, sturdy surface or firm cushion'] } },
  { match: /tries to use a spoon/i, activity: { activityTitle: 'Scoop, taste, and try again', activityText: 'Offer a child-sized spoon with thick, easy-to-scoop food. Load a little food, hand it over, and let your child guide the spoon to their mouth.', tipText: 'Keep a second spoon nearby so meals stay calm while your child practises.', frequency: 'Offer one relaxed spoon practice at a meal each day.', benefits: ['Strengthens grasp and wrist control', 'Builds independence during meals'], materials: ['A child-sized spoon', 'Thick, easy-to-scoop food'] } },
  { match: /scribbles/i, activity: { activityTitle: 'Marks, dots, and lines', activityText: 'Put out chunky crayons and paper so your child can make marks, dots, and lines. Talk about the colours and shapes without asking for a particular picture.', tipText: 'Use washable materials and let your child lead the drawing.', frequency: 'Five to ten minutes whenever your child is interested.', benefits: ['Builds early hand control', 'Encourages creative expression'], materials: ['Chunky washable crayons', 'Large sheets of paper'] } },
  { match: /walks without holding/i, activity: { activityTitle: 'Walk toward me', activityText: 'Set up a clear path between two steady surfaces and invite your child to walk toward you. Start close together, then give a little more space when they are ready.', tipText: 'Stay close and celebrate each step, stop, and try again.', frequency: 'A few minutes each day in a clear, safe space.', benefits: ['Builds balance and coordination', 'Supports confidence with independent movement'], materials: ['A clear, non-slip floor area', 'A favourite soft toy'] } },
  { match: /copies you doing chores|sweeping with a broom/i, activity: { activityTitle: 'A little helper', activityText: 'Set out a toy broom, cloth, or safe container and invite your child to copy one everyday action. Show one small movement, then give them time to repeat it in their own way.', tipText: 'Choose a safe household task and let the imitation stay playful rather than perfect.', frequency: 'Invite your child to join one everyday chore when it fits your routine.', benefits: ['Builds imitation and attention', 'Connects play with everyday routines'], materials: ['A toy broom or soft cloth', 'A safe, empty container'] } },
  { match: /follows one-step directions/i, activity: { activityTitle: 'One-step listening game', activityText: 'Give one simple direction during play, such as “bring the ball,” and pause for your child to respond. Use gestures only after giving them time to listen.', tipText: 'Use the same short words and celebrate any attempt to follow along.', frequency: 'Use one or two simple directions during play or routines each day.', benefits: ['Builds listening and understanding', 'Supports back-and-forth communication'], materials: ['A familiar toy or household object', 'A quiet moment together'] } },
];

// ponytail: keep one small, original activity bank; expand only after a licensed content review.
const activityBank: Record<number, Record<ActivityDomain, Activity>> = {
  12: {
    movement_physical: { activityText: 'Make a safe floor path with cushions and invite your child to walk, squat, and carry a soft toy.', tipText: 'Stay close and let your child choose the pace.' },
    cognitive: { activityText: 'Hide a familiar toy partly under a cloth and give your child time to find it.', tipText: 'Describe what is happening with simple words like “under” and “found”.' },
    language_communication: { activityText: 'Name everyday objects during routines, then pause so your child can point, gesture, or try a sound.', tipText: 'Treat every attempt to communicate as a turn in the conversation.' },
    social_emotional: { activityText: 'Play a short back-and-forth game with a ball, cup, or block.', tipText: 'Use a warm “my turn, your turn” rhythm without insisting on perfect sharing.' },
  },
  18: {
    movement_physical: { activityText: 'Offer a few sturdy objects to push, pull, stack, or carry across an open space.', tipText: 'Clear the route and supervise climbing or furniture play.' },
    cognitive: { activityText: 'Sort safe household items into two groups, such as big and small or soft and hard.', tipText: 'Let your child explore the categories before naming them.' },
    language_communication: { activityText: 'Look through a picture book and ask where familiar things are, waiting quietly for a response.', tipText: 'Add one or two words to what your child says or points to.' },
    social_emotional: { activityText: 'Use pretend play with a toy phone, cup, or brush and copy your child’s actions.', tipText: 'Follow their idea instead of steering the whole game.' },
  },
  24: {
    movement_physical: { activityText: 'Create a simple stop-and-go game: walk, freeze, tiptoe, and jump together.', tipText: 'Keep the game playful and use a soft, open area.' },
    cognitive: { activityText: 'Give a small puzzle, container game, or matching task and let your child test different solutions.', tipText: 'Offer a hint only after they have had time to try.' },
    language_communication: { activityText: 'Read a short story and invite your child to finish a familiar phrase or point to what happens next.', tipText: 'Repeat their words naturally rather than correcting them.' },
    social_emotional: { activityText: 'Practise taking turns building a small tower or rolling a ball back and forth.', tipText: 'Name the feeling when waiting is hard and model a calm reset.' },
  },
  30: {
    movement_physical: { activityText: 'Set up a mini obstacle route with tape, cushions, or chalk for stepping, crawling, and jumping.', tipText: 'Change one part at a time so the challenge stays manageable.' },
    cognitive: { activityText: 'Invite your child to sort, count, or arrange everyday objects by colour, size, or use.', tipText: 'Ask “how could we group these?” and accept more than one answer.' },
    language_communication: { activityText: 'Talk through a familiar routine using first, next, and last, then ask your child to retell one part.', tipText: 'Give extra time for answers and gestures.' },
    social_emotional: { activityText: 'Use puppets or stuffed toys to act out a small problem and try two friendly solutions.', tipText: 'Keep the story simple and let your child choose what happens.' },
  },
  36: {
    movement_physical: { activityText: 'Play a ball game with gentle kicking, catching, or aiming at a large target.', tipText: 'Celebrate effort, balance, and trying again.' },
    cognitive: { activityText: 'Make a pattern with blocks, spoons, or socks and invite your child to continue or change it.', tipText: 'Use words such as same, different, before, and after.' },
    language_communication: { activityText: 'Look at a book or family photo and ask open questions about what happened and what might happen next.', tipText: 'Build on the answer with a longer sentence.' },
    social_emotional: { activityText: 'Play pretend roles together and practise naming happy, sad, worried, or excited feelings.', tipText: 'Model that feelings can be talked about and managed safely.' },
  },
  48: {
    movement_physical: { activityText: 'Try a simple movement circuit with hopping, balancing, throwing, and a short run.', tipText: 'Use safe distances and let your child repeat the favourite part.' },
    cognitive: { activityText: 'Plan a small sorting, building, or make-believe challenge with more than one possible solution.', tipText: 'Ask your child to explain their idea instead of supplying the answer.' },
    language_communication: { activityText: 'Take turns telling a three-part story from pictures, toys, or something that happened today.', tipText: 'Prompt gently with “and then?” when the story pauses.' },
    social_emotional: { activityText: 'Play a cooperative game with a shared goal, such as building a town or finding hidden objects together.', tipText: 'Practise simple rules, repair after frustration, and taking turns.' },
  },
};

export function activityFor(milestone: ActivityMilestone, childAgeInMonths: number) {
  const title = milestone.title ?? '';
  const specificActivity = milestoneActivities.find(({ match }) => match.test(title))?.activity;
  if (specificActivity) return specificActivity;
  if (childAgeInMonths < 12) return null;
  const ages = Object.keys(activityBank).map(Number);
  const age = [...ages].reverse().find((candidate) => candidate <= childAgeInMonths) ?? ages[0];
  return activityBank[age][milestone.domain as ActivityDomain] ?? null;
}

type ActivityDetailsDefaults = { frequency: string; benefits: string[]; materials: string[] };
const domainDetails: Record<ActivityDomain, ActivityDetailsDefaults> = {
  movement_physical: { frequency: 'A few short sessions each week, following your child’s interest.', benefits: ['Builds coordination and body awareness', 'Supports confidence through active play'], materials: ['A clear, safe space', 'Soft or sturdy everyday objects'] },
  cognitive: { frequency: 'A few minutes during play or an everyday routine.', benefits: ['Builds attention and flexible thinking', 'Encourages curiosity and problem-solving'], materials: ['A few safe household objects', 'A little space to explore'] },
  language_communication: { frequency: 'A few minutes during books, play, or routines each day.', benefits: ['Builds listening and communication', 'Adds words to shared everyday experiences'], materials: ['A familiar toy, book, or object', 'A quiet moment together'] },
  social_emotional: { frequency: 'Short, warm moments whenever they fit your day.', benefits: ['Supports connection and confidence', 'Gives your child practice expressing feelings'], materials: ['A favourite toy or stuffed animal', 'A calm space together'] },
};

export function activityDetailsFor(milestone: ActivityMilestone, childAgeInMonths: number): { activityTitle: string; activityText: string; tipText: string; frequency: string; benefits: string[]; materials: string[] } {
  const activity = activityFor(milestone, childAgeInMonths);
  const defaults = domainDetails[milestone.domain as ActivityDomain] ?? domainDetails.cognitive;
  const title = milestone.title ?? 'this new skill';
  return {
    activityTitle: activity?.activityTitle ?? 'A small way to practise',
    activityText: activity?.activityText ?? `Offer gentle, playful chances to explore ${title.toLowerCase()}.`,
    tipText: activity?.tipText ?? 'Follow your child’s lead and pause when they need a break.',
    frequency: activity?.frequency ?? defaults.frequency,
    benefits: activity?.benefits ?? defaults.benefits,
    materials: activity?.materials ?? defaults.materials,
  };
}
