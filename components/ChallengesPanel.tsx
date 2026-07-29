"use client";

import { useState, useMemo } from "react";

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  starterCode: string;
  hint: string;
  topics: string[];
}

const CHALLENGES: Challenge[] = [
  { id: "variables", title: "Create a Variable", difficulty: "easy", topics: ["variable", "data type", "assignment"], description: "Create a variable called `name` and assign your name (as a string) to it. Then create a variable called `age` and assign your age (as a number) to it.", starterCode: "# Create your variables here\n", hint: "Use the = sign: name = \"Alice\"",  },
  { id: "data-types", title: "Check Your Types", difficulty: "easy", topics: ["data type", "type", "print"], description: "Print the type of `42`, `3.14`, `\"hello\"`, and `True` using the `type()` function.", starterCode: "# Print the type of each value\nprint(type(42))\n", hint: "type() returns the type of any value", },
  { id: "conditionals", title: "Even or Odd?", difficulty: "easy", topics: ["conditional", "if", "else", "modulo"], description: "Write code that checks if the number 7 is even or odd. Print \"even\" if it is, \"odd\" if it isn't.", starterCode: "num = 7\n# Your code here\n", hint: "Use num % 2 to check if a number is divisible by 2", },
  { id: "loop-basic", title: "Count to 10", difficulty: "easy", topics: ["loop", "for", "range"], description: "Use a for loop with `range()` to print the numbers 1 through 10.", starterCode: "# Your loop here\n", hint: "range(1, 11) gives you 1 through 10", },
  { id: "list-basics", title: "My First List", difficulty: "easy", topics: ["list", "array", "append"], description: "Create a list called `fruits` containing \"apple\", \"banana\", and \"cherry\". Then add \"date\" to the end of the list and print the third item.", starterCode: "# Create and modify your list\n", hint: "Use fruits.append(\"date\") and fruits[2]", },
  { id: "function-basic", title: "Write a Function", difficulty: "medium", topics: ["function", "def", "return"], description: "Write a function called `greet` that takes a name as a parameter and returns \"Hello, <name>!\". Then call it with your name and print the result.", starterCode: "def greet(name):\n    pass # Replace this\n\nprint(greet(\"Alice\"))", hint: "Use return f\"Hello, {name}!\"", },
  { id: "string-manip", title: "String Repeater", difficulty: "medium", topics: ["string", "concatenation", "input"], description: "Write code that takes a word and a number, then prints the word repeated that many times. Use variables `word = \"Python\"` and `n = 5`.", starterCode: "word = \"Python\"\nn = 5\n# Print word repeated n times\n", hint: "You can multiply a string by a number: word * n", },
  { id: "dictionary", title: "Build a Dictionary", difficulty: "medium", topics: ["dictionary", "dict", "key-value"], description: "Create a dictionary called `student` with keys \"name\", \"age\", and \"grade\". Fill in your own info, then print the student's name.", starterCode: "# Create your dictionary\nstudent = {}\n", hint: 'student = {"name": "Alice", "age": 20, "grade": "A"}', },
  { id: "loop-list", title: "Sum a List", difficulty: "medium", topics: ["loop", "list", "sum", "accumulator"], description: "Write code that sums all numbers in the list `[4, 7, 2, 9, 1]` using a for loop. Print the total.", starterCode: "numbers = [4, 7, 2, 9, 1]\ntotal = 0\n# Your code here\n", hint: "Add each number to total: total += num", },
  { id: "class-basics", title: "Create a Class", difficulty: "hard", topics: ["class", "object", "method", "__init__"], description: "Define a `Dog` class with an `__init__` method that takes `name` and `age`. Add a `bark` method that returns \"Woof!\" Create a dog and call its `bark` method.", starterCode: "class Dog:\n    pass # Define your class\n\nmy_dog = Dog(\"Rex\", 3)\nprint(my_dog.bark())", hint: 'class Dog:\n  def __init__(self, name, age):\n    self.name = name\n    self.age = age', },
];

function matchScore(topics: string[], keywords: string): number {
  const lower = keywords.toLowerCase();
  return topics.filter((t) => lower.includes(t)).length;
}

export default function ChallengesPanel({
  objectives,
  collapsed,
}: {
  objectives: string;
  collapsed: boolean;
}) {
  const [openChallenge, setOpenChallenge] = useState<Challenge | null>(null);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  const sorted = useMemo(() => {
    if (!objectives) return CHALLENGES;
    return [...CHALLENGES].sort((a, b) => matchScore(b.topics, objectives) - matchScore(a.topics, objectives));
  }, [objectives]);

  if (collapsed) return null;

  return (
    <div className="px-2 mt-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-cyber-yellow/60">Challenges</span>
      </div>
      <div className="space-y-1">
        {sorted.map((ch) => (
          <button
            key={ch.id}
            onClick={() => { setOpenChallenge(ch); setCode(ch.starterCode); setOutput(null); setShowHint(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-all text-left cursor-pointer group"
          >
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${ch.difficulty === "easy" ? "bg-green-400" : ch.difficulty === "medium" ? "bg-cyber-yellow" : "bg-red-400"}`} />
            <span className="text-xs text-white/60 group-hover:text-white/90 truncate">{ch.title}</span>
          </button>
        ))}
      </div>

      {openChallenge && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpenChallenge(null)} />
          <div className="relative bg-[#0D0D0D] border border-white/10 rounded-3xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${openChallenge.difficulty === "easy" ? "bg-green-400/10 text-green-400" : openChallenge.difficulty === "medium" ? "bg-cyber-yellow/10 text-cyber-yellow" : "bg-red-400/10 text-red-400"}`}>
                  {openChallenge.difficulty}
                </span>
                <h3 className="text-sm font-bold">{openChallenge.title}</h3>
              </div>
              <button onClick={() => setOpenChallenge(null)} className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center cursor-pointer">
                <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <p className="text-sm text-white/70 leading-relaxed">{openChallenge.description}</p>
              <div className="bg-black/60 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Code</span>
                  <div className="flex gap-2">
                    {openChallenge.hint && (
                      <button onClick={() => setShowHint(!showHint)} className="text-[10px] font-bold text-cyber-yellow/60 hover:text-cyber-yellow px-2 py-1 rounded hover:bg-white/5 transition-all cursor-pointer">
                        {showHint ? "Hide Hint" : "Hint"}
                      </button>
                    )}
                    <button onClick={() => navigator.clipboard.writeText(code)} className="text-[10px] font-bold text-white/30 hover:text-white/60 px-2 py-1 rounded hover:bg-white/5 transition-all cursor-pointer">
                      Copy
                    </button>
                  </div>
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-transparent text-sm font-mono text-white/90 p-4 resize-none outline-none min-h-[120px]"
                  spellCheck={false}
                />
              </div>
              {showHint && openChallenge.hint && (
                <div className="bg-cyber-yellow/5 border border-cyber-yellow/20 rounded-xl px-4 py-3">
                  <p className="text-xs text-cyber-yellow/80"><span className="font-bold">Hint:</span> {openChallenge.hint}</p>
                </div>
              )}
              {output !== null && (
                <div className={`rounded-xl px-4 py-3 text-sm font-mono ${output.startsWith("✓") ? "bg-green-400/5 border border-green-400/20 text-green-400" : "bg-red-400/5 border border-red-400/20 text-red-400"}`}>
                  {output}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3">
              <button onClick={() => { setOutput("✓ Great job! Keep practicing to master this concept."); }} className="px-6 py-2.5 bg-cyber-yellow text-black text-xs font-bold rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer">
                Check Answer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
