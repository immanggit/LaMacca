-- Add a new course about Animals
INSERT INTO courses (
  id, 
  title, 
  description, 
  level, 
  duration, 
  image_url, 
  status, 
  created_at, 
  updated_at, 
  category,
  total_enrollment,
  featured,
  instructor
) VALUES (
  'animals-course',
  'Animals and Their Habitats',
  'Learn about different animals, their habitats, and characteristics in English. This course includes interactive activities to help you learn animal vocabulary.',
  'beginner',
  '2 weeks',
  'https://images.unsplash.com/photo-1474511320723-9a56873867b5?q=80&w=2072&auto=format&fit=crop',
  'published',
  NOW(),
  NOW(),
  'vocabulary',
  0,
  true,
  'Sarah Johnson'
);

-- Add activities for the Animals course

-- Activity 1: Drag and Drop - Match animals with their habitats
INSERT INTO activities (
  id,
  title,
  description,
  type,
  course_id,
  status,
  order_index,
  content,
  created_at,
  updated_at
) VALUES (
  'animals-drag-drop',
  'Match Animals with Their Habitats',
  'Drag and drop to match each animal with its natural habitat.',
  'drag_drop',
  'animals-course',
  'published',
  1,
  '{
    "title": "Animal Habitats",
    "instructions": "Drag each animal on the left to its matching habitat on the right.",
    "pairs": [
      {
        "id": "p1",
        "term": "Lion",
        "match": "Savanna"
      },
      {
        "id": "p2",
        "term": "Dolphin",
        "match": "Ocean"
      },
      {
        "id": "p3",
        "term": "Eagle",
        "match": "Mountains"
      },
      {
        "id": "p4",
        "term": "Frog",
        "match": "Pond"
      },
      {
        "id": "p5",
        "term": "Camel",
        "match": "Desert"
      },
      {
        "id": "p6",
        "term": "Monkey",
        "match": "Jungle"
      },
      {
        "id": "p7",
        "term": "Polar Bear",
        "match": "Arctic"
      },
      {
        "id": "p8",
        "term": "Kangaroo",
        "match": "Grassland"
      }
    ]
  }',
  NOW(),
  NOW()
);

-- Activity 2: Match Lines - Connect animals with their characteristics
INSERT INTO activities (
  id,
  title,
  description,
  type,
  course_id,
  status,
  order_index,
  content,
  created_at,
  updated_at
) VALUES (
  'animals-match-lines',
  'Animal Characteristics',
  'Connect each animal with its main characteristic by drawing lines between them.',
  'match_lines',
  'animals-course',
  'published',
  2,
  '{
    "title": "Animal Characteristics",
    "instructions": "Click on an animal and then click on its matching characteristic to connect them with a line.",
    "pairs": [
      {
        "id": "p1",
        "term": "Cheetah",
        "match": "Fastest land animal"
      },
      {
        "id": "p2",
        "term": "Elephant",
        "match": "Largest land mammal"
      },
      {
        "id": "p3",
        "term": "Giraffe",
        "match": "Tallest animal"
      },
      {
        "id": "p4",
        "term": "Owl",
        "match": "Can rotate head 270 degrees"
      },
      {
        "id": "p5",
        "term": "Chameleon",
        "match": "Changes color"
      },
      {
        "id": "p6",
        "term": "Bat",
        "match": "Uses echolocation"
      },
      {
        "id": "p7",
        "term": "Blue Whale",
        "match": "Largest animal on Earth"
      },
      {
        "id": "p8",
        "term": "Hummingbird",
        "match": "Can fly backwards"
      }
    ]
  }',
  NOW(),
  NOW()
);

-- Activity 3: Flip Cards - Match animals with their sounds
INSERT INTO activities (
  id,
  title,
  description,
  type,
  course_id,
  status,
  order_index,
  content,
  created_at,
  updated_at
) VALUES (
  'animals-flip-cards',
  'Animal Sounds',
  'Flip cards to match animals with the sounds they make.',
  'flip_cards',
  'animals-course',
  'published',
  3,
  '{
    "title": "Animal Sounds",
    "instructions": "Flip cards to find matching pairs of animals and the sounds they make.",
    "pairs": [
      {
        "id": "p1",
        "term": "Dog",
        "match": "Bark"
      },
      {
        "id": "p2",
        "term": "Cat",
        "match": "Meow"
      },
      {
        "id": "p3",
        "term": "Cow",
        "match": "Moo"
      },
      {
        "id": "p4",
        "term": "Horse",
        "match": "Neigh"
      },
      {
        "id": "p5",
        "term": "Sheep",
        "match": "Baa"
      },
      {
        "id": "p6",
        "term": "Pig",
        "match": "Oink"
      },
      {
        "id": "p7",
        "term": "Rooster",
        "match": "Cock-a-doodle-doo"
      },
      {
        "id": "p8",
        "term": "Lion",
        "match": "Roar"
      }
    ]
  }',
  NOW(),
  NOW()
);

-- Activity 4: Fill in the Blanks - Animal Facts
INSERT INTO activities (
  id,
  title,
  description,
  type,
  course_id,
  status,
  order_index,
  content,
  created_at,
  updated_at
) VALUES (
  'animals-fill-blanks',
  'Animal Facts',
  'Complete sentences about animal facts by filling in the blanks.',
  'fill_blank',
  'animals-course',
  'published',
  4,
  '{
    "title": "Animal Facts",
    "instructions": "Fill in the blanks with the correct words to complete these animal facts.",
    "sentences": [
      {
        "id": "s1",
        "text": "A group of lions is called a _____.",
        "answer": "pride"
      },
      {
        "id": "s2",
        "text": "_____ are the only mammals that can fly.",
        "answer": "Bats"
      },
      {
        "id": "s3",
        "text": "The blue whale is the _____ animal on Earth.",
        "answer": "largest"
      },
      {
        "id": "s4",
        "text": "Dolphins use _____ to communicate with each other.",
        "answer": "sounds"
      },
      {
        "id": "s5",
        "text": "Penguins cannot _____, but they are excellent swimmers.",
        "answer": "fly"
      },
      {
        "id": "s6",
        "text": "A baby kangaroo is called a _____.",
        "answer": "joey"
      },
      {
        "id": "s7",
        "text": "_____ sleep standing up.",
        "answer": "Horses"
      },
      {
        "id": "s8",
        "text": "The _____ is the fastest land animal and can run up to 70 mph.",
        "answer": "cheetah"
      }
    ]
  }',
  NOW(),
  NOW()
);

-- Activity 5: Video Quiz - Animal Documentary
INSERT INTO activities (
  id,
  title,
  description,
  type,
  course_id,
  status,
  order_index,
  content,
  created_at,
  updated_at
) VALUES (
  'animals-video',
  'Amazing Animals Documentary',
  'Watch a short documentary about amazing animals and answer questions.',
  'video',
  'animals-course',
  'published',
  5,
  '{
    "videoId": "5qap5aO4i9A",
    "title": "Amazing Animals of Our Planet",
    "description": "Watch this fascinating documentary about some of the most amazing animals on our planet.",
    "questions": [
      {
        "id": "q1",
        "text": "Which animal is known as the king of the jungle?",
        "options": ["Tiger", "Lion", "Elephant", "Gorilla"],
        "correct": "Lion"
      },
      {
        "id": "q2",
        "text": "How many hearts does an octopus have?",
        "options": ["1", "2", "3", "4"],
        "correct": "3"
      },
      {
        "id": "q3",
        "text": "Which bird can fly backwards?",
        "options": ["Eagle", "Hummingbird", "Penguin", "Ostrich"],
        "correct": "Hummingbird"
      },
      {
        "id": "q4",
        "text": "What is a group of wolves called?",
        "options": ["Herd", "Flock", "Pack", "School"],
        "correct": "Pack"
      },
      {
        "id": "q5",
        "text": "Which animal has the longest lifespan?",
        "options": ["Elephant", "Giant Tortoise", "Whale", "Human"],
        "correct": "Giant Tortoise"
      }
    ]
  }',
  NOW(),
  NOW()
);

-- Activity 6: Multiple Choice Quiz - Animal Knowledge
INSERT INTO activities (
  id,
  title,
  description,
  type,
  course_id,
  status,
  order_index,
  content,
  created_at,
  updated_at
) VALUES (
  'animals-quiz',
  'Animal Knowledge Quiz',
  'Test your knowledge about animals with this multiple-choice quiz.',
  'quiz',
  'animals-course',
  'published',
  6,
  '{
    "questions": [
      {
        "question": "Which animal is known for its black and white stripes?",
        "options": ["Lion", "Zebra", "Giraffe", "Elephant"],
        "correctAnswer": "Zebra"
      },
      {
        "question": "How many legs does a spider have?",
        "options": ["4", "6", "8", "10"],
        "correctAnswer": "8"
      },
      {
        "question": "Which of these animals is a reptile?",
        "options": ["Frog", "Dolphin", "Crocodile", "Bat"],
        "correctAnswer": "Crocodile"
      },
      {
        "question": "What do you call a baby frog?",
        "options": ["Calf", "Tadpole", "Cub", "Froglet"],
        "correctAnswer": "Tadpole"
      },
      {
        "question": "Which animal is known for its excellent memory?",
        "options": ["Elephant", "Goldfish", "Dog", "Cat"],
        "correctAnswer": "Elephant"
      },
      {
        "question": "Which of these animals hibernates in winter?",
        "options": ["Lion", "Penguin", "Bear", "Giraffe"],
        "correctAnswer": "Bear"
      },
      {
        "question": "What is the largest species of big cat?",
        "options": ["Lion", "Leopard", "Jaguar", "Tiger"],
        "correctAnswer": "Tiger"
      },
      {
        "question": "Which animal can change the color of its skin?",
        "options": ["Snake", "Chameleon", "Frog", "Lizard"],
        "correctAnswer": "Chameleon"
      }
    ]
  }',
  NOW(),
  NOW()
);
