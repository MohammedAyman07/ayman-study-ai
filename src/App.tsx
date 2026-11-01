/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import {
  Calculator,
  Upload,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  BookOpen,
  Sparkles,
  X,
  ChevronRight,
  FlaskConical,
  Dna,
  Microscope,
  Leaf,
  Bird,
  Languages,
  Monitor,
  Briefcase,
  FileSpreadsheet,
  TrendingUp,
  AlignLeft,
  KeyRound,
  Lightbulb,
  AlertTriangle,
  Plus,
  Mic,
  Send,
  Zap,
  MessageCircle,
  LayoutGrid,
  Shield,
  Star,
  Camera,
  Globe,
  Trophy,
  RotateCcw,
  ChevronLeft,
  ClipboardList
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// Secure API Endpoint for Hostinger
const API_URL = '/api.php';

const SYSTEM_INSTRUCTION = `You are an elite AI exam tutor for school and college students (Classes 9–12 and competitive exams). Your ONLY purpose is to deliver 100% ACCURATE, EXAM-PERFECT, and STUDENT-SAFE answers.

⚠️ ABSOLUTE RULES — NEVER VIOLATE:

A. ACCURACY AND CORRECTNESS:
* Every answer you produce MUST be factually correct, verified, and error-free.
* NEVER guess or hallucinate facts, formulas, reactions, dates, or definitions.
* If you are not 100% sure about something, explicitly state "This may need verification" rather than giving a wrong answer.
* All mathematical calculations MUST be step-by-step and arrive at the CORRECT final answer.
* All chemical equations MUST be stoichiometrically balanced and use correct formulae.
* All biology, physics, history, and other subject answers MUST follow standard textbook content.
* DO NOT paraphrase or simplify in a way that introduces errors.

B. ANSWER ONLY WHAT IS ASKED:
* Read the student's question carefully and answer EXACTLY what was asked — nothing more, nothing less.
* If the student asks "define X" — give the definition only.
* If the student asks "derive X" — give the derivation only.
* If the student asks "difference between X and Y" — give a tabular comparison only.
* If the student asks "solve X" — solve it step by step.
* NEVER add unnecessary preambles, lengthy disclaimers, or irrelevant topics.

C. SUBJECT RELEVANCE:
* You MUST ONLY answer questions that are relevant to the subject selected (Math, Physics, Chemistry, Biology, Botany, Zoology, English, Computer Science, Tamil, History, Commerce, Accountancy, Economics).
* If the question is totally off-topic or unrelated to the selected subject, politely say: "This question is outside the scope of [Subject]. Please ask a [Subject]-related question."
* DO NOT answer general knowledge, entertainment, politics, or personal questions.

D. EXAM STYLE OUTPUT FORMAT:
* All answers must be formatted for a formal exam answer sheet.
* Use clear structured sections as described below.
* Never use casual, conversational, or chatbot-style language.
* ALWAYS write as if a top-scoring student is writing in their answer booklet.

STRICT FORMATTING INSTRUCTIONS:

1. SOLUTION SECTION:
* Start with the header: --- SOLUTION ---
* **MANDATORY**: Put a blank line after the header.
* **MATH**: Provide ONLY step-by-step calculations in $$ ... $$ vertical display math blocks. No prose in this section.
* **PHYSICS**: 
  - Derivation → step-by-step math only.
  - Numerical → Given / To Find / Formula / Calculation.
  - Theory/Working → Principle, Construction, Working (in plain text only — NO SVG or diagrams).
* **CHEMISTRY**: 
  - Numerical → Given / To Find / Formula / Calculation.
  - Reactions → Balanced equation (reactants → products).
  - Theory/Experiment → Principle / Procedure / Observation / Conclusion.
* **BIOLOGY/BOTANY/ZOOLOGY**:
  - Anatomy → Introduction / Detailed Structure (in plain text — NO SVG or diagrams) / Functions.
  - Process → Introduction / Step-by-Step Mechanism / Significance.
  - Genetics → Cross / Punnett Square (table) / Results.
* **ENGLISH**:
  - Grammar → Question / Rule Applied / Answer.
  - Essay/Letter → Format / Introduction / Body / Conclusion.
  - Literature → Context / Character Analysis / Theme.
* **COMPUTER SCIENCE**:
  - Programming → Problem Analysis / Algorithm / Code Block.
  - Theory → Introduction / Key Components / Conclusion.
* **TAMIL**: 
  - Grammar → Vina / Vidhi / Vidai.
  - Essay → Thalaipu / Munnurai / Poruladakkam / Mudivurai.
* **HISTORY**: Date / Event / Causes / Effects / Significance.
* **COMMERCE**: Introduction / Key Concepts / Conclusion.
* **ACCOUNTANCY**: Journal Entries or Ledger in correct table format.
* **ECONOMICS**: Core Principle / Analysis / Conclusion.
* **IMPORTANT**: NEVER generate SVG code, diagrams, or any image output. If a student asks to "draw" or "sketch", describe the diagram in detailed plain text instead.

2. FINAL ANSWER SECTION:
* Start with the header: --- FINAL ANSWER ---
* **MANDATORY**: Put a blank line after the header.
* Provide ONLY the final result, conclusion, or one-line summary.

3. EXPLANATION SECTION:
* Start with the header: --- EXPLANATION ---
* **MANDATORY**: Put a blank line after the header.
* Numbered list explaining the logic, principle, or concept behind the answer.

4. EXTRA SECTION:
* Start with the header: --- EXTRA ---
* **MANDATORY**: Put a blank line after the header.
* Include: Key concepts, Alternative methods, Common mistakes to avoid.

5. KEYWORDS SECTION:
* Start with the header: --- KEYWORDS ---
* **MANDATORY**: Put a blank line after the header.
* Provide 5–10 essential keywords or technical terms, comma-separated or bulleted.

MATH AND TABLE FORMATTING RULES:
* Use $$ ... $$ for ALL calculation steps in the SOLUTION section.
* NEVER use $ ... $ for steps in the SOLUTION section.
* Tables MUST NEVER be inside $$ blocks.
* Put a blank line between every $$ block.
* If the student asks for a table or "difference between", MUST output a proper Markdown table with REAL newlines after every row.
* Format: | Header1 | Header2 |\n|---|---|\n| Value1 | Value2 |

NO-MIXING RULE:
* No prose text in SOLUTION (except labels like Given/To Find/Formula).
* No math blocks in EXPLANATION (explain in plain words).

CHEMISTRY RULE:
* For Chemistry problems, include ONLY: SOLUTION, FINAL ANSWER, and KEYWORDS. Omit EXPLANATION and EXTRA.

FINAL REMINDER:
* You are trusted by real students for their exam preparation.
* A WRONG answer can damage a student's studies and grades.
* NEVER sacrifice accuracy for speed or brevity.
* ALWAYS double-check your calculations, formulae, and facts before responding.`;



/**
 * Fixes inline markdown tables produced by AI where the entire table
 * is on a single line: "| A | B | | --- | --- | | val1 | val2 |"
 * Converts them into proper multi-line markdown that remark-gfm can parse.
 */
function fixMarkdownTables(text: string): string {
  // Match a sequence of pipe-separated cells that forms a table on one line
  // Pattern: "| ... | | :--- | :--- | | ... |" all on one line
  return text.replace(
    /(\|[^\n]+\|)(\s*\|\s*[-:]+[-| :]*\|)(\s*\|[^\n]+\|)+/g,
    (match) => {
      // Split on the separator row pattern first
      // A table row is something like "| A | B |"
      // Split by the boundary between a row ending "|" and the next row starting "|"
      // We'll split on "}|{" where } is end of a cell sequence and { is start
      // Strategy: split the whole match into individual rows by detecting "| ... |" segments
      const rows: string[] = [];
      const rowRegex = /\|[^|]*(\|[^|]*)+\|/g;
      let rowMatch;
      while ((rowMatch = rowRegex.exec(match)) !== null) {
        rows.push(rowMatch[0].trim());
      }
      return rows.length > 1 ? rows.join('\n') : match;
    }
  );
}

/**
 * Converts LaTeX delimiters \(...\) and \[...\] into $...$ and $$...$$
 * so that remark-math / KaTeX can process them correctly.
 */
function fixLatex(text: string): string {
  return text
    .replace(/\\\((.+?)\\\)/gs, '$$$1$$')      // \(...\) → $...$
    .replace(/\\\[(.+?)\\\]/gs, '$$$$\n$1\n$$$$'); // \[...\] → $$...$$
}

const BrandLogo = ({ className = "" }: { className?: string }) => (
  <motion.span
    className={cn("outfit-font font-black uppercase tracking-widest flex items-center gap-0.5 cursor-default", className)}
    whileHover={{ scale: 1.05, filter: "brightness(1.1) drop-shadow(0 0 8px rgba(124,58,237,0.3))" }}
    animate={{ y: [0, -1.5, 0] }}
    transition={{ y: { repeat: Infinity, duration: 4, ease: "easeInOut" } }}
    style={{ willChange: 'transform' }}
  >
    <span className="shimmer-text">AYMAN</span>
    <span className="text-slate-900">INFOTECH</span>
  </motion.span>
);

const SubjectCard = ({
  title,
  description,
  icon: Icon,
  onClick,
  accentColor = "#7c3aed"
}: {
  title: string;
  description: string;
  icon: any;
  onClick: () => void;
  accentColor?: string;
}) => {
  const cardRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    cardRef.current.style.setProperty('--mouse-x', `${x}%`);
    cardRef.current.style.setProperty('--mouse-y', `${y}%`);
  };

  return (
    <motion.button
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      whileTap={{ scale: 0.98 }}
      className="group relative premium-subject-card p-8 rounded-[32px] text-left"
    >
      {/* Background Glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${accentColor}15, transparent 40%)`
        }}
      />

      <div className="relative z-10">
        <div className="icon-box-premium mb-6 group-hover:bg-white transition-colors duration-300">
          <Icon className="w-8 h-8 text-violet-600 group-hover:text-violet-700 transition-colors" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-violet-600 transition-colors">
          {title}
        </h2>
        <p className="text-slate-500 text-base leading-relaxed mb-6">
          {description}
        </p>

        <div className="flex items-center text-violet-600 font-bold gap-1 mt-auto">
          <span className="text-sm uppercase tracking-wider">Start Exploring</span>
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
        </div>
      </div>

      {/* Border Beam Effect */}
      <div className="absolute inset-0 border border-white/20 rounded-[32px] pointer-events-none" />
      <div className="absolute inset-px border border-transparent rounded-[31px] group-hover:border-violet-200/50 transition-colors duration-500 pointer-events-none" />
    </motion.button>
  );
};

// ── TN 12TH MCQ DATA ──────────────────────────────────────────────────────
type TN12MCQ = { question: string; options: string[]; answer: string };
type TN12Chapter = { name: string; mcqs: TN12MCQ[] };
type TN12Subject = { name: string; emoji: string; color: string; chapters: TN12Chapter[] };

const TN12_DATA: TN12Subject[] = [
  {
    name: 'Physics',
    emoji: '⚛️',
    color: '#3b82f6',
    chapters: [
      {
        name: 'Unit 1 – Electrostatics',
        mcqs: [
          { question: 'Two identical point charges -q are fixed. A third charge +q placed midway is displaced. In which direction(s) is +q stable?', options: ['(a) A1 and A2', '(b) B1 and B2', '(c) both directions', '(d) No stable'], answer: '(b) B1 and B2' },
          { question: 'Which charge configuration produces a uniform electric field?', options: ['(a) point charge', '(b) uniformly charged infinite line', '(c) uniformly charged infinite plane', '(d) uniformly charged spherical shell'], answer: '(c) uniformly charged infinite plane' },
          { question: 'What is the ratio of charges |q1/q2| for the given electric field line pattern?', options: ['(a) 1/5', '(b) 25/11', '(c) 5', '(d) 11/25'], answer: '(d) 11/25' },
          { question: 'An electric dipole at 30° in a field of 2×10⁵ N/C experiences torque 8 Nm. Dipole length = 1 cm. Charge on dipole is', options: ['(a) 4 mC', '(b) 8 mC', '(c) 5 mC', '(d) 7 mC'], answer: '(b) 8 mC' },
          { question: 'Rank the electric flux through four Gaussian surfaces (with given enclosed charges) in increasing order.', options: ['(a) D < C < B < A', '(b) A < B = C < D', '(c) C < A = B < D', '(d) D > C > B > A'], answer: '(a) D < C < B < A' },
          { question: 'Total electric flux for a closed surface kept inside water (dielectric constant 80) with charge q is', options: ['(a) 80q/ε₀', '(b) q/40ε₀', '(c) q/80ε₀', '(d) q/160ε₀'], answer: '(b) q/40ε₀' },
          { question: 'Two conducting balls (charges q1, q2) touch and separate to the same distance. Force between them will be', options: ['(a) less than before', '(b) same as before', '(c) more than before', '(d) zero'], answer: '(c) more than before' },
          { question: 'Rank the electrostatic potential energies for the given systems of charges in increasing order.', options: ['(a) 1 = 4 < 2 < 3', '(b) 2 = 4 < 3 < 1', '(c) 2 = 3 < 1 < 4', '(d) 3 < 1 < 2 < 4'], answer: '(a) 1 = 4 < 2 < 3' },
          { question: 'Electric field E = 10x î exists in a region. Potential difference V = V₀ − VA where VA is at x = 2 m is', options: ['(a) 10 V', '(b) −20 V', '(c) +20 V', '(d) −10 V'], answer: '(c) +20 V' },
          { question: 'A thin conducting spherical shell of radius R carries charge Q. Correct plot of electrostatic potential vs r is', options: ['(a) Plot a', '(b) Plot b (constant inside, drops outside)', '(c) Plot c', '(d) Plot d'], answer: '(b) Plot b (constant inside, drops outside)' },
          { question: 'Points A and B are at 7 V and −4 V. Work done moving 50 electrons from A to B is', options: ['(a) 8.80×10⁻¹⁷ J', '(b) −8.80×10⁻¹⁷ J', '(c) 4.40×10⁻¹⁷ J', '(d) 5.80×10⁻¹⁷ J'], answer: '(a) 8.80×10⁻¹⁷ J' },
          { question: 'Voltage on a capacitor is increased from V to 2V. Correct conclusion is', options: ['(a) Q same, C doubled', '(b) Q doubled, C doubled', '(c) C same, Q doubled', '(d) Both Q and C remain same'], answer: '(c) C same, Q doubled' },
          { question: 'Parallel plate capacitor: area and distance both doubled. Which quantity changes?', options: ['(a) Capacitance', '(b) Charge', '(c) Voltage', '(d) Energy density'], answer: '(d) Energy density' },
          { question: 'Three capacitors (1μF, 2μF, 2μF) in triangle. Equivalent capacitance between A and C is', options: ['(a) 1 μF', '(b) 2 μF', '(c) 3 μF', '(d) ¼ μF'], answer: '(b) 2 μF' },
          { question: 'Spheres of radii 1 cm and 3 cm are given −1×10⁻² C and 5×10⁻² C. Connected by wire. Final charge on bigger sphere is', options: ['(a) 3×10⁻² C', '(b) 4×10⁻² C', '(c) 1×10⁻² C', '(d) 2×10⁻² C'], answer: '(a) 3×10⁻² C' },
        ]
      },
      {
        name: 'Unit 2 – Current Electricity',
        mcqs: [
          { "question": "The following graph shows current versus voltage values of some unknown conductor. What is the resistance of this conductor?", "options": ["(a) 2 ohm", "(b) 4 ohm", "(c) 8 ohm", "(d) 1 ohm"], "answer": "(a) 2 ohm" },
          { "question": "A wire of resistance 2 ohms per meter is bent to form a circle of radius 1m. The equivalent resistance between its two diametrically opposite points, A and B as shown in the figure is", "options": ["(a) π Ω", "(b) π/2 Ω", "(c) 2π Ω", "(d) π/4 Ω"], "answer": "(a) π Ω" },
          { "question": "A toaster operating at 240 V has a resistance of 120 Ω. Its power is", "options": ["a) 400 W", "b) 2 W", "c) 480 W", "d) 240 W"], "answer": "c) 480 W" },
          { "question": "A carbon resistor of (47 ± 4.7 ) k Ω to be marked with rings of different colours for its identification. The colour code sequence will be", "options": ["a) Yellow – Green – Violet – Gold", "b) Yellow – Violet – Orange – Silver", "c) Violet – Yellow – Orange – Silver", "d) Green – Orange – Violet – Gold"], "answer": "b) Yellow – Violet – Orange – Silver" },
          { "question": "What is the value of resistance of the following resistor? (Colors: Brown, Black, Yellow, Gold)", "options": ["(a) 100 k Ω", "(b) 10 k Ω", "(c) 1 k Ω", "(d) 1000 k Ω"], "answer": "(a) 100 k Ω" },
          { "question": "Two wires of A and B with circular cross section are made up of the same material with equal lengths. Suppose Ra = 3 Rb, then what is the ratio of radius of wire A to that of B?", "options": ["(a) 3", "(b) √3", "(c) 1/√3", "(d) 1/3"], "answer": "(c) 1/√3" },
          { "question": "A wire connected to a power supply of 230 V has power dissipation P1. Suppose the wire is cut into two equal pieces and connected parallel to the same power supply. In this case power dissipation is P2. The ratio P2/P1 is", "options": ["(a) 1", "(b) 2", "(c) 3", "(d) 4"], "answer": "(d) 4" },
          { "question": "In India electricity is supplied for domestic use at 220 V. It is supplied at 110 V in USA. If the resistance of a 60W bulb for use in India is R, the resistance of a 60W bulb for use in USA will be", "options": ["(a) R", "(b) 2R", "(c) R/4", "(d) R/2"], "answer": "(c) R/4" },
          { "question": "In a large building, there are 15 bulbs of 40 W, 5 bulbs of 100 W, 5 fans of 80 W and 1 heater of 1kW are connected. The voltage of electric mains is 220 V. The maximum capacity of the main fuse of the building will be", "options": ["(a) 14 A", "(b) 8 A", "(c) 10 A", "(d) 12 A"], "answer": "(d) 12 A" },
          { "question": "There is a current of 1.0 A in the circuit shown below. What is the resistance of P?", "options": ["a) 1.5 Ω", "b) 2.5 Ω", "c) 3.5 Ω", "d) 4.5 Ω"], "answer": "c) 3.5 Ω" },
          { "question": "What is the current drawn out from the battery? (Circuit: 5V battery, three 15Ω resistors in parallel)", "options": ["a) 1A", "b) 2A", "c) 3A", "d) 4A"], "answer": "a) 1A" },
          { "question": "The temperature coefficient of resistance of a wire is 0.00125 per °C. At 20°C, its resistance is 1 Ω. The resistance of the wire will be 2 Ω at", "options": ["a) 800 °C", "b) 700 °C", "c) 850 °C", "d) 820 °C"], "answer": "d) 820 °C" },
          { "question": "The internal resistance of a 2.1 V cell which gives a current of 0.2 A through a resistance of 10 Ω is", "options": ["a) 0.2 Ω", "b) 0.5 Ω", "c) 0.8 Ω", "d) 1.0 Ω"], "answer": "b) 0.5 Ω" },
          { "question": "A piece of copper and another of germanium are cooled from room temperature to 80 K. The resistance of", "options": ["a) each of them increases", "b) each of them decreases", "c) copper increases and germanium decreases", "d) copper decreases and germanium increases"], "answer": "d) copper decreases and germanium increases" },
          { "question": "In Joule’s heating law, when R and t are constant, if the H is taken along the y axis and I² along the x axis, the graph is", "options": ["a) straight line", "b) parabola", "c) circle", "d) ellipse"], "answer": "a) straight line" }
        ]
      },
      {
        name: 'Unit 3 – Magnetism and Magnetic Effects of Electric Current',
        mcqs: [
          { "question": "The magnetic field at the centre O of the following current loop is", "options": ["(a) (μ₀I/4r) ⊗", "(b) (μ₀I/4r) ⊙", "(c) (μ₀I/2r) ⊗", "(d) (μ₀I/2r) ⊙"], "answer": "(a) (μ₀I/4r) ⊗" },
          { "question": "An electron moves in a straight line inside a charged parallel plate capacitor of uniform charge density σ. The time taken by the electron to cross the parallel plate capacitor undeflected when the plates of the capacitor are kept under constant magnetic field of induction (B) is", "options": ["(a) ε₀lB/σ", "(b) ε₀lB/σl", "(c) ε₀lB/eσ", "(d) ε₀lB/σ"], "answer": "(a) ε₀lB/σ" },
          { "question": "A particle having mass m and charge q accelerated through a potential difference V. Find the force experienced when it is kept under perpendicular magnetic field B.", "options": ["(a) √(2q³BV/m)", "(b) √(q³B²V/2m)", "(c) √(2q³B²V/m)", "(d) √(2q³BV/m³)"], "answer": "(c) √(2q³B²V/m)" },
          { "question": "A circular coil of radius 5 cm and 50 turns carries a current of 3 ampere. The magnetic dipole moment of the coil is nearly", "options": ["(a) 1.0 A m²", "(b) 1.2 A m²", "(c) 0.5 A m²", "(d) 0.8 A m²"], "answer": "(b) 1.2 A m²" },
          { "question": "A thin insulated wire forms a plane spiral of N = 100 tight turns carrying a current I = 8 m A. The radii of inside and outside turns are a = 50 mm and b = 100 mm respectively. The magnetic induction at the centre of the spiral is", "options": ["(a) 5 μT", "(b) 7 μT", "(c) 8 μT", "(d) 10 μT"], "answer": "(b) 7 μT" },
          { "question": "Three wires of equal lengths are bent in the form of loops. One of the loops is circle, another is a semi-circle and the third one is a square. They are placed in a uniform magnetic field and same electric current is passed through them. Which of the following loop configuration will experience greater torque?", "options": ["(a) Circle", "(b) Semi-circle", "(c) Square", "(d) All of them"], "answer": "(a) Circle" },
          { "question": "Two identical coils, each with N turns and radius R are placed coaxially at a distance R. If I is the current passing through the loops in the same direction, then the magnetic field at a point P at a distance of R/2 from the centre of each coil is", "options": ["(a) 8Nμ₀I/√5R", "(b) 8Nμ₀I/5^(3/2)R", "(c) 8Nμ₀I/5R", "(d) 4Nμ₀I/√5R"], "answer": "(b) 8Nμ₀I/5^(3/2)R" },
          { "question": "A wire of length l carrying a current I along the Y direction is kept in a magnetic field given by B = (β/√3)(î + ĵ + k̂) T. The magnitude of Lorentz force acting on the wire is", "options": ["(a) √(2/3)βIl", "(b) √(1/3)βIl", "(c) √2βIl", "(d) √(1/2)βIl"], "answer": "(a) √(2/3)βIl" },
          { "question": "A bar magnet of length l and magnetic moment p_m is bent in the form of an arc as shown in figure. The new magnetic dipole moment will be", "options": ["(a) p_m", "(b) (3/π)p_m", "(c) (2/π)p_m", "(d) (1/2)p_m"], "answer": "(b) (3/π)p_m" },
          { "question": "A non-conducting charged ring carrying a charge of q, mass m and radius r is rotated about its axis with constant angular speed ω. Find the ratio of its magnetic moment with angular momentum is", "options": ["(a) q/m", "(b) 2q/m", "(c) q/2m", "(d) q/4m"], "answer": "(c) q/2m" },
          { "question": "The BH curve for a ferromagnetic material is shown in the figure. The material is placed inside a long solenoid which contains 1000 turns/cm. The current that should be passed in the solenoid to demagnetize the ferromagnet completely is", "options": ["(a) 1.00 mA", "(b) 1.25 mA", "(c) 1.50 mA", "(d) 1.75 mA"], "answer": "(c) 1.50 mA" },
          { "question": "Two short bar magnets have magnetic moments 1.20 Am² and 1.00 Am² respectively. They are kept on a horizontal table parallel to each other with their north poles pointing towards south. They have a common magnetic equator and are separated by a distance of 20.0 cm. The value of the resultant horizontal magnetic induction at the mid-point O of the line joining their centres is (Bh = 3.6 × 10⁻⁵ Wb m⁻²)", "options": ["(a) 3.60 × 10⁻⁵ Wb m⁻²", "(b) 3.5 × 10⁻⁵ Wb m⁻²", "(c) 2.56 × 10⁻⁴ Wb m⁻²", "(d) 2.2 × 10⁻⁴ Wb m⁻²"], "answer": "(c) 2.56 × 10⁻⁴ Wb m⁻²" },
          { "question": "The vertical component of Earth's magnetic field at a place is equal to the horizontal component. What is the value of angle of dip at this place?", "options": ["(a) 30°", "(b) 45°", "(c) 60°", "(d) 90°"], "answer": "(b) 45°" },
          { "question": "A flat dielectric disc of radius R carries an excess charge on its surface. The surface charge density is σ. The disc rotates about an axis perpendicular to its plane passing through the centre with angular velocity ω. Find the magnitude of the torque on the disc if it is placed in a uniform magnetic field whose strength is B which is directed perpendicular to the axis of rotation.", "options": ["(a) 1/4 σωπBR", "(b) 1/2 σωπBR²", "(c) 1/4 σωπBR³", "(d) 1/4 σωπBR⁴"], "answer": "(d) 1/4 σωπBR⁴" },
          { "question": "The potential energy of magnetic dipole whose dipole moment is p_m = (-0.5î + 0.4ĵ) Am² kept in uniform magnetic field B = 0.2î T", "options": ["(a) -0.1 J", "(b) -0.8 J", "(c) 0.1 J", "(d) 0.8 J"], "answer": "(c) 0.1 J" }
        ]
      },
      {
        name: 'Unit 4 – Electromagnetic Induction and Alternating Current',
        mcqs: [
          { question: "An electron moves on a straight line path XY as shown in the figure. The coil abcd is adjacent to the path of the electron. What will be the direction of current, if any, induced in the coil?", options: ["(a) The current will reverse its direction as the electron goes past the coil", "(b) No current will be induced", "(c) abcd", "(d) adcb"], answer: "(a) The current will reverse its direction as the electron goes past the coil" },
          { question: "A thin semi-circular conducting ring (PQR) of radius r is falling with its plane vertical in a horizontal magnetic field B, as shown in the figure. The potential difference developed across the ring when its speed v, is", options: ["(a) Zero", "(b) \\(\\frac{Bv\\pi r^2}{2}\\) and P is at higher potential", "(c) \\(\\pi r Bv\\) and R is at higher potential", "(d) \\(2rBv\\) and R is at higher potential"], answer: "(d) \\(2rBv\\) and R is at higher potential" },
          { question: "The flux linked with a coil at any instant t is given by \\(\\Phi_B = 10t^2 - 50t + 250\\). The induced emf at t = 3 s is", options: ["(a) -190 V", "(b) -10 V", "(c) 10 V", "(d) 190 V"], answer: "(b) -10 V" },
          { question: "When the current changes from +2A to -2A in 0.05 s, an emf of 8 V is induced in a coil. The co-efficient of self-induction of the coil is", options: ["(a) 0.2 H", "(b) 0.4 H", "(c) 0.8 H", "(d) 0.1 H"], answer: "(d) 0.1 H" },
          { question: "The current i flowing in a coil varies with time as shown in the figure. The variation of induced emf with time would be", options: ["(a) Graph a", "(b) Graph b", "(c) Graph c", "(d) Graph d"], answer: "(a) Graph a" },
          { question: "A circular coil with a cross-sectional area of \\(4\\text{ cm}^2\\) has 10 turns. It is placed at the centre of a long solenoid that has 15 turns/cm and a cross-sectional area of \\(10\\text{ cm}^2\\). The axis of the coil coincides with the axis of the solenoid. What is their mutual inductance?", options: ["(a) \\(7.54\\ \\mu\\text{H}\\)", "(b) \\(8.54\\ \\mu\\text{H}\\)", "(c) \\(9.54\\ \\mu\\text{H}\\)", "(d) \\(10.54\\ \\mu\\text{H}\\)" ], answer: "(a) \\(7.54\\ \\mu\\text{H}\\)" },
          { question: "In a transformer, the number of turns in the primary and the secondary are 410 and 1230 respectively. If the current in primary is 6A, then that in the secondary coil is", options: ["(a) 2 A", "(b) 18 A", "(c) 12 A", "(d) 1 A"], answer: "(a) 2 A" },
          { question: "A step-down transformer reduces the supply voltage from 220 V to 11 V and increase the current from 6 A to 100 A. Then its efficiency is", options: ["(a) 1.2", "(b) 0.83", "(c) 0.12", "(d) 0.9"], answer: "(b) 0.83" },
          { question: "In an electrical circuit, R, L, C and AC voltage source are all connected in series. When L is removed from the circuit, the phase difference between the voltage and current in the circuit is \\(\\pi/3\\). Instead, if C is removed from the circuit, the phase difference is again \\(\\pi/3\\). The power factor of the circuit is", options: ["(a) 1/2", "(b) \\(1/\\sqrt{2}\\)", "(c) 1", "(d) \\(\\sqrt{3}/2\\)"], answer: "(c) 1" },
          { question: "In a series RL circuit, the resistance and inductive reactance are the same. Then the phase difference between the voltage and current in the circuit is", options: ["(a) \\(\\pi/4\\)", "(b) \\(\\pi/2\\)", "(c) \\(\\pi/6\\)", "(d) zero"], answer: "(a) \\(\\pi/4\\)" },
          { question: "In a series resonant RLC circuit, the voltage across \\(100\\ \\Omega\\) resistor is 40 V. The resonant frequency \\(\\omega\\) is \\(250\\text{ rad/s}\\). If the value of C is \\(4\\ \\mu\\text{F}\\), then the voltage across L is", options: ["(a) 600 V", "(b) 4000 V", "(c) 400 V", "(d) 1 V"], answer: "(c) 400 V" },
          { question: "An inductor 20 mH, a capacitor \\(50\\ \\mu\\text{F}\\) and a resistor \\(40\\ \\Omega\\) are connected in series across a source of emf \\(V = 10 \\sin 340 t\\). The power loss in AC circuit is", options: ["(a) 0.76 W", "(b) 0.89 W", "(c) 0.46 W", "(d) 0.67 W"], answer: "(c) 0.46 W" },
          { question: "The instantaneous values of alternating current and voltage in a circuit are \\(i = \\frac{1}{\\sqrt{2}}\\sin(100\\pi t)\\text{ A}\\) and \\(v = \\frac{1}{\\sqrt{2}}\\sin(100\\pi t + \\frac{\\pi}{3})\\text{ V}\\). The average power in watts consumed in the circuit is", options: ["(a) 1/4", "(b) \\(\\sqrt{3}/4\\)", "(c) 1/2", "(d) 1/8"], answer: "(d) 1/8" },
          { question: "In an oscillating LC circuit, the maximum charge on the capacitor is Q. The charge on the capacitor when the energy is stored equally between the electric and magnetic fields is", options: ["(a) \\(Q/2\\)", "(b) \\(Q/\\sqrt{3}\\)", "(c) \\(Q/\\sqrt{2}\\)", "(d) Q"], answer: "(c) \\(Q/\\sqrt{2}\\)" },
          { question: "\\(\\frac{20}{\\pi^2}\\text{H}\\) inductor is connected to a capacitor of capacitance C. The value of C in order to impart maximum power at 50 Hz is", options: ["(a) \\(50\\ \\mu\\text{F}\\)", "(b) \\(0.5\\ \\mu\\text{F}\\)", "(c) \\(500\\ \\mu\\text{F}\\)", "(d) \\(5\\ \\mu\\text{F}\\)"], answer: "(d) \\(5\\ \\mu\\text{F}\\)" }
        ]
      },
      {
        name: 'Unit 5 – Electromagnetic Waves',
        mcqs: [
          { question: "The dimension of $\\frac{1}{\\mu_0 \\epsilon_0}$ is", options: ["(a) $[\\text{L T}^{-1}]$", "(b) $[\\text{L}^2 \\text{T}^{-2}]$", "(c) $[\\text{L}^{-1} \\text{T}]$", "(d) $[\\text{L}^{-2} \\text{T}^2]$"], answer: "(b) $[\\text{L}^2 \\text{T}^{-2}]$" },
          { question: "If the amplitude of the magnetic field is $3 \\times 10^{-6}$ T, then amplitude of the electric field for an electromagnetic wave is", options: ["(a) 100 V m⁻¹", "(b) 300 V m⁻¹", "(c) 600 V m⁻¹", "(d) 900 V m⁻¹"], answer: "(d) 900 V m⁻¹" },
          { question: "Which of the following electromagnetic radiations is used for viewing objects through fog?", options: ["(a) microwave", "(b) gamma rays", "(c) X-rays", "(d) infrared"], answer: "(d) infrared" },
          { question: "Which of the following is false for electromagnetic waves?", options: ["(a) transverse", "(b) non-mechanical waves", "(c) longitudinal", "(d) produced by accelerating charges"], answer: "(c) longitudinal" },
          { question: "Consider an oscillator which has a charged particle oscillating about its mean position with a frequency of 300 MHz. The wavelength of electromagnetic waves produced by this oscillator is", options: ["(a) 1 m", "(b) 10 m", "(c) 100 m", "(d) 1000 m"], answer: "(a) 1 m" },
          { question: "The electric and magnetic fields, associated with an electromagnetic wave, propagating along negative X axis can be represented by", options: ["(a) $\\vec{E} = E_y\\hat{j}$ and $\\vec{B} = B_x\\hat{k}$", "(b) $\\vec{E} = E_x\\hat{k}$ and $\\vec{B} = B_x\\hat{j}$", "(c) $\\vec{E} = E_x\\hat{i}$ and $\\vec{B} = B_x\\hat{j}$", "(d) $\\vec{E} = E_y\\hat{j}$ and $\\vec{B} = B_x\\hat{i}$"], answer: "(b) $\\vec{E} = E_x\\hat{k}$ and $\\vec{B} = B_x\\hat{j}$" },
          { question: "In an electromagnetic wave travelling in free space the rms value of the electric field is 3 V m⁻¹. The peak value of the magnetic field is", options: ["(a) $1.414 \\times 10^{-8}$ T", "(b) $1.0 \\times 10^{-8}$ T", "(c) $2.828 \\times 10^{-8}$ T", "(d) $2.0 \\times 10^{-8}$ T"], answer: "(a) $1.414 \\times 10^{-8}$ T" },
          { question: "An e.m. wave is propagating in a medium with a velocity $\\vec{v} = v\\hat{i}$. The instantaneous oscillating electric field of this e.m. wave is along +y-axis, then the direction of oscillating magnetic field of the e.m. wave will be along:", options: ["(a) –y direction", "(b) –x direction", "(c) +z direction", "(d) –z direction"], answer: "(c) +z direction" },
          { question: "If the magnetic monopole exists, then which of the Maxwell's equation is to be modified?", options: ["(a) $\\oint_s \\vec{E} \\cdot d\\vec{A} = \\frac{Q_{enclosed}}{\\epsilon_0}$", "(b) $\\oint_s \\vec{B} \\cdot d\\vec{A} = 0$", "(c) $\\oint_l \\vec{B} \\cdot d\\vec{l} = \\mu_0 i_c + \\mu_0\\epsilon_0 \\frac{d}{dt}\\oint_s \\vec{E} \\cdot d\\vec{A}$", "(d) $\\oint_l \\vec{E} \\cdot d\\vec{l} = -\\frac{d}{dt}\\Phi_B$"], answer: "(b) $\\oint_s \\vec{B} \\cdot d\\vec{A} = 0$" },
          { question: "Fraunhofer lines are an example of _______ spectrum.", options: ["(a) line emission", "(b) line absorption", "(c) band emission", "(d) band absorption"], answer: "(b) line absorption" },
          { question: "Which of the following is an electromagnetic wave?", options: ["(a) α-rays", "(b) β-rays", "(c) γ-rays", "(d) all of them"], answer: "(c) γ-rays" },
          { question: "Which one of them is used to produce a propagating electromagnetic wave?", options: ["(a) an accelerating charge", "(b) a charge moving with constant velocity", "(c) a stationary charge", "(d) an uncharged particle"], answer: "(a) an accelerating charge" },
          { question: "If $E = E_0 \\sin[10^6 x - \\omega t]$ be the electric field of a plane electromagnetic wave, the value of ω is", options: ["(a) $0.3 \\times 10^{-14}$ rad s⁻¹", "(b) $3 \\times 10^{-14}$ rad s⁻¹", "(c) $0.3 \\times 10^{14}$ rad s⁻¹", "(d) $3 \\times 10^{14}$ rad s⁻¹"], answer: "(d) $3 \\times 10^{14}$ rad s⁻¹" },
          { question: "Which of the following is NOT true for electromagnetic waves?", options: ["(a) it transports energy", "(b) it transports momentum", "(c) it transports angular momentum", "(d) in vacuum, it travels with different speeds which depend on their frequency"], answer: "(d) in vacuum, it travels with different speeds which depend on their frequency" },
          { question: "The electric and magnetic fields of an electromagnetic wave are", options: ["(a) in phase and perpendicular to each other", "(b) out of phase and not perpendicular to each other", "(c) in phase and not perpendicular to each other", "(d) out of phase and perpendicular to each other"], answer: "(a) in phase and perpendicular to each other" }
        ]
      },
      {
        name: 'Unit 6 – Ray Optics',
        mcqs: [
          { question: "The speed of light in an isotropic medium depends on,", options: ["(a) its intensity", "(b) its wavelength", "(c) the nature of propagation", "(d) the motion of the source w.r.t medium"], answer: "(b) its wavelength" },
          { question: "A rod of length 10 cm lies along the principal axis of a concave mirror of focal length 10 cm in such a way that its end closer to the pole is 20 cm away from the mirror. The length of the image is (AIPMT Main 2012)", options: ["(a) 2.5 cm", "(b) 5 cm", "(c) 10 cm", "(d) 15 cm"], answer: "(b) 5 cm" },
          { question: "An object is placed in front of a convex mirror of focal length f and the maximum and minimum distance of an object from the mirror such that the image formed is real and magnified. (JEE Main 2009)", options: ["(a) 2f and c", "(b) c and ∞", "(c) f and O", "(d) None of these"], answer: "(d) None of these" },
          { question: "For light incident from air on a slab of refractive index 2, the maximum possible angle of refraction is,", options: ["(a) 30°", "(b) 45°", "(c) 60°", "(d) 90°"], answer: "(a) 30°" },
          { question: "If the velocity and wavelength of light in air is $V_a$ and $\\lambda_a$, and that in water is $V_w$ and $\\lambda_w$, then the refractive index of water is,", options: ["(a) $\\dfrac{V_w}{V_a}$", "(b) $\\dfrac{V_a}{V_w}$", "(c) $\\dfrac{\\lambda_w}{\\lambda_a}$", "(d) $\\dfrac{V_a \\lambda_a}{V_w \\lambda_w}$"], answer: "(b) $\\dfrac{V_a}{V_w}$" },
          { question: "Stars twinkle due to,", options: ["(a) reflection", "(b) total internal reflection", "(c) refraction", "(d) polarisation"], answer: "(c) refraction" },
          { question: "When a biconvex lens of glass having refractive index 1.47 is dipped in a liquid, it acts as a plane sheet of glass. This implies that the liquid must have refractive index,", options: ["(a) less than one", "(b) less than that of glass", "(c) greater than that of glass", "(d) equal to that of glass"], answer: "(d) equal to that of glass" },
          { question: "The radius of curvature of curved surface at a thin planoconvex lens is 10 cm and the refractive index is 1.5. If the plane surface is silvered, then the focal length will be,", options: ["(a) 5 cm", "(b) 10 cm", "(c) 15 cm", "(d) 20 cm"], answer: "(b) 10 cm" },
          { question: "An air bubble in glass slab of refractive index 1.5 (near normal incidence) is 5 cm deep when viewed from one surface and 3 cm deep when viewed from the opposite face. The thickness of the slab is,", options: ["(a) 8 cm", "(b) 10 cm", "(c) 12 cm", "(d) 16 cm"], answer: "(c) 12 cm" },
          { question: "A ray of light travelling in a transparent medium of refractive index n falls, on a surface separating the medium from air at an angle of incidence of 45°. The ray can undergo total internal reflection for the following n,", options: ["(a) n = 1.25", "(b) n = 1.33", "(c) n = 1.4", "(d) n = 1.5"], answer: "(d) n = 1.5" }
        ]
      },
      {
        name: 'Unit 7 – Wave Optics',
        mcqs: [
          { question: "A plane glass is placed over a various coloured letters (violet, green, yellow, red). The letter which appears to be raised more is,", options: ["(a) red", "(b) yellow", "(c) green", "(d) violet"], answer: "(d) violet" },
          { question: "Two point white dots are 1 mm apart on a black paper. They are viewed by eye of pupil diameter 3 mm approximately. The maximum distance at which these dots can be resolved by the eye is, [take wavelength of light, λ = 500 nm]", options: ["(a) 1 m", "(b) 5 m", "(c) 3 m", "(d) 6 m"], answer: "(b) 5 m" },
          { question: "In a Young's double-slit experiment, the slit separation is doubled. To maintain the same fringe spacing on the screen, the screen-to-slit distance D must be changed to,", options: ["(a) 2D", "(b) $D/2$", "(c) $\\sqrt{2}D$", "(d) $D/\\sqrt{2}$"], answer: "(a) 2D" },
          { question: "Two coherent monochromatic light beams of intensities I and 4I are superposed. The maximum and minimum possible intensities in the resulting beam are [IIT-JEE 1988]", options: ["(a) 5I and I", "(b) 5I and 3I", "(c) 9I and I", "(d) 9I and 3I"], answer: "(c) 9I and I" },
          { question: "When light is incident on a soap film of thickness $5 \\times 10^{-5}$ cm, the wavelength of light reflected maximum in the visible region is 5320 Å. Refractive index of the film will be,", options: ["(a) 1.22", "(b) 1.33", "(c) 1.51", "(d) 1.83"], answer: "(b) 1.33" },
          { question: "First diffraction minimum due to a single slit of width $1.0 \\times 10^{-5}$ cm is at 30°. Then wavelength of light used is,", options: ["(a) 400 Å", "(b) 500 Å", "(c) 600 Å", "(d) 700 Å"], answer: "(b) 500 Å" },
          { question: "A ray of light strikes a glass plate at an angle 60°. If the reflected and refracted rays are perpendicular to each other, the refractive index of the glass is,", options: ["(a) $\\sqrt{3}$", "(b) $\\dfrac{3}{2}$", "(c) $\\sqrt{\\dfrac{3}{2}}$", "(d) 2"], answer: "(a) $\\sqrt{3}$" },
          { question: "One of the Young's double slits is covered with a glass plate as shown in figure. The position of central maximum will,", options: ["(a) get shifted downwards", "(b) get shifted upwards", "(c) will remain the same", "(d) data insufficient to conclude"], answer: "(b) get shifted upwards" },
          { question: "Light transmitted by Nicol prism is,", options: ["(a) partially polarised", "(b) unpolarised", "(c) plane polarised", "(d) elliptically polarised"], answer: "(c) plane polarised" },
          { question: "The transverse nature of light is shown in,", options: ["(a) interference", "(b) diffraction", "(c) scattering", "(d) polarisation"], answer: "(d) polarisation" }
        ]
      },
      {
        name: 'Unit 8 – Dual Nature of Radiation and Matter',
        mcqs: [
          { question: "The wavelength $\\lambda_e$ of an electron and $\\lambda_p$ of a photon of same energy E are related by (NEET 2013)", options: ["(a) $\\lambda_p \\propto \\lambda_e$", "(b) $\\lambda_p \\propto \\sqrt{\\lambda_e}$", "(c) $\\lambda_p \\propto \\dfrac{1}{\\sqrt{\\lambda_e}}$", "(d) $\\lambda_p \\propto \\lambda_e^2$"], answer: "(d) $\\lambda_p \\propto \\lambda_e^2$" },
          { question: "In an electron microscope, the electrons are accelerated by a voltage of 14 kV. If the voltage is changed to 224 kV, then the de Broglie wavelength associated with the electrons would", options: ["(a) increase by 2 times", "(b) decrease by 2 times", "(c) decrease by 4 times", "(d) increase by 4 times"], answer: "(c) decrease by 4 times" },
          { question: "The wave associated with a moving particle of mass $3 \\times 10^{-6}$ g has the same wavelength as an electron moving with a velocity $6 \\times 10^6$ m s⁻¹. The velocity of the particle is", options: ["(a) $1.82 \\times 10^{-18}$ m s⁻¹", "(b) $9 \\times 10^{-2}$ m s⁻¹", "(c) $3 \\times 10^{-31}$ m s⁻¹", "(d) $1.82 \\times 10^{-15}$ m s⁻¹"], answer: "(d) $1.82 \\times 10^{-15}$ m s⁻¹" },
          { question: "When a metallic surface is illuminated with radiation of wavelength λ, the stopping potential is V. If the same surface is illuminated with radiation of wavelength 2λ, the stopping potential is V/4. The threshold wavelength for the metallic surface is (NEET 2016)", options: ["(a) 4λ", "(b) 5λ", "(c) $\\dfrac{5}{2}\\lambda$", "(d) 3λ"], answer: "(d) 3λ" },
          { question: "If a light of wavelength 330 nm is incident on a metal with work function 3.55 eV, the electrons are emitted. Then the wavelength of the wave associated with the emitted electron is (Take $h = 6.6 \\times 10^{-34}$ Js)", options: ["(a) $< 2.75 \\times 10^{-9}$ m", "(b) $\\geq 2.75 \\times 10^{-10}$ m", "(c) $\\leq 2.75 \\times 10^{-12}$ m", "(d) $< 2.5 \\times 10^{-10}$ m"], answer: "(b) $\\geq 2.75 \\times 10^{-10}$ m" },
          { question: "A photoelectric surface is illuminated successively by monochromatic light of wavelength λ and λ/2. If the maximum kinetic energy of the emitted photoelectrons in the second case is 3 times that in the first case, the work function of the material is (NEET 2015)", options: ["(a) $\\dfrac{hc}{\\lambda}$", "(b) $\\dfrac{2hc}{\\lambda}$", "(c) $\\dfrac{hc}{3\\lambda}$", "(d) $\\dfrac{hc}{2\\lambda}$"], answer: "(d) $\\dfrac{hc}{2\\lambda}$" },
          { question: "In photoelectric emission, a radiation whose frequency is 4 times threshold frequency of a certain metal is incident on the metal. Then the maximum possible velocity of the emitted electron will be", options: ["(a) $\\sqrt{\\dfrac{h\\nu_0}{m}}$", "(b) $\\sqrt{\\dfrac{6h\\nu_0}{m}}$", "(c) $2\\sqrt{\\dfrac{h\\nu_0}{m}}$", "(d) $\\sqrt{\\dfrac{h\\nu_0}{2m}}$"], answer: "(b) $\\sqrt{\\dfrac{6h\\nu_0}{m}}$" },
          { question: "Two radiations with photon energies 0.9 eV and 3.3 eV respectively are falling on a metallic surface successively. If the work function of the metal is 0.6 eV, then the ratio of maximum speeds of emitted electrons in the two cases will be", options: ["(a) 1:4", "(b) 1:3", "(c) 1:1", "(d) 1:9"], answer: "(b) 1:3" },
          { question: "A light source of wavelength 520 nm emits $1.04 \\times 10^{15}$ photons per second while the second source of 460 nm produces $1.38 \\times 10^{15}$ photons per second. Then the ratio of power of second source to that of first source is", options: ["(a) 1.00", "(b) 1.02", "(c) 1.5", "(d) 0.98"], answer: "(c) 1.5" },
          { question: "If the mean wavelength of light from sun is taken as 550 nm and its mean power as $3.8 \\times 10^{26}$ W, then the number of photons emitted per second from the sun is of the order of", options: ["(a) $10^{45}$", "(b) $10^{42}$", "(c) $10^{54}$", "(d) $10^{51}$"], answer: "(a) $10^{45}$" },
          { question: "The threshold wavelength for a metal surface whose photoelectric work function is 3.313 eV is", options: ["(a) 4125 Å", "(b) 3750 Å", "(c) 6000 Å", "(d) 2062.5 Å"], answer: "(b) 3750 Å" },
          { question: "A light of wavelength 500 nm is incident on a sensitive metal plate of photoelectric work function 1.235 eV. The kinetic energy of the photo electrons emitted is (Take $h = 6.6 \\times 10^{-34}$ Js)", options: ["(a) 0.58 eV", "(b) 2.48 eV", "(c) 1.24 eV", "(d) 1.16 eV"], answer: "(c) 1.24 eV" },
          { question: "Photons of wavelength λ are incident on a metal. The most energetic electrons ejected from the metal are bent into a circular arc of radius R by a perpendicular magnetic field of magnitude B. The work function of the metal is (KVPY-SX 2016)", options: ["(a) $\\dfrac{hc}{\\lambda} - m_e c^2 + \\dfrac{e^2 B^2 R^2}{2m_e}$", "(b) $\\dfrac{hc}{\\lambda} + 2m_e \\left(\\dfrac{eBR}{2m_e}\\right)^2$", "(c) $\\dfrac{hc}{\\lambda} - m_e c^2 - \\dfrac{e^2 B^2 R^2}{2m_e}$", "(d) $\\dfrac{hc}{\\lambda} - \\dfrac{e^2 B^2 R^2}{2m_e}$"], answer: "(d) $\\dfrac{hc}{\\lambda} - \\dfrac{e^2 B^2 R^2}{2m_e}$" },
          { question: "The work functions for metals A, B and C are 1.92 eV, 2.0 eV and 5.0 eV respectively. The metal/metals which will emit photoelectrons for a radiation of wavelength 4100 Å is/are", options: ["(a) A only", "(b) both A and B", "(c) all these metals", "(d) none"], answer: "(b) both A and B" },
          { question: "Emission of electrons by the absorption of heat energy is called ......... emission.", options: ["(a) photoelectric", "(b) field", "(c) thermionic", "(d) secondary"], answer: "(c) thermionic" }
        ]
      },
      {
        name: 'Unit 9 – Atomic and Nuclear Physics',
        mcqs: [
          { question: "Suppose an alpha particle accelerated by a potential of V volt is allowed to collide with a nucleus of atomic number Z, then the distance of closest approach of alpha particle to the nucleus is", options: ["(a) $14.4\\dfrac{V}{Z}$ Å", "(b) $14.4\\dfrac{Z}{V}$ Å", "(c) $1.44\\dfrac{V}{Z}$ Å", "(d) $1.44\\dfrac{Z}{V}$ Å"], answer: "(b) $14.4\\dfrac{Z}{V}$ Å" },
          { question: "In a hydrogen atom, the electron revolving in the fourth orbit, has angular momentum equal to", options: ["(a) $h$", "(b) $\\dfrac{h}{\\pi}$", "(c) $\\dfrac{4h}{\\pi}$", "(d) $\\dfrac{2h}{\\pi}$"], answer: "(d) $\\dfrac{2h}{\\pi}$" },
          { question: "Atomic number of H-like atom with ionization potential 122.4 V for n = 1 is", options: ["(a) 1", "(b) 2", "(c) 3", "(d) 4"], answer: "(c) 3" },
          { question: "The ratio between the radius of first three orbits of hydrogen atom is", options: ["(a) 1:2:3", "(b) 2:4:6", "(c) 1:4:9", "(d) 1:3:5"], answer: "(c) 1:4:9" },
          { question: "The charge of cathode rays particle is", options: ["(a) positive", "(b) negative", "(c) neutral", "(d) not defined"], answer: "(b) negative" },
          { question: "In J.J. Thomson e/m experiment, electrons are accelerated through 2.6 kV enter the region of crossed electric field and magnetic field of strength $3.0 \\times 10^4$ Vm⁻¹ and $1.0 \\times 10^{-3}$ T, respectively, and pass through it undeflected, then the specific charge is", options: ["(a) $1.6 \\times 10^{10}$ Ckg⁻¹", "(b) $1.7 \\times 10^{11}$ Ckg⁻¹", "(c) $1.5 \\times 10^{11}$ Ckg⁻¹", "(d) $1.8 \\times 10^{11}$ Ckg⁻¹"], answer: "(b) $1.7 \\times 10^{11}$ Ckg⁻¹" },
          { question: "The ratio of the wavelengths of radiation emitted for the transition from n = 2 to n = 1 in Li²⁺, He⁺ and H is", options: ["(a) 1:2:3", "(b) 1:4:9", "(c) 4:9:36", "(d) 4:9:36"], answer: "(c) 4:9:36" },
          { question: "The electric potential of an electron is given by $V = V_0 \\ln\\left(\\dfrac{r}{r_0}\\right)$, where $r_0$ is a constant. If Bohr atom model is valid, then variation of radius of $n^{th}$ orbit $r_n$ with the principal quantum number n is", options: ["(a) $r_n \\propto \\dfrac{1}{n}$", "(b) $r_n \\propto n$", "(c) $r_n \\propto \\dfrac{1}{n^2}$", "(d) $r_n \\propto n^2$"], answer: "(b) $r_n \\propto n$" },
          { question: "If the nuclear radius of $^{27}\\text{Al}$ is 3.6 fermi, the approximate nuclear radius of $^{64}\\text{Cu}$ in fermi is", options: ["(a) 2.4", "(b) 1.2", "(c) 4.8", "(d) 3.6"], answer: "(c) 4.8" },
          { question: "The nucleus is approximately spherical in shape. Then the surface area of nucleus having mass number A varies as", options: ["(a) $A^{2/3}$", "(b) $A^{4/3}$", "(c) $A^{1/3}$", "(d) $A^{5/3}$"], answer: "(a) $A^{2/3}$" },
          { question: "The mass of a $^7\\text{Li}$ nucleus is 0.042 u less than the sum of the masses of all its nucleons. The average binding energy per nucleon of $^7\\text{Li}$ nucleus is nearly", options: ["(a) 46 MeV", "(b) 5.6 MeV", "(c) 3.9 MeV", "(d) 23 MeV"], answer: "(b) 5.6 MeV" },
          { question: "$M_p$ denotes the mass of the proton and $M_n$ denotes mass of a neutron. A given nucleus of binding energy B, contains Z protons and N neutrons. The mass M(N,Z) of the nucleus is given by (where c is the speed of light)", options: ["(a) $M(N,Z) = NM_n + ZM_p - Bc^2$", "(b) $M(N,Z) = NM_n + ZM_p + Bc^2$", "(c) $M(N,Z) = NM_n + ZM_p - B/c^2$", "(d) $M(N,Z) = NM_n + ZM_p + B/c^2$"], answer: "(c) $M(N,Z) = NM_n + ZM_p - B/c^2$" },
          { question: "A radioactive nucleus (initial mass number A and atomic number Z) emits two α-particles and 2 positrons. The ratio of number of neutrons to that of proton in the final nucleus will be", options: ["(a) $\\dfrac{A-Z-4}{Z-2}$", "(b) $\\dfrac{A-Z-2}{Z-6}$", "(c) $\\dfrac{A-Z-4}{Z-6}$", "(d) $\\dfrac{A-Z-12}{Z-4}$"], answer: "(b) $\\dfrac{A-Z-2}{Z-6}$" },
          { question: "The half-life period of a radioactive element A is same as the mean life time of another radioactive element B. Initially both have the same number of atoms. Then", options: ["(a) A and B have the same decay rate initially", "(b) A and B decay at the same rate always", "(c) B will decay at faster rate than A", "(d) A will decay at faster rate than B"], answer: "(c) B will decay at faster rate than A" },
          { question: "A radiative element has $N_0$ number of nuclei at t = 0. The number of nuclei remaining after half a half-life (that is, at time $t = \\dfrac{1}{2}T_{1/2}$) is", options: ["(a) $\\dfrac{N_0}{2}$", "(b) $\\dfrac{N_0}{\\sqrt{2}}$", "(c) $\\dfrac{N_0}{4}$", "(d) $\\dfrac{N_0}{8}$"], answer: "(b) $\\dfrac{N_0}{\\sqrt{2}}$" }
        ]
      },
      {
        name: 'Unit 10 – Electronics and Communication',
        mcqs: [
          { question: "The barrier potential of a silicon diode is approximately,", options: ["(a) 0.7 V", "(b) 0.3 V", "(c) 2.0 V", "(d) 2.2 V"], answer: "(a) 0.7 V" },
          { question: "If a small amount of antimony (Sb) is added to germanium crystal, (AIPMT 2011)", options: ["(a) it becomes a p-type semiconductor", "(b) the antimony becomes an acceptor atom", "(c) there will be more free electrons than hole in the semiconductor", "(d) its resistance is increased"], answer: "(c) there will be more free electrons than hole in the semiconductor" },
          { question: "In an unbiased p-n junction, the majority charge carriers (that is, holes) in the p-region diffuse into n-region because of", options: ["(a) the potential difference across the p-n junction", "(b) the higher hole concentration in p-region than that in n-region", "(c) the attraction of free electrons of n-region", "(d) All of the above"], answer: "(b) the higher hole concentration in p-region than that in n-region" },
          { question: "If a positive half-wave rectified voltage is fed to a load resistor, for which part of a cycle there will be current flow through the load?", options: ["(a) 0°–90°", "(b) 90°–180°", "(c) 0°–180°", "(d) 0°–360°"], answer: "(c) 0°–180°" },
          { question: "The zener diode is primarily used as", options: ["(a) Rectifier", "(b) Amplifier", "(c) Oscillator", "(d) Voltage regulator"], answer: "(d) Voltage regulator" },
          { question: "The principle based on which a solar cell operates is", options: ["(a) Diffusion", "(b) Recombination", "(c) Photovoltaic action", "(d) Carrier flow"], answer: "(c) Photovoltaic action" },
          { question: "The light emitted in an LED is due to", options: ["(a) Recombination of charge carriers", "(b) Reflection of light due to lens action", "(c) Amplification of light falling at the junction", "(d) Large current capacity"], answer: "(a) Recombination of charge carriers" },
          { question: "The barrier potential of a p-n junction depends on (i) type of semiconductor material (ii) amount of doping (iii) temperature. Which one of the following is correct? (NEET)", options: ["(a) (i) and (ii) only", "(b) (ii) only", "(c) (ii) and (iii) only", "(d) (i), (ii) and (iii)"], answer: "(d) (i), (ii) and (iii)" },
          { question: "To obtain sustained oscillation in an oscillator,", options: ["(a) Feedback should be positive", "(b) Feedback factor must be unity", "(c) Phase shift must be 0 or 2π", "(d) All the above"], answer: "(d) All the above" },
          { question: "If the input to the NOT gate is A = 1011, its output is", options: ["(a) 0100", "(b) 1000", "(c) 1100", "(d) 0011"], answer: "(a) 0100" },
          { question: "Which one of the following represents forward bias diode? (NEET)", options: ["(a) p-side at 0 V, n-side at −2 V (forward biased)", "(b) p-side at −4 V, n-side at −3 V (reverse biased)", "(c) p-side at −2 V, n-side at +2 V (reverse biased)", "(d) p-side at −3 V, n-side at +5 V (reverse biased)"], answer: "(a) p-side at 0 V, n-side at −2 V (forward biased)" },
          { question: "The given electrical network is equivalent to (NEET)", options: ["(a) AND gate", "(b) OR gate", "(c) NOR gate", "(d) NOT gate"], answer: "(c) NOR gate" },
          { question: "The output of the following circuit is 1 when the input ABC is (NEET)", options: ["(a) 101", "(b) 100", "(c) 110", "(d) 010"], answer: "(a) 101" },
          { question: "The variation of frequency of carrier wave with respect to the amplitude of the modulating signal is called", options: ["(a) Amplitude modulation", "(b) Frequency modulation", "(c) Phase modulation", "(d) Pulse width modulation"], answer: "(b) Frequency modulation" },
          { question: "The frequency range of 3 MHz to 30 MHz is used for", options: ["(a) Ground wave propagation", "(b) Space wave propagation", "(c) Sky wave propagation", "(d) Satellite communication"], answer: "(c) Sky wave propagation" }
        ]
      },
      {
        name: 'Unit 11 – Recent developments in physics',
        mcqs: [
          { question: "The particle size of ZnO material is 30 nm. Based on the dimension it is classified as", options: ["(a) Bulk material", "(b) Nanomaterial", "(c) Soft material", "(d) Magnetic material"], answer: "(b) Nanomaterial" },
          { question: "Which one of the following is the natural nanomaterial.", options: ["(a) Peacock feather", "(b) Peacock beak", "(c) Grain of sand", "(d) Skin of the Whale"], answer: "(a) Peacock feather" },
          { question: "The blue print for making ultra durable synthetic material is mimicked from", options: ["(a) Lotus leaf", "(b) Morpho butterfly", "(c) Parrot fish", "(d) Peacock feather"], answer: "(c) Parrot fish" },
          { question: "The method of making nanomaterial by assembling the atoms is called", options: ["(a) Top down approach", "(b) Bottom up approach", "(c) Cross down approach", "(d) Diagonal approach"], answer: "(b) Bottom up approach" },
          { question: "“Ski wax” is an application of nano product in the field of", options: ["(a) Medicine", "(b) Textile", "(c) Sports", "(d) Automotive industry"], answer: "(c) Sports" },
          { question: "The materials used in Robotics are", options: ["(a) Aluminium and silver", "(b) Silver and gold", "(c) Copper and gold", "(d) Steel and aluminum"], answer: "(d) Steel and aluminum" },
          { question: "The alloys used for muscle wires in Robots are", options: ["(a) Shape memory alloys", "(b) Gold copper alloys", "(c) Gold silver alloys", "(d) Two dimensional alloys"], answer: "(a) Shape memory alloys" },
          { question: "The technology used for stopping the brain from processing pain is", options: ["(a) Precision medicine", "(b) Wireless brain sensor", "(c) Virtual reality", "(d) Radiology"], answer: "(c) Virtual reality" },
          { question: "The particle which gives mass to protons and neutrons are", options: ["(a) Higgs particle", "(b) Einstein particle", "(c) Nanoparticle", "(d) Bulk particle"], answer: "(a) Higgs particle" },
          { question: "The gravitational waves were theoretically proposed by", options: ["(a) Conrad Rontgen", "(b) Marie Curie", "(c) Albert Einstein", "(d) Edward Purcell"], answer: "(c) Albert Einstein" }
        ]
      }
    ]
  },
  {
    name: 'Chemistry',
    emoji: '🧪',
    color: '#10b981',
    chapters: [
      {
        name: 'Unit 1 – Metallurgy',
        mcqs: [
          { question: "Bauxite has the composition", options: ["(a) $\\text{Al}_2\\text{O}_3$", "(b) $\\text{Al}_2\\text{O}_3 \\cdot n\\text{H}_2\\text{O}$", "(c) $\\text{Fe}_2\\text{O}_3 \\cdot 2\\text{H}_2\\text{O}$", "(d) None of these"], answer: "(b) $\\text{Al}_2\\text{O}_3 \\cdot n\\text{H}_2\\text{O}$" },
          { question: "Roasting of sulphide ore gives the gas (A). (A) is a colourless gas. Aqueous solution of (A) is acidic. The gas (A) is", options: ["(a) $\\text{CO}_2$", "(b) $\\text{SO}_3$", "(c) $\\text{SO}_2$", "(d) $\\text{H}_2\\text{S}$"], answer: "(c) $\\text{SO}_2$" },
          { question: "Which one of the following reaction represents calcinations?", options: ["(a) $2\\text{Zn} + \\text{O}_2 \\rightarrow 2\\text{ZnO}$", "(b) $2\\text{ZnS} + 3\\text{O}_2 \\rightarrow 2\\text{ZnO} + 2\\text{SO}_2$", "(c) $\\text{MgCO}_3 \\rightarrow \\text{MgO} + \\text{CO}_2$", "(d) Both (a) and (c)"], answer: "(c) $\\text{MgCO}_3 \\rightarrow \\text{MgO} + \\text{CO}_2$" },
          { question: "The metal oxide which cannot be reduced to metal by carbon is", options: ["(a) PbO", "(b) $\\text{Al}_2\\text{O}_3$", "(c) ZnO", "(d) FeO"], answer: "(b) $\\text{Al}_2\\text{O}_3$" },
          { question: "Which of the metal is extracted by Hall-Heroult process?", options: ["(a) Al", "(b) Ni", "(c) Cu", "(d) Zn"], answer: "(a) Al" },
          { question: "Which of the following statements, about the advantage of roasting of sulphide ore before reduction is not true?", options: ["(a) $\\Delta G_f^\\circ$ of sulphide is greater than those for $\\text{CS}_2$ and $\\text{H}_2\\text{S}$", "(b) $\\Delta G_f^\\circ$ is negative for roasting of sulphide ore to oxide", "(c) Roasting of the sulphide to its oxide is thermodynamically feasible", "(d) Carbon and hydrogen are suitable reducing agents for metal sulphides"], answer: "(d) Carbon and hydrogen are suitable reducing agents for metal sulphides" },
          { question: "Match Column-I with Column-II: A. Cyanide process, B. Froth floatation, C. Electrolytic reduction, D. Zone refining — (i) Ultrapure Ge, (ii) Dressing of ZnS, (iii) Extraction of Al, (iv) Extraction of Au, (v) Purification of Ni", options: ["(a) A-(i), B-(ii), C-(iii), D-(iv)", "(b) A-(iii), B-(iv), C-(v), D-(i)", "(c) A-(iv), B-(ii), C-(iii), D-(i)", "(d) A-(ii), B-(iii), C-(i), D-(v)"], answer: "(c) A-(iv), B-(ii), C-(iii), D-(i)" },
          { question: "Wolframite ore is separated from tinstone by the process of", options: ["(a) Smelting", "(b) Calcination", "(c) Roasting", "(d) Electromagnetic separation"], answer: "(d) Electromagnetic separation" },
          { question: "Which one of the following is not feasible?", options: ["(a) $\\text{Zn}(s) + \\text{Cu}^{2+}(aq) \\rightarrow \\text{Cu}(s) + \\text{Zn}^{2+}(aq)$", "(b) $\\text{Cu}(s) + \\text{Zn}^{2+}(aq) \\rightarrow \\text{Zn}(s) + \\text{Cu}^{2+}(aq)$", "(c) $\\text{Cu}(s) + 2\\text{Ag}^+(aq) \\rightarrow 2\\text{Ag}(s) + \\text{Cu}^{2+}(aq)$", "(d) $\\text{Fe}(s) + \\text{Cu}^{2+}(aq) \\rightarrow \\text{Cu}(s) + \\text{Fe}^{2+}(aq)$"], answer: "(b) $\\text{Cu}(s) + \\text{Zn}^{2+}(aq) \\rightarrow \\text{Zn}(s) + \\text{Cu}^{2+}(aq)$" },
          { question: "Electrochemical process is used to extract", options: ["(a) Iron", "(b) Lead", "(c) Sodium", "(d) Silver"], answer: "(c) Sodium" },
          { question: "Flux is a substance which is used to convert", options: ["(a) Mineral into silicate", "(b) Infusible impurities to soluble impurities", "(c) Soluble impurities to infusible impurities", "(d) All of these"], answer: "(b) Infusible impurities to soluble impurities" },
          { question: "Which one of the following ores is best concentrated by froth-floatation method?", options: ["(a) Magnetite", "(b) Haematite", "(c) Galena", "(d) Cassiterite"], answer: "(c) Galena" },
          { question: "In the extraction of aluminium from alumina by electrolysis, cryolite is added to", options: ["(a) Lower the melting point of alumina", "(b) Remove impurities from alumina", "(c) Decrease the electrical conductivity", "(d) Increase the rate of reduction"], answer: "(a) Lower the melting point of alumina" },
          { question: "Zinc is obtained from ZnO by", options: ["(a) Carbon reduction", "(b) Reduction using silver", "(c) Electrochemical process", "(d) Acid leaching"], answer: "(a) Carbon reduction" },
          { question: "Extraction of gold and silver involves leaching with cyanide ion. Silver is later recovered by (NEET-2017)", options: ["(a) Distillation", "(b) Zone refining", "(c) Displacement with zinc", "(d) Liquation"], answer: "(c) Displacement with zinc" },
          { question: "Considering Ellingham diagram, which of the following metals can be used to reduce alumina? (NEET-2018)", options: ["(a) Fe", "(b) Cu", "(c) Mg", "(d) Zn"], answer: "(c) Mg" },
          { question: "The Van Arkel method for refining uses the reaction: $\\text{Zr (impure)} + 2\\text{I}_2 \\xrightarrow{523\\text{K}} \\text{ZrI}_4$ and $\\text{ZrI}_4 \\xrightarrow{1800\\text{K}} \\text{Zr (pure)} + 2\\text{I}_2$. This method is known as", options: ["(a) Liquation", "(b) Van Arkel process", "(c) Zone refining", "(d) Mond's process"], answer: "(b) Van Arkel process" },
          { question: "Which of the following is used for concentrating ore in metallurgy?", options: ["(a) Leaching", "(b) Roasting", "(c) Froth floatation", "(d) Both (a) and (c)"], answer: "(d) Both (a) and (c)" },
          { question: "The incorrect statement among the following is", options: ["(a) Nickel is refined by Mond's process", "(b) Titanium is refined by Van Arkel's process", "(c) Zinc blende is concentrated by froth floatation", "(d) In the metallurgy of gold, the metal is leached with dilute sodium chloride solution"], answer: "(d) In the metallurgy of gold, the metal is leached with dilute sodium chloride solution" },
          { question: "In the electrolytic refining of copper, which one of the following is used as anode?", options: ["(a) Pure copper", "(b) Impure copper", "(c) Carbon rod", "(d) Platinum electrode"], answer: "(b) Impure copper" },
          { question: "Which of the following plot gives Ellingham diagram?", options: ["(a) $\\Delta S$ vs $T$", "(b) $\\Delta G^\\circ$ vs $T$", "(c) $\\Delta G^\\circ$ vs $\\dfrac{1}{T}$", "(d) $\\Delta G^\\circ$ vs $T^2$"], answer: "(b) $\\Delta G^\\circ$ vs $T$" },
          { question: "In the Ellingham diagram, for the formation of carbon monoxide", options: ["(a) $\\left(\\dfrac{\\Delta S^\\circ}{\\Delta T}\\right)$ is negative", "(b) $\\left(\\dfrac{\\Delta G^\\circ}{\\Delta T}\\right)$ is positive", "(c) $\\left(\\dfrac{\\Delta G^\\circ}{\\Delta T}\\right)$ is negative", "(d) initially $\\left(\\dfrac{\\Delta T}{\\Delta G^\\circ}\\right)$ is positive, after 700°C $\\left(\\dfrac{\\Delta G^\\circ}{\\Delta T}\\right)$ is negative"], answer: "(c) $\\left(\\dfrac{\\Delta G^\\circ}{\\Delta T}\\right)$ is negative" },
          { question: "Which of the following reduction is not thermodynamically feasible?", options: ["(a) $\\text{Cr}_2\\text{O}_3 + 2\\text{Al} \\rightarrow \\text{Al}_2\\text{O}_3 + 2\\text{Cr}$", "(b) $\\text{Al}_2\\text{O}_3 + 2\\text{Cr} \\rightarrow \\text{Cr}_2\\text{O}_3 + 2\\text{Al}$", "(c) $3\\text{TiO}_2 + 4\\text{Al} \\rightarrow 2\\text{Al}_2\\text{O}_3 + 3\\text{Ti}$", "(d) None of these"], answer: "(b) $\\text{Al}_2\\text{O}_3 + 2\\text{Cr} \\rightarrow \\text{Cr}_2\\text{O}_3 + 2\\text{Al}$" },
          { question: "Which of the following is not true with respect to Ellingham diagram?", options: ["(a) Free energy changes follow a straight line. Deviation occurs when there is a phase change.", "(b) The graph for the formation of $\\text{CO}_2$ is a straight line almost parallel to free energy axis.", "(c) Negative slope of CO shows that it becomes more stable with increase in temperature.", "(d) Positive slope of metal oxides shows that their stabilities decrease with increase in temperature."], answer: "(d) Positive slope of metal oxides shows that their stabilities decrease with increase in temperature." }
        ]
      },
      {
        name: 'Unit 2 – p-Block Elements',
        mcqs: [
          { question: "An aqueous solution of borax is", options: ["(a) neutral", "(b) acidic", "(c) basic", "(d) amphoteric"], answer: "(c) basic" },
          { question: "Boric acid is an acid because its molecule (NEET)", options: ["(a) contains replaceable H⁺ ion", "(b) gives up a proton", "(c) combines with proton to form water molecule", "(d) accepts OH⁻ from water, releasing proton"], answer: "(d) accepts OH⁻ from water, releasing proton" },
          { question: "Which among the following is not a borane?", options: ["(a) $\\text{B}_2\\text{H}_6$", "(b) $\\text{B}_3\\text{H}_8$", "(c) $\\text{B}_4\\text{H}_{10}$", "(d) none of these"], answer: "(b) $\\text{B}_3\\text{H}_8$" },
          { question: "Which of the following metals has the largest abundance in the earth's crust?", options: ["(a) Aluminium", "(b) Calcium", "(c) Magnesium", "(d) Sodium"], answer: "(a) Aluminium" },
          { question: "In diborane, the number of electrons that accounts for banana bonds is", options: ["(a) six", "(b) two", "(c) four", "(d) three"], answer: "(c) four" },
          { question: "The element that does not show catenation among the following p-block elements is", options: ["(a) Carbon", "(b) Silicon", "(c) Lead", "(d) Germanium"], answer: "(c) Lead" },
          { question: "Carbon atoms in fullerene with formula $\\text{C}_{60}$ have", options: ["(a) $sp^3$ hybridised", "(b) $sp$ hybridised", "(c) $sp^2$ hybridised", "(d) partially $sp^2$ and partially $sp^3$ hybridised"], answer: "(c) $sp^2$ hybridised" },
          { question: "Oxidation state of carbon in its hydrides", options: ["(a) +4", "(b) −4", "(c) +3", "(d) +2"], answer: "(b) −4" },
          { question: "The basic structural unit of silicates is (NEET)", options: ["(a) $(\\text{SiO}_4)^{4-}$", "(b) $(\\text{SiO}_4)^{2-}$", "(c) $(\\text{SiO})^{2-}$", "(d) $(\\text{SiO}_4)^{4+}$"], answer: "(a) $(\\text{SiO}_4)^{4-}$" },
          { question: "The repeating unit in silicone is", options: ["(a) $\\text{SiO}_2$", "(b) $-\\text{Si}-\\text{C}-$ with R groups", "(c) $\\text{R}-\\text{O}-\\text{Si}-\\text{O}$ (siloxane backbone)", "(d) $-\\text{Si}-\\text{O}-\\text{O}-\\text{R}$"], answer: "(c) $\\text{R}-\\text{O}-\\text{Si}-\\text{O}$ (siloxane backbone)" },
          { question: "Which of these is not a monomer for a high molecular mass silicone polymer?", options: ["(a) $\\text{Me}_2\\text{SiCl}$", "(b) $\\text{PhSiCl}_3$", "(c) $\\text{MeSiCl}_3$", "(d) $\\text{Me}_2\\text{SiCl}_2$"], answer: "(a) $\\text{Me}_2\\text{SiCl}$" },
          { question: "Which of following is not $sp^2$ hybridised?", options: ["(a) Graphite", "(b) Graphene", "(c) Fullerene", "(d) Dry ice"], answer: "(d) Dry ice" },
          { question: "The geometry at which carbon atom in diamond are bonded to each other is", options: ["(a) Tetrahedral", "(b) Hexagonal", "(c) Octahedral", "(d) None of these"], answer: "(a) Tetrahedral" },
          { question: "Which of the following statements is not correct?", options: ["(a) Beryl is a cyclic silicate", "(b) $\\text{Mg}_2\\text{SiO}_4$ is an orthosilicate", "(c) $\\text{SiO}_4^{4+}$ is the basic structural unit of silicates", "(d) Feldspar is not aluminosilicate"], answer: "(d) Feldspar is not aluminosilicate" },
          { question: "Match Column-I with Column-II: A. Borazole, B. Boric acid, C. Quartz, D. Borax — 1. $\\text{B(OH)}_3$, 2. $\\text{B}_3\\text{N}_3\\text{H}_6$, 3. $\\text{Na}_2[\\text{B}_4\\text{O}_5(\\text{OH})_4] \\cdot 8\\text{H}_2\\text{O}$, 4. $\\text{SiO}_2$", options: ["(a) A-2, B-1, C-4, D-3", "(b) A-1, B-2, C-4, D-3", "(c) A-1, B-2, C-4, D-3", "(d) None of these"], answer: "(a) A-2, B-1, C-4, D-3" },
          { question: "Duralumin is an alloy of", options: ["(a) Cu, Mn", "(b) Cu, Al, Mg", "(c) Al, Mn", "(d) Al, Cu, Mn, Mg"], answer: "(d) Al, Cu, Mn, Mg" },
          { question: "The compound that is used in nuclear reactors as protective shields and control rods is", options: ["(a) Metal borides", "(b) Metal oxides", "(c) Metal carbonates", "(d) Metal carbide"], answer: "(a) Metal borides" },
          { question: "The stability of +1 oxidation state increases in the sequence", options: ["(a) Al < Ga < In < Tl", "(b) Tl < In < Ga < Al", "(c) In < Tl < Ga < Al", "(d) Ga < In < Al < Tl"], answer: "(a) Al < Ga < In < Tl" }
        ]
      },
      {
        name: 'Unit 3 – p-Block Elements (Groups 15–18)',
        mcqs: [
          { question: "In which of the following, $\\text{NH}_3$ is not used?", options: ["(a) Nessler's reagent", "(b) Reagent for the analysis of IV group basic radical", "(c) Reagent for the analysis of III group basic radical", "(d) Tollen's reagent"], answer: "(b) Reagent for the analysis of IV group basic radical" },
          { question: "Which is true regarding nitrogen?", options: ["(a) least electronegative element", "(b) has low ionisation enthalpy than oxygen", "(c) d-orbitals available", "(d) ability to form $p\\pi - p\\pi$ bonds with itself"], answer: "(d) ability to form $p\\pi - p\\pi$ bonds with itself" },
          { question: "An element belongs to group 15 and 3rd period of the periodic table, its electronic configuration would be", options: ["(a) $1s^2\\, 2s^2\\, 2p^6$", "(b) $1s^2\\, 2s^2\\, 2p^3$", "(c) $1s^2\\, 2s^2\\, 2p^6\\, 3s^2\\, 3p^2$", "(d) $1s^2\\, 2s^2\\, 2p^6\\, 3s^2\\, 3p^3$"], answer: "(d) $1s^2\\, 2s^2\\, 2p^6\\, 3s^2\\, 3p^3$" },
          { question: "Solid (A) reacts with strong aqueous NaOH liberating a foul smelling gas (B) which spontaneously burns in air giving smoky rings. A and B are respectively", options: ["(a) $\\text{P}_4$(red) and $\\text{PH}_3$", "(b) $\\text{P}_4$(white) and $\\text{PH}_3$", "(c) $\\text{S}_8$ and $\\text{H}_2\\text{S}$", "(d) $\\text{P}_4$(white) and $\\text{H}_2\\text{S}$"], answer: "(b) $\\text{P}_4$(white) and $\\text{PH}_3$" },
          { question: "On hydrolysis, $\\text{PCl}_5$ gives", options: ["(a) $\\text{H}_3\\text{PO}_2$", "(b) $\\text{PH}_3$", "(c) $\\text{H}_3\\text{PO}_4$", "(d) $\\text{POCl}_3$"], answer: "(c) $\\text{H}_3\\text{PO}_4$" },
          { question: "$\\text{P}_4\\text{O}_6$ reacts with cold water to give", options: ["(a) $\\text{H}_3\\text{PO}_4$", "(b) $\\text{H}_4\\text{P}_2\\text{O}_7$", "(c) $\\text{HPO}_3$", "(d) $\\text{H}_3\\text{PO}_3$"], answer: "(d) $\\text{H}_3\\text{PO}_3$" },
          { question: "The basicity of pyrophosphorous acid ($\\text{H}_4\\text{P}_2\\text{O}_5$) is", options: ["(a) 4", "(b) 2", "(c) 3", "(d) 5"], answer: "(b) 2" },
          { question: "The molarity of given orthophosphoric acid solution is 2M. Its normality is", options: ["(a) 6N", "(b) 4N", "(c) 2N", "(d) none of these"], answer: "(a) 6N" },
          { question: "Assertion: bond dissociation energy of fluorine is greater than chlorine gas. Reason: chlorine has more electronic repulsion than fluorine.", options: ["(a) Both assertion and reason are true and reason is the correct explanation", "(b) Both assertion and reason are true but reason is not the correct explanation", "(c) Assertion is true but reason is false", "(d) Both assertion and reason are false"], answer: "(d) Both assertion and reason are false" },
          { question: "Among the following, which is the strongest oxidizing agent?", options: ["(a) $\\text{Cl}_2$", "(b) $\\text{F}_2$", "(c) $\\text{Br}_2$", "(d) $\\text{I}_2$"], answer: "(b) $\\text{F}_2$" },
          { question: "The correct order of the thermal stability of hydrogen halide is", options: ["(a) HI > HBr > HCl > HF", "(b) HF > HCl > HBr > HI", "(c) HCl > HF > HBr > HI", "(d) HI > HCl > HF > HBr"], answer: "(b) HF > HCl > HBr > HI" },
          { question: "Which one of the following compounds is not formed?", options: ["(a) $\\text{XeOF}_4$", "(b) $\\text{XeO}_3$", "(c) $\\text{XeF}_2$", "(d) $\\text{NeF}_2$"], answer: "(d) $\\text{NeF}_2$" },
          { question: "Most easily liquefiable gas is", options: ["(a) Ar", "(b) Ne", "(c) He", "(d) Kr"], answer: "(d) Kr" },
          { question: "$\\text{XeF}_6$ on complete hydrolysis produces", options: ["(a) $\\text{XeOF}_4$", "(b) $\\text{XeO}_2\\text{F}_2$", "(c) $\\text{XeO}_3$", "(d) $\\text{XeO}_2$"], answer: "(c) $\\text{XeO}_3$" },
          { question: "Which of the following is strongest acid among all?", options: ["(a) HI", "(b) HF", "(c) HBr", "(d) HCl"], answer: "(a) HI" },
          { question: "Which one of the following orders is correct for the bond dissociation enthalpy of halogen molecules? (NEET)", options: ["(a) $\\text{Br}_2 > \\text{I}_2 > \\text{F}_2 > \\text{Cl}_2$", "(b) $\\text{F}_2 > \\text{Cl}_2 > \\text{Br}_2 > \\text{I}_2$", "(c) $\\text{I}_2 > \\text{Br}_2 > \\text{Cl}_2 > \\text{F}_2$", "(d) $\\text{Cl}_2 > \\text{Br}_2 > \\text{F}_2 > \\text{I}_2$"], answer: "(d) $\\text{Cl}_2 > \\text{Br}_2 > \\text{F}_2 > \\text{I}_2$" },
          { question: "Among the following the correct order of acidity is (NEET)", options: ["(a) $\\text{HClO} < \\text{HClO} < \\text{HClO}_3 < \\text{HClO}_4$", "(b) $\\text{HClO}_4 < \\text{HClO}_3 < \\text{HClO} < \\text{HClO}_2$", "(c) $\\text{HClO}_4 < \\text{HClO}_3 < \\text{HClO}_2 < \\text{HClO}$", "(d) $\\text{HClO} < \\text{HClO}_2 < \\text{HClO}_3 < \\text{HClO}_4$"], answer: "(d) $\\text{HClO} < \\text{HClO}_2 < \\text{HClO}_3 < \\text{HClO}_4$" },
          { question: "When copper is heated with conc $\\text{HNO}_3$ it produces", options: ["(a) $\\text{Cu(NO}_3)_2$, NO and $\\text{NO}_2$", "(b) $\\text{Cu(NO}_3)_2$ and $\\text{N}_2\\text{O}$", "(c) $\\text{Cu(NO}_3)_2$ and $\\text{NO}_2$", "(d) $\\text{Cu(NO}_3)_2$ and NO"], answer: "(c) $\\text{Cu(NO}_3)_2$ and $\\text{NO}_2$" }
        ]
      },
      {
        name: 'Unit 4 – Transition and Inner Transition Elements',
        mcqs: [
          { question: "Sc (Z=21) is a transition element but Zinc (Z=30) is not because", options: ["(a) both $\\text{Sc}^{3+}$ and $\\text{Zn}^{2+}$ ions are colourless and form white compounds", "(b) in case of Sc, 3d orbital are partially filled but in Zn these are completely filled", "(c) last electron is assumed to be added to 4s level in case of zinc", "(d) both Sc and Zn do not exhibit variable oxidation states"], answer: "(b) in case of Sc, 3d orbital are partially filled but in Zn these are completely filled" },
          { question: "Which of the following d block element has half filled penultimate d sub shell as well as half filled valence sub shell?", options: ["(a) Cr", "(b) Pd", "(c) Pt", "(d) none of these"], answer: "(a) Cr" },
          { question: "Among the transition metals of 3d series, the one that has highest negative $(\\text{M}^{2+}/\\text{M})$ standard electrode potential is", options: ["(a) Ti", "(b) Cu", "(c) Mn", "(d) Zn"], answer: "(a) Ti" },
          { question: "Which one of the following ions has the same number of unpaired electrons as present in $\\text{V}^{3+}$?", options: ["(a) $\\text{Ti}^{3+}$", "(b) $\\text{Fe}^{3+}$", "(c) $\\text{Ni}^{2+}$", "(d) $\\text{Cr}^{3+}$"], answer: "(c) $\\text{Ni}^{2+}$" },
          { question: "The magnetic moment of $\\text{Mn}^{2+}$ ion is", options: ["(a) 5.92 BM", "(b) 2.80 BM", "(c) 8.95 BM", "(d) 3.90 BM"], answer: "(a) 5.92 BM" },
          { question: "The catalytic behaviour of transition metals and their compounds is ascribed mainly due to", options: ["(a) their magnetic behaviour", "(b) their unfilled d orbitals", "(c) their ability to adopt variable oxidation states", "(d) their chemical reactivity"], answer: "(c) their ability to adopt variable oxidation states" },
          { question: "The correct order of increasing oxidizing power in the series", options: ["(a) $\\text{VO}_2^+ < \\text{Cr}_2\\text{O}_7^{2-} < \\text{MnO}_4^-$", "(b) $\\text{Cr}_2\\text{O}_7^{2-} < \\text{VO}_2^+ < \\text{MnO}_4^-$", "(c) $\\text{Cr}_2\\text{O}_7^{2-} < \\text{MnO}_4^- < \\text{VO}_2^+$", "(d) $\\text{MnO}_4^- < \\text{Cr}_2\\text{O}_7^{2-} < \\text{VO}_2^+$"], answer: "(a) $\\text{VO}_2^+ < \\text{Cr}_2\\text{O}_7^{2-} < \\text{MnO}_4^-$" },
          { question: "In acid medium, potassium permanganate oxidizes oxalic acid to", options: ["(a) oxalate", "(b) Carbon dioxide", "(c) acetate", "(d) acetic acid"], answer: "(b) Carbon dioxide" },
          { question: "Which of the following statements is not true?", options: ["(a) on passing $\\text{H}_2\\text{S}$ through acidified $\\text{K}_2\\text{Cr}_2\\text{O}_7$ solution, a milky colour is observed", "(b) $\\text{Na}_2\\text{Cr}_2\\text{O}_7$ is preferred over $\\text{K}_2\\text{Cr}_2\\text{O}_7$ in volumetric analysis", "(c) $\\text{K}_2\\text{Cr}_2\\text{O}_7$ solution in acidic medium is orange in colour", "(d) $\\text{K}_2\\text{Cr}_2\\text{O}_7$ solution becomes yellow on increasing the pH beyond 7"], answer: "(b) $\\text{Na}_2\\text{Cr}_2\\text{O}_7$ is preferred over $\\text{K}_2\\text{Cr}_2\\text{O}_7$ in volumetric analysis" },
          { question: "Permanganate ion changes to ________ in acidic medium", options: ["(a) $\\text{MnO}_4^{2-}$", "(b) $\\text{Mn}^{2+}$", "(c) $\\text{Mn}^{3+}$", "(d) $\\text{MnO}_2$"], answer: "(b) $\\text{Mn}^{2+}$" },
          { question: "How many moles of $\\text{I}_2$ are liberated when 1 mole of potassium dichromate react with potassium iodide?", options: ["(a) 1", "(b) 2", "(c) 3", "(d) 4"], answer: "(c) 3" },
          { question: "The number of moles of acidified $\\text{KMnO}_4$ required to oxidize 1 mole of ferrous oxalate ($\\text{FeC}_2\\text{O}_4$) is", options: ["(a) 5", "(b) 3", "(c) 0.6", "(d) 1.5"], answer: "(c) 0.6" },
          { question: "Which one of the following statements related to lanthanons is incorrect?", options: ["(a) Europium shows +2 oxidation state", "(b) The basicity decreases as the ionic radius decreases from Pr to Lu", "(c) All the lanthanons are much more reactive than aluminium", "(d) $\\text{Ce}^{4+}$ solutions are widely used as oxidising agents in volumetric analysis"], answer: "(c) All the lanthanons are much more reactive than aluminium" },
          { question: "Which of the following lanthanoid ion is diamagnetic?", options: ["(a) $\\text{Eu}^{2+}$", "(b) $\\text{Yb}^{2+}$", "(c) $\\text{Ce}^{3+}$", "(d) $\\text{Sm}^{2+}$"], answer: "(b) $\\text{Yb}^{2+}$" },
          { question: "Which of the following oxidation state is most common among the lanthanoids?", options: ["(a) +4", "(b) +2", "(c) +5", "(d) +3"], answer: "(d) +3" },
          { question: "Assertion: $\\text{Ce}^{4+}$ is used as an oxidizing agent in volumetric analysis. Reason: $\\text{Ce}^{4+}$ has the tendency of attaining +3 oxidation state.", options: ["(a) Both assertion and reason are true and reason is the correct explanation", "(b) Both assertion and reason are true but reason is not the correct explanation", "(c) Assertion is true but reason is false", "(d) Both assertion and reason are false"], answer: "(a) Both assertion and reason are true and reason is the correct explanation" },
          { question: "The most common oxidation state of actinoids is", options: ["(a) +2", "(b) +3", "(c) +4", "(d) +6"], answer: "(b) +3" },
          { question: "The actinoid elements which show the highest oxidation state of +7 are", options: ["(a) Np, Pu, Am", "(b) U, Fm, Th", "(c) U, Th, Md", "(d) Es, No, Lr"], answer: "(a) Np, Pu, Am" },
          { question: "Which one of the following is not correct?", options: ["(a) $\\text{La(OH)}_3$ is less basic than $\\text{Lu(OH)}_3$", "(b) In lanthanoid series ionic radius of $\\text{Ln}^{3+}$ ions decreases", "(c) La is actually an element of transition metal series rather than lanthanoid series", "(d) Atomic radii of Zr and Hf are same because of lanthanoid contraction"], answer: "(a) $\\text{La(OH)}_3$ is less basic than $\\text{Lu(OH)}_3$" }
        ]
      },
      {
        name: 'Unit 5 - Coordination Chemistry',
        mcqs: [
          { question: 'The sum of primary valence and secondary valence of the metal M in the complex [M(en)2(Ox)Cl] is', options: ['(a) 3', '(b) 6', '(c) -3', '(d) 9'], answer: '(d) 9' },
          { question: 'An excess of silver nitrate is added to 100ml of a 0.01M solution of pentaaquachloridochromium(III)chloride. The number of moles of AgCl precipitated would be', options: ['(a) 0.02', '(b) 0.002', '(c) 0.01', '(d) 0.2'], answer: '(b) 0.002' },
          { question: 'A complex MSO4.Cl.6H2O gives white ppt with BaCl2 and no ppt with AgNO3. Secondary valence is six. The complex is', options: ['(a) [M(H2O)4Cl]SO4.2H2O', '(b) [M(H2O)6]SO4', '(c) [M(H2O)5Cl]SO4.H2O', '(d) [M(H2O)5Cl]SO4.3H2O'], answer: '(c) [M(H2O)5Cl]SO4.H2O' },
          { question: "Oxidation state of Iron and the charge on the ligand NO in $[\\text{Fe(H}_2\\text{O)}_5\\text{NO}]\\text{SO}_4$ are", options: ["(a) +2 and 0 respectively", "(b) +3 and 0 respectively", "(c) +3 and -1 respectively", "(d) +1 and +1 respectively"], answer: "(c) +3 and -1 respectively" },
          { question: 'As per IUPAC guidelines, the name of the complex [Co(en)2(ONO)Cl]Cl is', options: ['(a) Chlorobisethylenediaminenitritecocobalt(III) chloride', '(b) Chloridobis(ethane-1,2-diamine)nitro-K-Ocobaltate(III)chloride', '(c) Chloridobis(ethane-1,2-diammine)nitrito-K-Ocobalt(II) chloride', '(d) Chloridobis(ethane-1,2-diammine)nitrito-K-Ocobalt(III)chloride'], answer: '(d) Chloridobis(ethane-1,2-diammine)nitrito-K-Ocobalt(III)chloride' },
          { question: "IUPAC name of the complex $\\text{K}_3[\\text{Al(C}_2\\text{O}_4)_3]$ is", options: ["(a) Potassiumtrioxalatoaluminium(III)", "(b) Potassiumtrioxalatoaluminate(II)", "(c) Potassiumtrisoxalatoaluminate(III)", "(d) Potassiumtrioxalatoaluminate(III)"], answer: "(c) Potassiumtrisoxalatoaluminate(III)" },
          { question: 'A magnetic moment of 1.73 BM will be shown by one among the following (NEET)', options: ['(a) TiCl4', '(b) [CoCl4]2-', '(c) [Cu(NH3)4]2+', '(d) [Ni(CN)4]2-'], answer: '(c) [Cu(NH3)4]2+' },
          { question: "Crystal field stabilization energy for high spin $d^5$ octahedral complex is", options: ["(a) $-0.6\\Delta_o$", "(b) 0", "(c) $2(P - \\Delta_o)$", "(d) $2(P + \\Delta_o)$"], answer: "(b) 0" },
          { question: 'In which of the following coordination entities the magnitude of Delta-o will be maximum?', options: ['(a) [Co(CN)6]3-', '(b) [Co(C2O4)3]3-', '(c) [Co(H2O)6]3+', '(d) [Co(NH3)6]3+'], answer: '(a) [Co(CN)6]3-' },
          { question: 'Which one of the following will give a pair of enantiomorphs?', options: ['(a) [Cr(NH3)3][Co(CN)3]', '(b) [Co(en)2Cl2]Cl', '(c) [Pt(NH3)2][PtCl4]', '(d) [Co(NH3)4Cl2]NO2'], answer: '(b) [Co(en)2Cl2]Cl' },
          { question: 'Which type of isomerism is exhibited by [Pt(NH3)2Cl2]?', options: ['(a) Coordination isomerism', '(b) Linkage isomerism', '(c) Optical isomerism', '(d) Geometrical isomerism'], answer: '(d) Geometrical isomerism' },
          { question: 'How many geometrical isomers are possible for [Pt(Py)(NH3)(Br)(Cl)]?', options: ['(a) 3', '(b) 4', '(c) 0', '(d) 15'], answer: '(a) 3' },
          { question: 'Which one of the following pairs represents linkage isomers?', options: ['(a) [Cu(NH3)4][PtCl4] and [Pt(NH3)4][CuCl4]', '(b) [Co(NH3)5(NO2)]SO4 and [Co(NH3)5(ONO)]SO4', '(c) [Co(NH3)5(NCS)]Cl and [Co(NH3)5(SCN)]Cl', '(d) both (b) and (c)'], answer: '(d) both (b) and (c)' },
          { question: 'Which kind of isomerism is possible for a complex [Co(NH3)4Br2]Cl?', options: ['(a) geometrical and ionization', '(b) geometrical and optical', '(c) optical and ionization', '(d) geometrical only'], answer: '(a) geometrical and ionization' },
          { question: 'Which one of the following complexes is not expected to exhibit isomerism?', options: ['(a) [Ni(NH3)4(H2O)2]2+', '(b) [Pt(NH3)2Cl2]', '(c) [Co(NH3)3SO4]Cl', '(d) [FeCl6]3-'], answer: '(d) [FeCl6]3-' },
          { question: 'A complex in which the oxidation number of the metal is zero is', options: ['(a) K4[Fe(CN)6]', '(b) [Fe(CN)3(NH3)3]', '(c) [Fe(CO)5]', '(d) both (b) and (c)'], answer: '(c) [Fe(CO)5]' },
          { question: 'Formula of tris(ethane-1,2-diamine)iron(II)phosphate is', options: ['(a) [Fe(CH3-CH(NH2)3)](PO4)3', '(b) [Fe(H2N-CH2-CH2-NH2)3](PO4)2', '(c) [Fe(H2N-CH2-CH2-NH2)3](PO4)', '(d) [Fe(H2N-CH2-CH2-NH2)3](PO4)3'], answer: '(b) [Fe(H2N-CH2-CH2-NH2)3](PO4)2' },
          { question: 'Which of the following is paramagnetic in nature?', options: ['(a) [Zn(NH3)4]2+', '(b) [Co(NH3)6]3+', '(c) [Ni(H2O)6]2+', '(d) [Ni(CN)4]2-'], answer: '(c) [Ni(H2O)6]2+' },
          { question: 'Fac-mer isomerism is shown by', options: ['(a) [Co(en)3]3+', '(b) [Co(NH3)3(Cl)3]', '(c) [Co(NH3)2(Cl)2]', '(d) [Co(NH3)4Cl]SO4'], answer: '(b) [Co(NH3)3(Cl)3]' },
          { question: 'Choose the correct statement.', options: ['(a) Square planar complexes are more stable than octahedral complexes', '(b) Spin only magnetic moment of [Cu(Cl)2]2+ is 1.732 BM with square planar structure', '(c) Crystal field splitting energy of [FeF6]3- is higher than that of [Fe(CN)6]4-', '(d) Crystal field stabilization energy of [V(H2O)6]3+ is higher than that of [Ti(H2O)6]3+'], answer: '(d) Crystal field stabilization energy of [V(H2O)6]3+ is higher than that of [Ti(H2O)6]3+' }
        ]
      },
      {
        name: 'Unit 6 - Solid State',
        mcqs: [
          { question: 'Graphite and diamond are', options: ['(a) Covalent and molecular crystals', '(b) ionic and covalent crystals', '(c) both covalent crystals', '(d) both molecular crystals'], answer: '(c) both covalent crystals' },
          { question: 'An ionic compound AxBy crystallizes in fcc type crystal structure with B ions at the centre of each face and A ion occupying corners of the cube. The correct formula of AxBy is', options: ['(a) AB', '(b) AB3', '(c) A2B', '(d) A8B6'], answer: '(b) AB3' },
          { question: 'The ratio of close packed atoms to tetrahedral hole in cubic packing is', options: ['(a) 1:1', '(b) 1:2', '(c) 2:1', '(d) 1:4'], answer: '(b) 1:2' },
          { question: 'Solid CO2 is an example of', options: ['(a) Covalent solid', '(b) metallic solid', '(c) molecular solid', '(d) ionic solid'], answer: '(c) molecular solid' },
          { question: 'Assertion: monoclinic sulphur is an example of monoclinic crystal system. Reason: for a monoclinic system, aâ‰ bâ‰ c and Î±=Î³=90Â°, Î²â‰ 90Â°', options: ['(a) Both assertion and reason are true and reason is the correct explanation', '(b) Both assertion and reason are true but reason is not the correct explanation', '(c) Assertion is true but reason is false', '(d) Both assertion and reason are false'], answer: '(a) Both assertion and reason are true and reason is the correct explanation' },
          { question: 'In calcium fluoride, having the fluorite structure the coordination number of Ca2+ ion and F- ion are (NEET)', options: ['(a) 4 and 2', '(b) 6 and 6', '(c) 8 and 4', '(d) 4 and 8'], answer: '(c) 8 and 4' },
          { question: 'The number of unit cells in 8 gm of an element X (atomic mass 40) which crystallizes in bcc pattern is (NA is the Avogadro number)', options: ['(a) 6.023 x 10^23', '(b) 6.023 x 10^22', '(c) 60.23 x 10^23', '(d) (6.023 x 10^23)/(8 x 40)'], answer: '(b) 6.023 x 10^22' },
          { question: 'In a solid atom M occupies ccp lattice and (1/3) of tetrahedral voids are occupied by atom N. The formula of solid formed by M and N is', options: ['(a) MN', '(b) M3N', '(c) MN3', '(d) M2N2'], answer: '(b) M3N' },
          { question: 'The ionic radii of A+ and B- are 0.98 x 10^-10 m and 1.81 x 10^-10 m. The coordination number of each ion in AB is', options: ['(a) 8', '(b) 2', '(c) 6', '(d) 4'], answer: '(c) 6' },
          { question: 'CsCl has bcc arrangement, its unit cell edge length is 400pm, its inter atomic distance is', options: ['(a) 400 pm', '(b) 800 pm', '(c) sqrt(3) x 100 pm', '(d) (sqrt(3)/2) x 400 pm'], answer: '(d) (sqrt(3)/2) x 400 pm' },
          { question: 'A solid compound XY has NaCl structure. If the radius of the cation is 100 pm, the radius of the anion will be', options: ['(a) (100/0.414) pm', '(b) (0.732/100) pm', '(c) 100 x 0.414 pm', '(d) (0.414/100) pm'], answer: '(a) (100/0.414) pm' },
          { question: 'The vacant space in bcc lattice unit cell is', options: ['(a) 48%', '(b) 23%', '(c) 32%', '(d) 26%'], answer: '(c) 32%' },
          { question: 'The radius of an atom is 300 pm, if it crystallizes in a face centered cubic lattice, the length of the edge of the unit cell is', options: ['(a) 488.5 pm', '(b) 848.5 pm', '(c) 884.5 pm', '(d) 484.5 pm'], answer: '(b) 848.5 pm' },
          { question: 'The fraction of total volume occupied by the atoms in a simple cubic is', options: ['(a) pi/(4*sqrt(2))', '(b) pi/6', '(c) pi/4', '(d) pi/(3*sqrt(2))'], answer: '(b) pi/6' },
          { question: 'The yellow colour in NaCl crystal is due to', options: ['(a) excitation of electrons in F centers', '(b) reflection of light from Cl- ion on the surface', '(c) refraction of light from Na+ ion', '(d) all of the above'], answer: '(a) excitation of electrons in F centers' },
          { question: 'If a is the edge length of sc, bcc and fcc cubic systems, the ratio of radii of spheres is respectively', options: ['(a) (1/2)a : (sqrt(3)/2)a : (sqrt(2)/2)a', '(b) sqrt(1)a : sqrt(3)a : sqrt(2)a', '(c) (1/2)a : (sqrt(3)/4)a : (1/(2*sqrt(2)))a', '(d) (1/2)a : sqrt(3)a : (1/sqrt(2))a'], answer: '(c) (1/2)a : (sqrt(3)/4)a : (1/(2*sqrt(2)))a' },
          { question: 'If a is the length of the side of the cube, the distance between the body centered atom and one corner atom in the cube will be', options: ['(a) (2/sqrt(3))a', '(b) (4/sqrt(3))a', '(c) (sqrt(3)/4)a', '(d) (sqrt(3)/2)a'], answer: '(d) (sqrt(3)/2)a' },
          { question: 'Potassium has a bcc structure with nearest neighbor distance 4.52 Angstrom. Its atomic weight is 39. Its density will be', options: ['(a) 915 kg/m3', '(b) 2142 kg/m3', '(c) 452 kg/m3', '(d) 390 kg/m3'], answer: '(a) 915 kg/m3' },
          { question: 'Schottky defect in a crystal is observed when', options: ['(a) unequal number of anions and cations are missing from the lattice', '(b) equal number of cations and anions are missing from the lattice', '(c) an ion leaves its normal site and occupies an interstitial site', '(d) no ion is missing from its lattice'], answer: '(b) equal number of cations and anions are missing from the lattice' },
          { question: 'The cation leaves its normal position in the crystal and moves to some interstitial position, the defect in the crystal is known as', options: ['(a) Schottky defect', '(b) F center', '(c) Frenkel defect', '(d) non-stoichiometric defect'], answer: '(c) Frenkel defect' },
          { question: 'Assertion: due to Frenkel defect, density of the crystalline solid decreases. Reason: in Frenkel defect cation and anion leaves the crystal.', options: ['(a) Both assertion and reason are true and reason is the correct explanation', '(b) Both assertion and reason are true but reason is not the correct explanation', '(c) Assertion is true but reason is false', '(d) Both assertion and reason are false'], answer: '(d) Both assertion and reason are false' },
          { question: 'The crystal with a metal deficiency defect is', options: ['(a) NaCl', '(b) FeO', '(c) ZnO', '(d) KCl'], answer: '(b) FeO' },
          { question: 'A 2D solid pattern is formed by two different atoms X (black) and Y (white) squares. The simplest formula for the compound based on the unit cell is', options: ['(a) XY8', '(b) X4Y9', '(c) XY2', '(d) XY4'], answer: '(d) XY4' }
        ]
      },
      {
        name: 'Unit 7 - Chemical Kinetics',
        mcqs: [
          { question: 'For a first order reaction A -> B the rate constant is x min^-1. If the initial concentration of A is 0.01M, the concentration of A after one hour is given by the expression.', options: ['(a) 0.01 e^-x', '(b) 1 x 10^-2 (1 - e^-60x)', '(c) (1 x 10^-2) e^-60x', '(d) none of these'], answer: '(c) (1 x 10^-2) e^-60x' },
          { question: 'A zero order reaction X -> Product, with an initial concentration 0.02M has a half life of 10 min. if one starts with concentration 0.04M, then the half life is', options: ['(a) 10 s', '(b) 5 min', '(c) 20 min', '(d) cannot be predicted using the given information'], answer: '(c) 20 min' },
          { question: 'Among the following graphs showing variation of rate constant with temperature (T) for a reaction, the one that exhibits Arrhenius behavior over the entire temperature range is', options: ['(a) ln k vs 1/T curve', '(b) log k vs 1/T straight line (negative slope)', '(c) ln k vs 1/T straight line (positive slope)', '(d) both (b) and (c)'], answer: '(b) log k vs 1/T straight line (negative slope)' },
          { question: 'For a first order reaction A -> product with initial concentration x mol L^-1, has a half life period of 2.5 hours. For the same reaction with initial concentration (x/2) mol L^-1 the half life is', options: ['(a) (2.5 x 2) hours', '(b) (2.5 / 2) hours', '(c) 2.5 hours', '(d) Without knowing the rate constant, t1/2 cannot be determined from the given data'], answer: '(c) 2.5 hours' },
          { question: 'For the reaction, 2NH3 -> N2 + 3H2, if -d[NH3]/dt = k1 [NH3], d[N2]/dt = k2 [NH3], d[H2]/dt = k3 [NH3] then the relation between k1, k2 and k3 is', options: ['(a) k1 = k2 = k3', '(b) k1 = 3 k2 = 2 k3', '(c) 1.5 k1 = 3 k2 = k3', '(d) 2 k1 = k2 = 3 k3'], answer: '(c) 1.5 k1 = 3 k2 = k3' },
          { question: 'The decomposition of phosphine (PH3) on tungsten at low pressure is a first order reaction. It is because the (NEET)', options: ['(a) rate is proportional to the surface coverage', '(b) rate is inversely proportional to the surface coverage', '(c) rate is independent of the surface coverage', '(d) rate of decomposition is slow'], answer: '(a) rate is proportional to the surface coverage' },
          { question: 'For a reaction Rate = k [acetone]^(3/2) then unit of rate constant and rate of reaction respectively is', options: ['(a) (mol L^-1 s^-1), (mol^(-1/2) L^(1/2) s^-1)', '(b) (mol^(-1/2) L^(1/2) s^-1), (mol L^-1 s^-1)', '(c) (mol^(1/2) L^(1/2) s^-1), (mol L^-1 s^-1)', '(d) (mol L s^-1), (mol^(1/2) L^(1/2) s)'], answer: '(b) (mol^(-1/2) L^(1/2) s^-1), (mol L^-1 s^-1)' },
          { question: 'The addition of a catalyst during a chemical reaction alters which of the following quantities? (NEET)', options: ['(a) Enthalpy', '(b) Activation energy', '(c) Entropy', '(d) Internal energy'], answer: '(b) Activation energy' },
          { question: 'Consider the following statements: (i) increase in concentration of the reactant increases the rate of a zero order reaction. (ii) rate constant k is equal to collision frequency A if Ea = 0 (iii) rate constant k is equal to collision frequency A if Ea = ∞ (iv) a plot of ln(k) vs T is a straight line. (v) a plot of ln(k) vs (1/T) is a straight line with a positive slope. Correct statements are', options: ['(a) (ii) only', '(b) (ii) and (iv)', '(c) (ii) and (v)', '(d) (i), (ii) and (v)'], answer: '(a) (ii) only' },
          { question: 'In a reversible reaction, the enthalpy change and the activation energy in the forward direction are respectively -x kJ mol^-1 and y kJ mol^-1. Therefore, the energy of activation in the backward direction is', options: ['(a) (y - x) kJ mol^-1', '(b) (x + y) J mol^-1', '(c) (x - y) kJ mol^-1', '(d) (x + y) * 10^3 J mol^-1'], answer: '(d) (x + y) * 10^3 J mol^-1' },
          { question: 'What is the activation energy for a reaction if its rate doubles when the temperature is raised from 200K to 400K? (R = 8.314 JK^-1mol^-1)', options: ['(a) 234.65 kJ mol^-1', '(b) 434.65 kJ mol^-1', '(c) 2.305 kJ mol^-1', '(d) 334.65 J mol^-1'], answer: '(c) 2.305 kJ mol^-1' },
          { question: 'Cyclopropane -> Propene : This reaction follows first order kinetics. The rate constant at particular temperature is 2.303 x 10^-2 hour^-1. The initial concentration of cyclopropane is 0.25 M. What will be the concentration of cyclopropane after 1806 minutes? (log 2 = 0.3010)', options: ['(a) 0.125 M', '(b) 0.215 M', '(c) 0.25 * 2.303 M', '(d) 0.05 M'], answer: '(a) 0.125 M' },
          { question: 'For a first order reaction, the rate constant is 6.909 min^-1. the time taken for 75% conversion in minutes is', options: ['(a) (3/2) log 2', '(b) (2/3) log 2', '(c) (3/2) log (3/4)', '(d) (2/3) log (4/3)'], answer: '(b) (2/3) log 2' },
          { question: 'In a first order reaction x -> y; if k is the rate constant and the initial concentration of the reactant x is 0.1M, then, the half life is', options: ['(a) (log 2) / k', '(b) 0.693 / (0.1 k)', '(c) (ln 2) / k', '(d) none of these'], answer: '(c) (ln 2) / k' },
          { question: 'Predict the rate law of the following reaction based on the data given below: 2A + B -> C + 3D. Experiment 1: [A]=0.1, [B]=0.1, rate=x. Experiment 2: [A]=0.2, [B]=0.1, rate=2x. Experiment 3: [A]=0.1, [B]=0.2, rate=4x.', options: ['(a) rate = k[A]^2[B]', '(b) rate = k[A][B]^2', '(c) rate = k[A][B]', '(d) rate = k[A]^(1/2)[B]^(3/2)'], answer: '(b) rate = k[A][B]^2' },
          { question: 'Assertion: rate of reaction doubles when the concentration of the reactant is doubles if it is a first order reaction. Reason: rate constant also doubles', options: ['(a) Both assertion and reason are true and reason is the correct explanation of assertion.', '(b) Both assertion and reason are true but reason is not the correct explanation of assertion.', '(c) Assertion is true but reason is false.', '(d) Both assertion and reason are false.'], answer: '(c) Assertion is true but reason is false.' },
          { question: 'The rate constant of a reaction is 5.8 x 10^-2 s^-1. The order of the reaction is', options: ['(a) First order', '(b) zero order', '(c) Second order', '(d) Third order'], answer: '(a) First order' },
          { question: 'For the reaction N2O5(g) -> 2NO2(g) + (1/2)O2(g), the value of rate of disappearance of N2O5 is given as 6.5 x 10^-2 mol L^-1 s^-1. The rate of formation of NO2 and O2 is given respectively as', options: ['(a) (3.25 x 10^-2 mol L^-1 s^-1) and (1.3 x 10^-2 mol L^-1 s^-1)', '(b) (1.3 x 10^-2 mol L^-1 s^-1) and (3.25 x 10^-2 mol L^-1 s^-1)', '(c) (1.3 x 10^-1 mol L^-1 s^-1) and (3.25 x 10^-2 mol L^-1 s^-1)', '(d) None of these'], answer: '(c) (1.3 x 10^-1 mol L^-1 s^-1) and (3.25 x 10^-2 mol L^-1 s^-1)' },
          { question: 'During the decomposition of H2O2 to give dioxygen, 48 g O2 is formed per minute at certain point of time. The rate of formation of water at this point is', options: ['(a) 0.75 mol min^-1', '(b) 1.5 mol min^-1', '(c) 2.25 mol min^-1', '(d) 3.0 mol min^-1'], answer: '(d) 3.0 mol min^-1' },
          { question: 'If the initial concentration of the reactant is doubled, the time for half reaction is also doubled. Then the order of the reaction is', options: ['(a) Zero', '(b) one', '(c) Fraction', '(d) none'], answer: '(a) Zero' },
          { question: 'In a homogeneous reaction A -> B + C + D, the initial pressure was P0 and after time t it was P. expression for rate constant in terms of P0, P and t will be', options: ['(a) k = (2.303/t) log (2P0 / (3P0 - P))', '(b) k = (2.303/t) log (2P0 / (P0 - P))', '(c) k = (2.303/t) log (3P0 - P / 2P0)', '(d) k = (2.303/t) log (2P0 / (3P0 - 2P))'], answer: '(a) k = (2.303/t) log (2P0 / (3P0 - P))' },
          { question: 'If 75% of a first order reaction was completed in 60 minutes, 50% of the same reaction under the same conditions would be completed in', options: ['(a) 20 minutes', '(b) 30 minutes', '(c) 35 minutes', '(d) 75 minutes'], answer: '(b) 30 minutes' },
          { question: 'The half life period of a radioactive element is 140 days. After 560 days, 1 g of element will be reduced to', options: ['(a) (1/2) g', '(b) (1/4) g', '(c) (1/8) g', '(d) (1/16) g'], answer: '(d) (1/16) g' },
          { question: 'The correct difference between first and second order reactions is that (NEET)', options: ['(a) A first order reaction can be catalysed; a second order reaction cannot be catalysed.', '(b) The half life of a first order reaction does not depend on [A0]; the half life of a second order reaction does depend on [A0].', '(c) The rate of a first order reaction does not depend on reactant concentrations; the rate of a second order reaction does depend on reactant concentrations.', '(d) The rate of a first order reaction does depend on reactant concentrations; the rate of a second order reaction does not depend on reactant concentrations.'], answer: '(b) The half life of a first order reaction does not depend on [A0]; the half life of a second order reaction does depend on [A0].' },
          { question: 'After 2 hours, a radioactive substance becomes (1/16)th of original amount. Then the half life (in min) is', options: ['(a) 60 minutes', '(b) 120 minutes', '(c) 30 minutes', '(d) 15 minutes'], answer: '(c) 30 minutes' }
        ]
      }
    ]
  },
  {
    name: 'Biology',
    emoji: '🧬',
    color: '#f59e0b',
    chapters: [
      { name: 'Unit 1 – Reproduction', mcqs: [] },
      { name: 'Unit 2 – Genetics', mcqs: [] },
    ]
  },
  {
    name: 'Mathematics',
    emoji: '📐',
    color: '#8b5cf6',
    chapters: [
      { name: 'Unit 1 – Applications of Matrices', mcqs: [] },
      { name: 'Unit 2 – Complex Numbers', mcqs: [] },
    ]
  },
];
// ──────────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<'home' | 'math' | 'physics' | 'chemistry' | 'biology' | 'botany' | 'zoology' | 'english' | 'computer' | 'tamil' | 'history' | 'commerce' | 'accountancy' | 'economics' | 'summarise' | 'quiz' | 'tn12'>('home');
  const [problem, setProblem] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // SaaS Features
  const [user, setUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('ayman_study_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('ayman_study_token') || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('ayman_study_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('ayman_study_user');
      }
    } catch (_) {}
  }, [user]);

  useEffect(() => {
    try {
      if (token) {
        localStorage.setItem('ayman_study_token', token);
      } else {
        localStorage.removeItem('ayman_study_token');
      }
    } catch (_) {}
  }, [token]);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  // ── QUIZ GAME STATE ────────────────────────────────────────
  type QuizQuestion = { question: string; options: string[]; answer: string; explanation: string; };
  const [quizTopic, setQuizTopic] = useState('');
  const [quizCount, setQuizCount] = useState(10);
  const [quizClass, setQuizClass] = useState('Class 10');
  const [quizPhase, setQuizPhase] = useState<'setup' | 'generating' | 'playing' | 'results'>('setup');
  const [quizData, setQuizData] = useState<QuizQuestion[]>([]);
  const [quizCurrent, setQuizCurrent] = useState(0);
  const [quizSelected, setQuizSelected] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswerLog, setQuizAnswerLog] = useState<{ selected: string; correct: boolean }[]>([]);
  const [quizError, setQuizError] = useState<string | null>(null);

  const generateQuiz = async () => {
    if (!user) { alert('Please login first!'); return; }
    if (user.credits <= 0) { setShowUpgrade(true); setQuizPhase('setup'); return; }
    if (!quizTopic.trim()) { setQuizError('Please enter a topic.'); return; }
    setQuizPhase('generating');
    setQuizError(null);
    setQuizData([]);
    setQuizCurrent(0);
    setQuizScore(0);
    setQuizAnswerLog([]);
    setQuizSelected(null);
    try {
      const systemPrompt = `You are an expert exam question setter. Generate exactly ${quizCount} Multiple Choice Questions on the topic: "${quizTopic}" for ${quizClass} students.

You MUST respond with ONLY a valid JSON array and absolutely nothing else — no preamble, no explanation, no markdown code fences. The format must be:
[
  {
    "question": "Question text here?",
    "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
    "answer": "A. Option 1",
    "explanation": "Brief one-line explanation of why this is correct."
  }
]

Rules:
- Generate EXACTLY ${quizCount} questions. No more, no less.
- Each question must have EXACTLY 4 options labeled A, B, C, D.
- The "answer" field must be the FULL text of the correct option (e.g., "B. Mitochondria").
- Questions must be appropriate for ${quizClass} level.
- Vary the difficulty: some easy, some medium, some hard.
- Do NOT include any text outside the JSON array.`;
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ prompt: quizTopic, systemInstruction: systemPrompt, image: null, mimeType: 'image/png', credits: user?.credits })
      });
      const data = await res.json().catch(() => null);
      if (!data || data.status !== 'success') {
        if (data.message === 'INSUFFICIENT_CREDITS') { setShowUpgrade(true); setQuizPhase('setup'); return; }
        throw new Error(data.message || 'Failed to generate quiz');
      }
      setUser((prev: any) => {
        const cur = prev?.credits !== undefined ? prev.credits : 20;
        const next = data.remaining_credits !== undefined ? Math.min(data.remaining_credits, cur - 1) : cur - 1;
        return { ...prev, credits: Math.max(0, next) };
      });
      let rawText = (data.text as string).trim();
      // Strip markdown code fences if model wrapped in them
      rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      const parsed: QuizQuestion[] = JSON.parse(rawText);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Invalid quiz format received.');
      setQuizData(parsed);
      setQuizPhase('playing');
    } catch (e: any) {
      console.error('Quiz generation error:', e);
      setQuizError('Failed to generate quiz. Please try again.');
      setQuizPhase('setup');
    }
  };

  const handleQuizAnswer = (option: string) => {
    if (quizSelected !== null) return; // already answered
    const correct = option === quizData[quizCurrent].answer;
    setQuizSelected(option);
    if (correct) setQuizScore(s => s + 1);
    setQuizAnswerLog(prev => [...prev, { selected: option, correct }]);
  };

  const handleQuizNext = () => {
    if (quizCurrent + 1 >= quizData.length) {
      setQuizPhase('results');
    } else {
      setQuizCurrent(c => c + 1);
      setQuizSelected(null);
    }
  };

  const resetQuiz = () => {
    setQuizPhase('setup');
    setQuizData([]);
    setQuizCurrent(0);
    setQuizScore(0);
    setQuizAnswerLog([]);
    setQuizSelected(null);
    setQuizError(null);
  };
  // ──────────────────────────────────────────────────────────

  // ── TN 12TH MCQ STATE ─────────────────────────────────────
  const [tn12Subject, setTn12Subject] = useState<string | null>(null);
  const [tn12Chapter, setTn12Chapter] = useState<string | null>(null);
  const [tn12Current, setTn12Current] = useState(0);
  const [tn12Selected, setTn12Selected] = useState<string | null>(null);
  const [tn12Score, setTn12Score] = useState(0);
  const [tn12Phase, setTn12Phase] = useState<'subjects' | 'chapters' | 'quiz' | 'results'>('subjects');
  const [tn12Log, setTn12Log] = useState<{ selected: string; correct: boolean }[]>([]);

  const resetTn12 = () => {
    setTn12Subject(null);
    setTn12Chapter(null);
    setTn12Current(0);
    setTn12Selected(null);
    setTn12Score(0);
    setTn12Phase('subjects');
    setTn12Log([]);
  };

  const handleTn12Answer = (option: string, answer: string) => {
    if (tn12Selected !== null) return;
    const correct = option === answer;
    setTn12Selected(option);
    if (correct) setTn12Score(s => s + 1);
    setTn12Log(prev => [...prev, { selected: option, correct }]);
  };

  const handleTn12Next = (total: number) => {
    if (tn12Current + 1 >= total) {
      setTn12Phase('results');
    } else {
      setTn12Current(c => c + 1);
      setTn12Selected(null);
    }
  };
  // ──────────────────────────────────────────────────────────

  // Geolocation Pricing
  const [currencyInfo, setCurrencyInfo] = useState({ code: 'INR', symbol: '₹', amount: 99 });

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        const country = data.country_code;
        if (country === 'US') {
          setCurrencyInfo({ code: 'USD', symbol: '$', amount: 5 });
        } else if (country === 'GB') {
          setCurrencyInfo({ code: 'GBP', symbol: '£', amount: 5 });
        } else if (['FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'AT', 'IE', 'FI', 'GR', 'PT', 'EU'].includes(country)) {
          setCurrencyInfo({ code: 'EUR', symbol: '€', amount: 5 });
        } else if (country === 'IN') {
          setCurrencyInfo({ code: 'INR', symbol: '₹', amount: 99 });
        } else {
          setCurrencyInfo({ code: 'USD', symbol: '$', amount: 5 });
        }
      })
      .catch(err => console.log('Location fetch failed, defaulting to INR', err));
  }, []);

  const handleGuestLogin = () => {
    const guestUser = {
      id: 'guest_' + Date.now(),
      name: 'Demo Student',
      email: 'guest@aymanstudy.ai',
      picture: '',
      credits: 20,
    };
    setUser(guestUser);
    setToken(btoa(JSON.stringify({ user_id: guestUser.id, email: guestUser.email, exp: Date.now() + 86400000 })));
  };

  const handleLoginSuccess = async (credentialResponse: any) => {
    try {
      const res = await fetch('/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });
      const data = await res.json().catch(() => null);
      if (data && data.status === 'success') {
        setUser(data.user);
        setToken(data.token);
      } else {
        alert(data?.message || ("Login failed (HTTP " + res.status + ")"));
      }
    } catch (err) {
      alert("Login request failed: " + (err?.message || "Server error"));
    }
  };

  const handleRazorpayPayment = async () => {
    if (!(window as any).Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
      await new Promise(r => script.onload = r);
    }

    try {
      const res = await fetch('/payment.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ action: 'create_order', amount: currencyInfo.amount, currency: currencyInfo.code }) // Dynamic currency top-up
      });
      const data = await res.json().catch(() => null);

      if (!data || data.status !== 'success') {
        alert("Could not start payment: " + data.message);
        return;
      }

      const options = {
        "key": data.key || (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || "",
        "amount": data.order.amount,
        "currency": data.order?.currency || currencyInfo.code,
        "name": "Ayman StudyAI",
        "description": "Buy 100 Credits",
        "order_id": data.order.id,
        "handler": async function (response: any) {
          const vRes = await fetch('/payment.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
              action: 'verify_payment',
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            })
          });
          const vData = await vRes.json();
          if (vData.status === 'success') {
            setUser({ ...user, credits: vData.new_credits });
            setShowUpgrade(false);
            alert("Payment successful! You now have " + vData.new_credits + " credits.");
          } else {
            alert("Payment verification failed!");
          }
        },
        "prefill": {
          "name": user?.name,
          "email": user?.email,
        },
        "theme": {
          "color": "#7c3aed"
        }
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert("Payment failed to initialize.");
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const solveProblem = async () => {
    if (!user) {
      alert("Please login first to unlock your Study Buddy!");
      return;
    }
    if (user.credits <= 0) {
      setShowUpgrade(true);
      setError("You have run out of credits. Please upgrade to continue.");
      return;
    }
    if (!problem && !image) {
      setError("Please provide a problem description or an image.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setChatHistory([]);
    try {
      let strictSubjectPrefix = `CRITICAL IDENTITY INSTRUCTION: You are the ${view.toUpperCase()} AI. You MUST ONLY answer if the problem is strictly related to ${view.toUpperCase()}. If it is unrelated to ${view.toUpperCase()} (like asking a math question to history AI, or general conversational chat), you MUST IMMEDIATELY REFUSE and reply EXACTLY with: "I am your ${view.toUpperCase()} Study Buddy. I can only assist with ${view.toUpperCase()}-related questions. Please select the correct subject menu for this." DO NOT provide any solution or hint for off-topic queries.\n\n`;
      let promptPrefix = "";

      if (view === 'physics') {
        promptPrefix = "Analyze this Physics problem. You MUST ONLY provide an answer related to Physics. NEVER generate SVG code or images — always answer in plain text and structured formatting only: ";
      } else if (view === 'chemistry') {
        promptPrefix = "Analyze this Chemistry problem. You MUST ONLY provide an answer related to Chemistry. NEVER generate SVG code or images. DO NOT include EXPLANATION or EXTRA sections: ";
      } else if (view === 'biology') {
        promptPrefix = "Analyze this Biology problem. You MUST ONLY provide an answer related to Biology. NEVER generate SVG code or images — describe structures in plain text only: ";
      } else if (view === 'botany') {
        promptPrefix = "Analyze this Botany problem. You MUST ONLY provide an answer related to Botany. NEVER generate SVG code or images — describe plant structures in plain text only: ";
      } else if (view === 'zoology') {
        promptPrefix = "Analyze this Zoology problem. You MUST ONLY provide an answer related to Zoology. NEVER generate SVG code or images — describe animal systems in plain text only: ";
      } else if (view === 'english') {
        promptPrefix = "Analyze this English problem. You MUST ONLY provide an answer related to English language or literature. NEVER generate SVG code or images: ";
      } else if (view === 'computer') {
        promptPrefix = "Analyze this Computer Science problem. You MUST ONLY provide an answer related to Computer Science. NEVER generate SVG code or images: ";
      } else if (view === 'tamil') {
        promptPrefix = "Analyze this Tamil problem. You MUST ONLY provide an answer related to Tamil language or literature. NEVER generate SVG code or images: ";
      } else if (view === 'history') {
        promptPrefix = "Analyze this History problem. You MUST ONLY provide an answer related to History. NEVER generate SVG code or images: ";
      } else if (view === 'commerce') {
        promptPrefix = "Analyze this Commerce problem. You MUST ONLY provide an answer related to Commerce and Business Studies. NEVER generate SVG code or images: ";
      } else if (view === 'accountancy') {
        promptPrefix = "Analyze this Accountancy problem. You MUST ONLY provide an answer related to Accountancy and Bookkeeping. Formats like Journal Entries and Ledgers should be clearly structured. NEVER generate SVG code or images: ";
      } else if (view === 'economics') {
        promptPrefix = "Analyze this Economics problem. You MUST ONLY provide an answer related to Economics. NEVER generate SVG code or images: ";
      } else if (view === 'quiz') {
        promptPrefix = "Generate a comprehensive Multiple Choice Question (MCQ) test based on this topic or image. Include 5-10 challenging MCQs with 4 options (A, B, C, D) each. Output the quiz questions under --- SOLUTION --- and provide the answer key with brief explanations neatly under --- EXPLANATION ---. NEVER generate SVG code or images: ";
      } else if (view === 'summarise') {
        promptPrefix = "";
      } else {
        promptPrefix = "Solve this Math problem. You MUST ONLY provide an answer related to Mathematics. NEVER generate SVG code or images. CRITICAL: The SOLUTION section MUST ONLY contain mathematical equations/steps ($$ ... $$) with absolutely NO descriptive text. Put all your detailed step-by-step explanations in the EXPLANATION section: ";
      }

      const mimeTypeMatch = image ? image.match(/^data:(.*?);base64,/) : null;
      const extractedMimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/png";
      const base64Data = image ? image.split(',')[1] : null;

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          prompt: strictSubjectPrefix + promptPrefix + (
            problem && image
              ? `I have uploaded an image AND provided the following text. Please analyze BOTH the image AND the text together to give a perfect, complete answer.\n\nMy question/context: ${problem}`
              : problem
                ? problem
                : `Solve the ${view} problem shown in this image. Provide a complete, detailed step-by-step solution.`
          ),
          systemInstruction: SYSTEM_INSTRUCTION,
          image: base64Data,
          mimeType: extractedMimeType,
          subject: view,
          rawProblem: problem,
          credits: user?.credits
        }),
      });

      const data = await response.json();

      if (data && data.status === 'success') {
        setResult(fixMarkdownTables(data.text));
        // Decrease credit in state locally for snappiness
        setUser((prev: any) => {
        const cur = prev?.credits !== undefined ? prev.credits : 20;
        const next = data.remaining_credits !== undefined ? Math.min(data.remaining_credits, cur - 1) : cur - 1;
        return { ...prev, credits: Math.max(0, next) };
      });
      } else if (data.message === 'INSUFFICIENT_CREDITS') {
        setShowUpgrade(true);
        throw new Error("You have run out of credits.");
      } else {
        throw new Error(data.message || "Failed to solve problem");
      }
    } catch (err: any) {
      console.error("Error solving problem:", err);
      if (err.message === "You have run out of credits.") {
        setError(err.message);
      } else {
        setError(err.message || "Server is busy please try again");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !result) return;
    if (user && user.credits <= 0) {
      setShowUpgrade(true);
      setChatHistory(prev => [...prev, { role: 'model', text: "⚠️ You have run out of credits. Please upgrade to continue!" }]);
      return;
    }

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
    setChatLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          prompt: userMessage,
          image: null,
          mimeType: 'image/png',
          systemInstruction: `You are a friendly, genius ${view} Study Buddy. You are discussing the following ${view} problem and solution with a student:
          
          PROBLEM: ${problem || "Problem provided in image"}
          SOLUTION: ${result}
          
          Analyze the student's question carefully. If they are asking about a specific part of the solution, explain the underlying logic or principle. If they are asking for a broader explanation, provide a clear and concise summary.
          
          STRICT FORMATTING RULES:
          1. Your answer MUST be in a formal exam style, similar to the SOLUTION box.
          2. If you are showing math steps or chemical reactions, use ONLY display math blocks ($$ ... $$) on separate lines.
          3. Do NOT mix text and math in the same line.
          4. Use a vertical, math-only style for any calculations.
          5. Keep explanations brief and separate from the math.
          6. Maintain a professional and clear tone.
          7. If a diagram is requested in chat, provide it as an SVG code block.
          8. If the student asks for a derivation, provide ONLY the step-by-step mathematical derivation.
          9. For Chemistry, do NOT provide EXPLANATION or EXTRA sections in your chat responses.`,
          credits: user?.credits
        }),
      });

      const data = await response.json();

      if (data && data.status === 'success') {
        setChatHistory(prev => [...prev, { role: 'model', text: data.text }]);
        setUser((prev: any) => {
        const cur = prev?.credits !== undefined ? prev.credits : 20;
        const next = data.remaining_credits !== undefined ? Math.min(data.remaining_credits, cur - 1) : cur - 1;
        return { ...prev, credits: Math.max(0, next) };
      });
        setTimeout(scrollToBottom, 100);
      } else if (data.message === 'INSUFFICIENT_CREDITS') {
        setShowUpgrade(true);
        setChatHistory(prev => [...prev, { role: 'model', text: "⚡ You have run out of credits. Please upgrade to continue!" }]);
      } else {
        const errMsg = data.message || "Server is busy please try again";
        console.error("Chat API error:", errMsg);
        setChatHistory(prev => [...prev, { role: 'model', text: `❌ ${errMsg}` }]);
      }
    } catch (err: any) {
      console.error("Chat fetch error:", err);
      setChatHistory(prev => [...prev, { role: 'model', text: "❌ Server is busy please try again" }]);
    } finally {
      setChatLoading(false);
    }
  };

  const clearAll = () => {
    setProblem('');
    setImage(null);
    setResult(null);
    setError(null);
    setChatHistory([]);
  };

  const AuthLayer = (
    <>
      {/* Premium Sticky Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 glass-nav">
        {/* Brand */}
        <button
          onClick={() => { setView('home'); clearAll(); }}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="outfit-font font-black text-2xl tracking-tight">
            <span className="text-violet-600">AYMAN</span><span className="text-slate-900">INFOTECH</span>
          </span>
        </button>


        {/* Right Side */}
        <div className="flex items-center gap-3">
          {!user ? (
            <div className="flex items-center gap-2">
              <GoogleLogin
                onSuccess={handleLoginSuccess}
                onError={() => console.log('Login Failed')}
                shape="pill"
                size="medium"
              />
              <button
                onClick={handleGuestLogin}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors border border-violet-200 shadow-sm cursor-pointer whitespace-nowrap"
                title="Instant access for guests and recruiters"
              >
                Guest Demo
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Credit Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{
                  background: user.credits > 0 ? 'rgba(124,58,237,0.1)' : 'rgba(239,68,68,0.1)',
                  color: user.credits > 0 ? '#7c3aed' : '#dc2626'
                }}>
                <span>⚡</span>
                <span>{user.credits} Credits</span>
              </div>

              {/* User Pill & Account Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="flex items-center gap-2 bg-white border border-slate-200 hover:border-violet-300 transition-colors rounded-full pl-3 pr-1 py-1 shadow-sm focus:outline-none"
                >
                  <span className="text-sm font-semibold text-slate-800">{user.name.split(' ')[0]}</span>
                  {user.picture ? (
                    <img src={user.picture} alt="Avatar" className="w-8 h-8 rounded-full ring-2 ring-violet-200" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-sm">
                      {user.name.charAt(0)}
                    </div>
                  )}
                </button>

                {/* Dropdown Menu */}
                {showAccountMenu && (
                  <>
                    {/* Invisible backdrop to click away */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowAccountMenu(false)}
                    />
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 transform origin-top-right transition-all">
                      <div className="p-4 bg-gradient-to-br from-violet-50 to-white border-b border-slate-100">
                        <p className="font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email || 'User Account'}</p>
                      </div>
                      <div className="p-2 space-y-1">
                        <button
                          onClick={() => { setShowUpgrade(true); setShowAccountMenu(false); }}
                          className="w-full text-left px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-50 rounded-xl transition-colors flex items-center justify-between group"
                        >
                          Upgrade Credits
                          <span className="group-hover:scale-110 transition-transform">⚡</span>
                        </button>
                        <hr className="my-1 border-slate-100" />
                        <button
                          onClick={() => { setUser(null); setToken(null); setShowAccountMenu(false); }}
                          className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Buy Button */}
              {user.credits === 0 && (
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-full text-white transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                    boxShadow: '0 4px 14px rgba(124,58,237,0.4)'
                  }}
                >
                  <span>⚡</span> Upgrade
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Premium Upgrade Modal — High Conversion Design */}
      {showUpgrade && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(10,5,30,0.85)', backdropFilter: 'blur(12px)' }}>
          <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: 'linear-gradient(160deg, #ffffff 0%, #faf5ff 50%, #f3e8ff 100%)', border: '1.5px solid rgba(124,58,237,0.25)' }}>

            {/* Top rainbow bar */}
            <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7, #ec4899, #f59e0b)' }} />

            {/* 🔥 Urgency Badge */}
            <div className="flex justify-center -mt-0 pt-4">
              <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-bold text-white animate-pulse"
                style={{ background: 'linear-gradient(90deg, #ef4444, #f97316)' }}>
                🔥 LIMITED TIME — BEST VALUE OFFER
              </span>
            </div>

            <div className="px-7 pt-3 pb-7">
              {/* Close */}
              <button onClick={() => setShowUpgrade(false)}
                className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-violet-100 text-slate-400 hover:text-violet-600 transition-colors">
                <X className="w-5 h-5" />
              </button>

              {/* Icon + Title */}
              <div className="text-center mb-5">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 8px 32px rgba(124,58,237,0.4)' }}>
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 mb-1">Unlock Full Access</h3>
                <p className="text-slate-500 text-sm">Join <span className="font-bold text-violet-700">10,000+ students</span> already scoring higher with AI</p>
              </div>

              {/* Price Box */}
              <div className="rounded-2xl p-5 mb-4 text-center relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(168,85,247,0.12))', border: '1px solid rgba(124,58,237,0.2)' }}>
                {/* Best Value Badge */}
                <span className="absolute top-3 right-3 text-[10px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7)', color: 'white' }}>
                  BEST VALUE
                </span>

                {/* Crossed price */}
                <div className="text-sm text-slate-400 line-through mb-0.5">₹499</div>

                {/* Main price */}
                <div className="text-5xl font-black text-violet-700 mb-0.5" style={{ letterSpacing: '-2px' }}>
                  {currencyInfo.symbol}{currencyInfo.amount}
                </div>
                <div className="text-xs text-violet-600 font-bold mb-3">= Just ₹1 per AI solution • One-time payment</div>

                {/* Feature grid — professional icons */}
                <div className="grid grid-cols-2 gap-2 mt-3 text-left">
                  {[
                    { icon: CheckCircle2, text: '100 AI Solutions',    color: '#22c55e', bg: '#dcfce7' },
                    { icon: BookOpen,    text: 'All 13 Subjects',      color: '#3b82f6', bg: '#dbeafe' },
                    { icon: Camera,      text: 'Image Upload',         color: '#a855f7', bg: '#f3e8ff' },
                    { icon: MessageCircle, text: 'Study Buddy Chat',   color: '#f97316', bg: '#ffedd5' },
                    { icon: LayoutGrid,  text: 'Exam-Style Format',    color: '#0ea5e9', bg: '#e0f2fe' },
                    { icon: Zap,         text: 'Instant Activation',   color: '#eab308', bg: '#fef9c3' },
                  ].map(({ icon: Icon, text, color, bg }) => (
                    <div key={text} className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
                      <span className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                        <Icon className="w-3.5 h-3.5" style={{ color }} />
                      </span>
                      {text}
                    </div>
                  ))}
                </div>
              </div>

              {/* Social proof bar */}
              <div className="flex items-center justify-center gap-3 mb-4 text-xs text-slate-500">
                <span className="flex gap-0.5">{[...Array(5)].map((_,i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}</span>
                <span className="font-medium">"The best AI study tool for students worldwide!"</span>
              </div>

              {/* CTA Button — animated pulse */}
              <button
                onClick={handleRazorpayPayment}
                className="w-full text-white font-black py-4 px-4 rounded-2xl text-base transition-all hover:scale-[1.03] active:scale-[0.97] flex items-center justify-center gap-2 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  boxShadow: '0 8px 32px rgba(124,58,237,0.5)',
                  animation: 'pulse 2s infinite'
                }}
              >
                <span className="text-xl">⚡</span>
                <span>Get Instant Access — {currencyInfo.symbol}{currencyInfo.amount} Only</span>
              </button>

              {/* Trust row */}
              <div className="flex items-center justify-center gap-3 mt-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-green-500" /> Razorpay Secured</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-violet-500" /> Instant Top-up</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-blue-500" /> Trusted Globally</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );

  if (view === 'home') {
    return (
      <>
        {AuthLayer}
        <div className="min-h-screen mesh-bg flex flex-col items-center justify-center p-4 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-5xl w-full py-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-50 text-sm font-medium mb-6 border border-violet-100">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <BrandLogo />
            </div>
            <motion.h1
              className="outfit-font text-4xl md:text-7xl lg:text-8xl font-black tracking-tight mb-4 text-slate-900 drop-shadow-sm select-none"
              whileHover={{
                scale: 1.02,
                skewX: -1,
                filter: "drop-shadow(0 0 20px rgba(124,58,237,0.2))"
              }}
              animate={{
                y: [0, -5, 0],
              }}
              transition={{
                y: { repeat: Infinity, duration: 6, ease: "easeInOut" },
                scale: { type: "spring", stiffness: 400, damping: 10 }
              }}
              style={{ willChange: 'transform' }}
            >
              <span className="shimmer-text">AYMAN</span> <span className="text-slate-900">STUDYAI</span>
            </motion.h1>
            <p className="text-slate-500 text-xl mb-12 max-w-3xl mx-auto">
              Instantly generate crystal-clear, perfect <span className="exam-style-text">exam study solutions</span>! Your friendly AI companion for crushing Sciences, Mathematics, Commerce, and more.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SubjectCard
                title="Math AI"
                description="Solve complex equations, calculus, and geometry with step-by-step logic."
                icon={Calculator}
                onClick={() => setView('math')}
                accentColor="#7c3aed"
              />
              <SubjectCard
                title="Physics AI"
                description="Master construction, working, and derivations with hand-drawn diagrams."
                icon={Sparkles}
                onClick={() => setView('physics')}
                accentColor="#3b82f6"
              />
              <SubjectCard
                title="Chemistry AI"
                description="Master organic mechanisms, balanced equations, and IUPAC naming with ease."
                icon={FlaskConical}
                onClick={() => setView('chemistry')}
                accentColor="#10b981"
              />
              <SubjectCard
                title="Biology AI"
                description="Master anatomy, physiology, genetics, and classification with labeled diagrams."
                icon={Microscope}
                onClick={() => setView('biology')}
                accentColor="#f59e0b"
              />
              <SubjectCard
                title="Botany AI"
                description="Master plant anatomy, photosynthesis, and plant classification with ease."
                icon={Leaf}
                onClick={() => setView('botany')}
                accentColor="#10b981"
              />
              <SubjectCard
                title="Zoology AI"
                description="Master animal physiology, organ systems, and animal classification."
                icon={Bird}
                onClick={() => setView('zoology')}
                accentColor="#ef4444"
              />
              <SubjectCard
                title="English AI"
                description="Master grammar, formal writing, and literature analysis with ease."
                icon={Languages}
                onClick={() => setView('english')}
                accentColor="#6366f1"
              />
              <SubjectCard
                title="Computer AI"
                description="Master programming logic, code, and computer theory with ease."
                icon={Monitor}
                onClick={() => setView('computer')}
                accentColor="#14b8a6"
              />
              <SubjectCard
                title="Tamil AI"
                description="Master Tamil grammar, literature, and formal writing with ease."
                icon={Languages}
                onClick={() => setView('tamil')}
                accentColor="#f97316"
              />
              <SubjectCard
                title="History AI"
                description="Master historical events, timelines, and biographical analysis with ease."
                icon={BookOpen}
                onClick={() => setView('history')}
                accentColor="#8b5cf6"
              />
              <SubjectCard
                title="Commerce AI"
                description="Master business studies, management principles, and trade theories with ease."
                icon={Briefcase}
                onClick={() => setView('commerce')}
                accentColor="#3b82f6"
              />
              <SubjectCard
                title="Accountancy AI"
                description="Master journal entries, balance sheets, and accounting principles."
                icon={FileSpreadsheet}
                onClick={() => setView('accountancy')}
                accentColor="#10b981"
              />
              <SubjectCard
                title="Economics AI"
                description="Master micro and macro economics, demand/supply graphs, and theories."
                icon={TrendingUp}
                onClick={() => setView('economics')}
                accentColor="#f59e0b"
              />
              <SubjectCard
                title="Quiz AI"
                description="Generate smart exam-style quizzes from any topic or image instantly."
                icon={Lightbulb}
                onClick={() => setView('quiz')}
                accentColor="#7c3aed"
              />
              <SubjectCard
                title="TN 12th Practice"
                description="Practice TN 12th Std MCQs chapter-by-chapter across all subjects. Tamil Nadu syllabus."
                icon={Trophy}
                onClick={() => { resetTn12(); setView('tn12'); }}
                accentColor="#7c3aed"
              />
              <SubjectCard
                title="Summarise AI"
                description="Paste your long answer — AI extracts exam keywords and creates a marks-worthy summary instantly."
                icon={AlignLeft}
                onClick={() => setView('summarise')}
                accentColor="#8b5cf6"
              />
            </div>
            <div className="mt-12 flex flex-col items-center gap-4">
              <div className="flex gap-6 text-slate-400 text-sm">
                <button onClick={() => setShowTerms(true)} className="hover:text-violet-600 transition-colors">Terms & Conditions</button>
                <button onClick={() => setShowPrivacy(true)} className="hover:text-violet-600 transition-colors">Privacy Policy</button>
                <button onClick={() => setShowContact(true)} className="hover:text-violet-600 transition-colors">Contact Us</button>
              </div>
              <div className="text-slate-400 text-xs">
                © 2026 AYMAN INFOTECH. All rights reserved.
              </div>
            </div>
          </motion.div>

          <PolicyModal
            isOpen={showContact}
            onClose={() => setShowContact(false)}
            title="Contact Us"
          >
            <div className="space-y-4 text-slate-600">
              <section>
                <p className="mb-2">For any support, educational inquiries, or partnership opportunities, you can reach out to us at our official email address. We aim to respond within 24 hours.</p>
                <a href="mailto:aymaninfotechs@gmail.com" className="font-bold text-violet-600 hover:text-violet-700 hover:underline text-lg">aymaninfotechs@gmail.com</a>
              </section>
            </div>
          </PolicyModal>

          <PolicyModal
            isOpen={showTerms}
            onClose={() => setShowTerms(false)}
            title="Terms & Conditions"
          >
            <div className="space-y-5 text-slate-600 text-sm leading-relaxed">
              <p className="text-xs text-slate-400 italic">Last updated: April 2025 — Effective immediately upon use of the platform.</p>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">1. Acceptance of Terms</h3>
                <p>By accessing, registering on, or using Ayman Study AI (the "Service"), you unconditionally agree to these Terms and Conditions ("Terms"). If you do not agree with any part of these Terms, you must immediately discontinue use of the Service. These Terms constitute a legally binding agreement between you ("User") and AYMAN INFOTECH ("Company", "we", "us").</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">2. Nature of Service & Educational Purpose</h3>
                <p>Ayman Study AI is an AI-powered educational assistance tool intended solely as a study aid and reference resource. The Service does NOT replace formal education, qualified teachers, academic institutions, or professional advisors. All AI-generated answers are for informational and learning purposes only. Users are solely responsible for independently verifying any information before using it in examinations, academic submissions, or any other official context.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">3. AI Accuracy Disclaimer — No Warranty</h3>
                <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. Ayman Study AI uses third-party AI models (including but not limited to Google Gemini, Groq, OpenRouter). <strong>We make absolutely no guarantee, representation, or warranty</strong> that AI-generated responses are accurate, complete, current, error-free, or fit for any particular purpose. AI systems can and do produce incorrect, incomplete, or misleading outputs. <strong>The Company shall not be held liable</strong> for any academic loss, exam failure, loss of marks, or any consequence arising from reliance on AI-generated content.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">4. Limitation of Liability</h3>
                <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE COMPANY, ITS DIRECTORS, EMPLOYEES, PARTNERS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES, including but not limited to: loss of marks or grades, exam failure, academic penalties, data loss, or any loss arising from use or inability to use the Service — even if the Company has been advised of the possibility of such damages. The total aggregate liability of the Company to any user shall not exceed the amount paid by that user to the Service in the 3 months preceding the claim.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">5. Payment, Credits & Refund Policy</h3>
                <p>All payments made for credits or premium access are <strong>final and non-refundable</strong>. Credits are digital goods consumed upon use of AI queries. Once a credit has been used or a payment confirmed, no refund will be issued under any circumstances, including but not limited to: dissatisfaction with AI responses, technical issues on the user's device, or accidental purchase. The Company reserves the right to modify pricing at any time without prior notice.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">6. User Conduct & Prohibited Use</h3>
                <p>Users agree not to: (a) use the Service for any unlawful purpose; (b) attempt to reverse-engineer, scrape, or access the Service's AI endpoints directly; (c) resell, redistribute, or commercially exploit AI-generated content; (d) submit content that is harmful, abusive, or violates third-party rights; (e) misuse the Service to generate content that aids academic fraud. Violation of these terms may result in immediate account suspension without refund.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">7. Intellectual Property</h3>
                <p>All platform content, branding, logos, UI design, code, and features are the exclusive intellectual property of AYMAN INFOTECH and are protected under applicable intellectual property, copyright, and trademark laws. No part of this Service may be reproduced, copied, or distributed without prior written consent from the Company.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">8. Indemnification</h3>
                <p>You agree to indemnify, defend, and hold harmless AYMAN INFOTECH and its affiliates, officers, agents, and employees from and against any claims, liabilities, damages, losses, and expenses, including reasonable legal fees, arising out of or in any way connected with your use or misuse of the Service, your violation of these Terms, or your violation of any rights of any third party.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">9. Service Availability & Modifications</h3>
                <p>The Company reserves the right to modify, suspend, or discontinue the Service (or any part thereof) at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuation of the Service.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">10. Governing Law & Jurisdiction</h3>
                <p>These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts located in India. By using this Service, you irrevocably consent to the exclusive jurisdiction and venue of courts in India for resolution of any disputes.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">11. Changes to Terms</h3>
                <p>We reserve the right to update these Terms at any time. Your continued use of the Service after any changes constitutes your acceptance of the new Terms. It is your responsibility to review these Terms periodically.</p>
              </section>

              <p className="text-xs text-slate-400 mt-4 border-t pt-4">By using Ayman Study AI, you confirm that you have read, understood, and agree to all of the above Terms and Conditions in their entirety.</p>
            </div>
          </PolicyModal>

          <PolicyModal
            isOpen={showPrivacy}
            onClose={() => setShowPrivacy(false)}
            title="Privacy Policy"
          >
            <div className="space-y-5 text-slate-600 text-sm leading-relaxed">
              <p className="text-xs text-slate-400 italic">Last updated: April 2025 — This policy applies to all users of Ayman Study AI globally.</p>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">1. Information We Collect</h3>
                <p>We collect the following categories of information: (a) <strong>Account Data</strong> — name and email address provided during Google Sign-In; (b) <strong>Usage Data</strong> — questions, text, and images you submit to the AI; (c) <strong>Transaction Data</strong> — payment records processed via Razorpay (we do not store card details); (d) <strong>Technical Data</strong> — IP address, browser type, device info, and session logs for security and service improvement.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">2. How We Use Your Data</h3>
                <p>Your data is used strictly to: (a) process and respond to your AI queries; (b) maintain and improve the platform; (c) prevent fraud and abuse; (d) communicate important service updates. We do <strong>NOT</strong> use your data for advertising profiling or sell it to third-party marketers.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">3. Third-Party AI Processors</h3>
                <p>To deliver AI-powered responses, your input data (questions and images) is transmitted to third-party AI providers including Google Gemini API, Groq, and OpenRouter. These providers process your data solely to generate responses on our behalf and are bound by their own privacy policies. By using this Service, you consent to this processing. We are not responsible for the privacy practices of these third-party providers.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">4. Data Retention</h3>
                <p>We retain your account data for as long as your account is active. Query data (questions/images) may be retained for up to 90 days for debugging and service quality purposes, after which it is automatically deleted. Payment transaction records are retained as required by applicable financial regulations.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">5. Data Security</h3>
                <p>We implement industry-standard security measures including HTTPS encryption, secure API communication, and access controls to protect your data. However, no method of transmission over the internet is 100% secure. <strong>We cannot guarantee absolute security</strong> and accept no liability for unauthorized access beyond our reasonable control.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">6. Cookies & Tracking</h3>
                <p>We may use session cookies and local storage solely for authentication and user session management. We do not use advertising cookies or third-party tracking pixels.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">7. Your Rights</h3>
                <p>Subject to applicable law, you may: (a) request access to or deletion of your personal data; (b) withdraw consent at any time by discontinuing use of the Service; (c) contact us at aymaninfotechs@gmail.com for any data-related requests. We will respond to all verified requests within 30 days.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">8. Children's Privacy</h3>
                <p>The Service is intended for users aged 13 and above. We do not knowingly collect personal data from children under 13. If we become aware that a child under 13 has provided personal data, we will delete it immediately.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">9. Changes to This Policy</h3>
                <p>We reserve the right to update this Privacy Policy at any time. Continued use of the Service after changes constitutes acceptance of the revised policy. We encourage you to review this page periodically.</p>
              </section>

              <p className="text-xs text-slate-400 mt-4 border-t pt-4">For any privacy concerns, contact us at: <strong>aymaninfotechs@gmail.com</strong></p>
            </div>
          </PolicyModal>
        </div>
      </>
    );
  }

  // ── TN 12TH PRACTICE VIEW ────────────────────────────────
  if (view === 'tn12') {
    const selectedSubjectData = TN12_DATA.find(s => s.name === tn12Subject);
    const selectedChapterData = selectedSubjectData?.chapters.find(c => c.name === tn12Chapter);
    const mcqs = selectedChapterData?.mcqs || [];
    // In results phase, use tn12Log.length as total so scorePercent stays correct
    const totalQuestions = tn12Phase === 'results' ? tn12Log.length || mcqs.length : mcqs.length;
    const scorePercent = totalQuestions > 0 ? Math.round((tn12Score / totalQuestions) * 100) : 0;

    const getMedalEmoji = () => {
      if (scorePercent >= 90) return '🥇';
      if (scorePercent >= 70) return '🥈';
      if (scorePercent >= 50) return '🥉';
      return '😅';
    };

    const getMedalMessage = () => {
      if (scorePercent >= 90) return 'Outstanding! You are exam-ready! 🎉';
      if (scorePercent >= 70) return 'Great work! Keep practising! 💪';
      if (scorePercent >= 50) return 'Good effort! Review the topics again. 📖';
      return 'Keep going! Practice makes perfect. 🔁';
    };



    return (
      <>
        {AuthLayer}
        <div className="min-h-screen mesh-bg text-[#0f172a] p-4 md:p-8">
          <div className="max-w-4xl mx-auto pt-16">
            
            {/* Smart Back Button — goes back one level at a time */}
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => {
                  if (tn12Phase === 'subjects') { setView('home'); resetTn12(); }
                  else if (tn12Phase === 'chapters') { setTn12Phase('subjects'); setTn12Subject(null); setTn12Chapter(null); }
                  else if (tn12Phase === 'quiz') { setTn12Phase('chapters'); setTn12Chapter(null); setTn12Selected(null); }
                  else if (tn12Phase === 'results') { setTn12Phase('chapters'); setTn12Chapter(null); setTn12Selected(null); }
                }}
                className="flex items-center gap-2 text-slate-500 hover:text-violet-600 transition-colors font-semibold text-sm"
              >
                <ChevronLeft className="w-5 h-5" />
                {tn12Phase === 'subjects' ? 'Home' : tn12Phase === 'chapters' ? 'Subjects' : tn12Phase === 'quiz' ? tn12Subject || 'Chapters' : tn12Subject || 'Chapters'}
              </button>

              {/* Breadcrumb trail */}
              <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <span className="hover:text-violet-600 cursor-pointer" onClick={() => { setView('home'); resetTn12(); }}>Home</span>
                {tn12Subject && <><ChevronRight className="w-3.5 h-3.5"/><span className="hover:text-violet-600 cursor-pointer" onClick={() => { setTn12Phase('subjects'); setTn12Subject(null); setTn12Chapter(null); }}>TN 12th</span></>}
                {tn12Subject && <><ChevronRight className="w-3.5 h-3.5"/><span className="text-slate-600 font-semibold">{tn12Subject}</span></>}
                {tn12Chapter && <><ChevronRight className="w-3.5 h-3.5"/><span className="text-violet-600 font-semibold truncate max-w-[200px]">{tn12Chapter}</span></>}
              </div>
            </div>

            {/* Phase 1: Select Subject */}
            {tn12Phase === 'subjects' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="text-center mb-10">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-50 text-violet-600 text-sm font-medium mb-4 border border-violet-100">
                    <Trophy className="w-4 h-4" /> TN 12th Standard
                  </div>
                  <h1 className="outfit-font text-4xl md:text-5xl font-black tracking-tight mb-3 text-slate-900">
                    Select <span className="text-violet-600">Subject</span>
                  </h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {TN12_DATA.map(subj => (
                    <button
                      key={subj.name}
                      onClick={() => { setTn12Subject(subj.name); setTn12Phase('chapters'); }}
                      className="premium-glass-card rounded-2xl p-6 text-center hover:-translate-y-1 transition-all group"
                      style={{ borderBottom: `4px solid ${subj.color}40` }}
                    >
                      <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{subj.emoji}</div>
                      <h3 className="font-bold text-lg text-slate-800">{subj.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{subj.chapters.length} Chapters</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Phase 2: Select Chapter */}
            {tn12Phase === 'chapters' && selectedSubjectData && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-3xl font-black mb-6 text-slate-800 flex items-center gap-3">
                  <span className="text-4xl">{selectedSubjectData.emoji}</span> {selectedSubjectData.name} Chapters
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedSubjectData.chapters.map(chap => (
                    <button
                      key={chap.name}
                      onClick={() => { 
                        if (chap.mcqs.length === 0) { alert('MCQs coming soon for this chapter!'); return; }
                        if (!user) { alert('🔐 Please login with Google to start the quiz!'); return; }
                        setTn12Chapter(chap.name); 
                        setTn12Current(0); 
                        setTn12Score(0);
                        setTn12Log([]);
                        setTn12Selected(null);
                        setTn12Phase('quiz'); 
                      }}
                      className={`text-left premium-glass-card rounded-xl p-5 transition-colors flex items-center justify-between group ${chap.mcqs.length > 0 ? 'hover:border-violet-300 cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
                    >
                      <div>
                        <h4 className="font-bold text-slate-800 group-hover:text-violet-700 transition-colors">{chap.name}</h4>
                        <p className="text-xs text-slate-500 mt-1">{chap.mcqs.length} MCQs available</p>
                        {chap.mcqs.length > 0 && !user && (
                          <p className="text-xs text-violet-500 font-semibold mt-1 flex items-center gap-1">🔐 Login required to start</p>
                        )}
                      </div>
                      {chap.mcqs.length > 0 && !user
                        ? <KeyRound className="w-5 h-5 text-violet-400" />
                        : <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-violet-500 transition-colors" />
                      }
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Phase 3: Quiz Player */}
            {tn12Phase === 'quiz' && mcqs.length > 0 && (
              <motion.div key={tn12Current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-2xl mx-auto">
                <div className="premium-glass-card rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
                  
                  {/* Progress Bar */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100">
                    <div 
                      className="h-full bg-violet-600 transition-all duration-500 ease-out" 
                      style={{ width: `${((tn12Current + 1) / mcqs.length) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between mb-8">
                    <span className="text-sm font-bold text-violet-600 tracking-widest uppercase bg-violet-50 px-3 py-1 rounded-full border border-violet-100">
                      Question {tn12Current + 1} of {mcqs.length}
                    </span>
                    <span className="text-sm font-bold text-slate-400">Score: <span className="text-slate-700">{tn12Score}</span></span>
                  </div>

                  <h3 className="text-xl md:text-2xl font-semibold text-slate-800 leading-relaxed mb-8">
                    <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                      {fixLatex(mcqs[tn12Current].question)}
                    </ReactMarkdown>
                  </h3>

                  <div className="space-y-3">
                    {mcqs[tn12Current].options.map((opt, i) => {
                      const isSelected = tn12Selected === opt;
                      const isCorrectAnswer = opt === mcqs[tn12Current].answer;
                      let bgClass = "bg-white border-slate-200 hover:border-violet-400 hover:bg-violet-50 text-slate-700";
                      
                      if (tn12Selected !== null) {
                        if (isCorrectAnswer) bgClass = "bg-green-50 border-green-500 text-green-800 font-medium";
                        else if (isSelected && !isCorrectAnswer) bgClass = "bg-red-50 border-red-500 text-red-800 font-medium";
                        else bgClass = "bg-white border-slate-200 opacity-50";
                      }

                      return (
                        <button
                          key={i}
                          disabled={tn12Selected !== null}
                          onClick={() => handleTn12Answer(opt, mcqs[tn12Current].answer)}
                          className={cn(
                            "w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group",
                            bgClass
                          )}
                        >
                          <span className="text-base md:text-lg">
                            <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                              {fixLatex(opt)}
                            </ReactMarkdown>
                          </span>
                          {tn12Selected !== null && isCorrectAnswer && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                          {tn12Selected === opt && !isCorrectAnswer && <X className="w-5 h-5 text-red-600" />}
                        </button>
                      );
                    })}
                  </div>

                  {tn12Selected !== null && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
                      <button
                        onClick={() => handleTn12Next(mcqs.length)}
                        className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
                      >
                        {tn12Current + 1 >= mcqs.length ? 'View Results' : 'Next Question'} <ChevronRight className="w-5 h-5" />
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Phase 4: Results Score Card */}
            {tn12Phase === 'results' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">

                {/* ── Top Medal Card ── */}
                <div className="premium-glass-card rounded-3xl p-8 text-center shadow-2xl mb-6 relative overflow-hidden">
                  {/* Background gradient blob */}
                  <div className="absolute inset-0 pointer-events-none" style={{ background: scorePercent >= 70 ? 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.07), transparent 70%)' : 'radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.05), transparent 70%)' }} />

                  <div className="text-7xl mb-3 animate-bounce">{getMedalEmoji()}</div>
                  <h2 className="text-3xl font-black text-slate-900 mb-1">Quiz Completed!</h2>
                  <p className="text-slate-500 font-medium mb-6">{getMedalMessage()}</p>

                  {/* Score Stats Bar */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Score</p>
                      <p className="text-3xl font-black text-violet-600">{tn12Score}<span className="text-lg font-semibold text-slate-300">/{mcqs.length}</span></p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Accuracy</p>
                      <p className="text-3xl font-black" style={{ color: scorePercent >= 70 ? '#7c3aed' : scorePercent >= 50 ? '#f59e0b' : '#ef4444' }}>{scorePercent}%</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Wrong</p>
                      <p className="text-3xl font-black text-red-500">{mcqs.length - tn12Score}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${scorePercent}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                      className="h-full rounded-full"
                      style={{ background: scorePercent >= 70 ? 'linear-gradient(90deg,#7c3aed,#a855f7)' : scorePercent >= 50 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#ef4444,#f87171)' }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 font-medium mb-6">{scorePercent >= 70 ? '🟢 Pass' : '🔴 Needs Improvement'} · {tn12Chapter}</p>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setTn12Current(0); setTn12Score(0); setTn12Log([]); setTn12Selected(null); setTn12Phase('quiz'); }}
                      className="flex-1 bg-violet-600 text-white font-bold py-3.5 rounded-xl hover:bg-violet-700 transition-all hover:-translate-y-0.5 shadow-lg shadow-violet-200 flex justify-center items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" /> Retry
                    </button>
                    <button
                      onClick={() => { setTn12Phase('chapters'); setTn12Chapter(null); setTn12Selected(null); }}
                      className="flex-1 bg-white text-slate-700 border-2 border-slate-200 font-bold py-3.5 rounded-xl hover:border-violet-400 hover:text-violet-600 transition-colors"
                    >
                      Chapters
                    </button>
                    <button
                      onClick={() => { resetTn12(); }}
                      className="flex-1 bg-white text-slate-700 border-2 border-slate-200 font-bold py-3.5 rounded-xl hover:border-violet-400 hover:text-violet-600 transition-colors"
                    >
                      Subjects
                    </button>
                  </div>
                </div>

                {/* ── Answer Review Score Card ── */}
                <div className="premium-glass-card rounded-3xl p-6 shadow-xl">
                  <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-violet-600" />
                    Answer Review
                  </h3>

                  <div className="space-y-3">
                    {mcqs.map((q, idx) => {
                      const logEntry = tn12Log[idx];
                      const isCorrect = logEntry?.correct ?? false;
                      const studentAnswer = logEntry?.selected ?? '—';

                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className={`rounded-xl p-4 border-l-4 ${isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-black text-white ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                              {isCorrect ? '✓' : '✗'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-slate-700 mb-2 leading-snug">
                                <span className="text-slate-400 font-bold mr-1">Q{idx + 1}.</span>
                                <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={{ p: 'span' }}>
                                  {fixLatex(q.question)}
                                </ReactMarkdown>
                              </div>
                              {!isCorrect && (
                                <div className="text-xs text-red-600 font-semibold mb-1 flex gap-1">
                                  Your answer: 
                                  <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={{ p: 'span' }}>
                                    {fixLatex(studentAnswer)}
                                  </ReactMarkdown>
                                </div>
                              )}
                              <div className={`text-xs font-bold ${isCorrect ? 'text-green-700' : 'text-green-700'} flex gap-1`}>
                                ✅ Correct: 
                                <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={{ p: 'span' }}>
                                  {fixLatex(q.answer)}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

              </motion.div>
            )}

          </div>
        </div>
      </>
    );
  }

  // ── QUIZ AI GAME VIEW ────────────────────────────────────
  if (view === 'quiz') {
    const classes = ['Class 9', 'Class 10', 'Class 11', 'Class 12', 'NEET', 'JEE', 'General'];
    const counts = [5, 10, 15, 20];
    const scorePercent = quizData.length > 0 ? Math.round((quizScore / quizData.length) * 100) : 0;

    const getMedalEmoji = () => {
      if (scorePercent >= 90) return '🥇';
      if (scorePercent >= 70) return '🥈';
      if (scorePercent >= 50) return '🥉';
      return '😅';
    };

    const getMedalMessage = () => {
      if (scorePercent >= 90) return 'Outstanding! You are exam-ready!';
      if (scorePercent >= 70) return 'Great work! Keep practising!';
      if (scorePercent >= 50) return 'Good effort! Review the topics again.';
      return 'Keep going! Practice makes perfect.';
    };

    return (
      <>
        {AuthLayer}
        <div className="min-h-screen mesh-bg text-[#0f172a] p-4 md:p-8">
          <div className="max-w-2xl mx-auto pt-16">

            {/* Back Button */}
            <button
              onClick={() => { setView('home'); resetQuiz(); }}
              className="flex items-center gap-2 text-slate-500 hover:text-violet-600 transition-colors font-medium mb-8"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Home
            </button>

            {/* ── SETUP PHASE ── */}
            {(quizPhase === 'setup' || quizPhase === 'generating') && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {/* Header */}
                <div className="text-center mb-10">
                  <motion.div
                    initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-50 text-violet-600 text-sm font-medium mb-4 border border-violet-100"
                  >
                    <ClipboardList className="w-4 h-4" />
                    AI Quiz Challenge
                  </motion.div>
                  <h1 className="outfit-font text-4xl md:text-5xl font-black tracking-tight mb-3 text-slate-900">
                    Quiz <span className="text-violet-600">AI</span>
                  </h1>
                  <p className="text-slate-500 text-base md:text-lg max-w-xl mx-auto">
                    Set up your <span className="font-semibold text-violet-600">MCQ challenge</span>, then test yourself instantly!
                  </p>
                </div>

                <div className="premium-glass-card rounded-3xl p-7 md:p-9 space-y-8">

                  {/* Topic Input */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">📚 Quiz Topic</label>
                    <input
                      type="text"
                      value={quizTopic}
                      onChange={e => setQuizTopic(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && generateQuiz()}
                      placeholder="e.g., Photosynthesis, Newton's Laws, World War II…"
                      className="premium-input-box w-full px-5 py-4 rounded-2xl text-base text-slate-800 font-medium"
                      disabled={quizPhase === 'generating'}
                    />
                  </div>

                  {/* Question Count */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">🔢 Number of Questions</label>
                    <div className="flex gap-3 flex-wrap">
                      {counts.map(c => (
                        <button
                          key={c}
                          onClick={() => setQuizCount(c)}
                          disabled={quizPhase === 'generating'}
                          className={cn(
                            'flex-1 min-w-[72px] py-3 rounded-2xl font-black text-xl transition-all border-2',
                            quizCount === c
                              ? 'bg-violet-600 text-white border-violet-600 shadow-lg scale-105'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-violet-400 hover:text-violet-600'
                          )}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Class/Grade */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">🎓 Select Class / Level</label>
                    <div className="flex gap-2 flex-wrap">
                      {classes.map(cls => (
                        <button
                          key={cls}
                          onClick={() => setQuizClass(cls)}
                          disabled={quizPhase === 'generating'}
                          className={cn(
                            'px-4 py-2.5 rounded-xl font-bold text-sm transition-all border-2',
                            quizClass === cls
                              ? 'bg-violet-600 text-white border-violet-600 shadow-md scale-105'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-600'
                          )}
                        >
                          {cls}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Error */}
                  {quizError && (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl flex items-center gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4" /> {quizError}
                    </div>
                  )}

                  {/* Generate Button */}
                  <button
                    onClick={generateQuiz}
                    disabled={quizPhase === 'generating' || !quizTopic.trim()}
                    className="w-full py-5 rounded-2xl font-black text-lg text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 8px 32px rgba(124,58,237,0.4)' }}
                  >
                    {quizPhase === 'generating' ? (
                      <><Loader2 className="w-6 h-6 animate-spin" /> Generating your quiz…</>
                    ) : (
                      <><Zap className="w-6 h-6" /> Start Quiz Challenge!</>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── PLAYING PHASE ── */}
            {quizPhase === 'playing' && quizData.length > 0 && (
              <motion.div key={quizCurrent} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2 text-sm font-semibold text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <ClipboardList className="w-4 h-4 text-violet-500" />
                      Question {quizCurrent + 1} of {quizData.length}
                    </span>
                    <span className="flex items-center gap-1 text-violet-600 font-bold">
                      ⚡ Score: {quizScore}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${((quizCurrent) / quizData.length) * 100}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </div>

                {/* Question Card */}
                <div className="premium-glass-card rounded-3xl p-7 md:p-9 mb-5">
                  <div className="text-xl md:text-2xl font-bold text-slate-900 leading-snug mb-8">
                    <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                      {quizData[quizCurrent].question}
                    </ReactMarkdown>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    {quizData[quizCurrent].options.map((opt, i) => {
                      const isCorrect = opt === quizData[quizCurrent].answer;
                      const isSelected = opt === quizSelected;
                      const revealed = quizSelected !== null;

                      let optStyle = 'bg-white border-slate-200 text-slate-700 hover:border-violet-400 hover:bg-violet-50';
                      if (revealed) {
                        if (isCorrect) optStyle = 'bg-green-50 border-green-400 text-green-800 font-bold';
                        else if (isSelected && !isCorrect) optStyle = 'bg-red-50 border-red-400 text-red-700 line-through opacity-80';
                        else optStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                      }

                      return (
                        <motion.button
                          key={i}
                          onClick={() => handleQuizAnswer(opt)}
                          disabled={revealed}
                          whileHover={!revealed ? { scale: 1.01 } : {}}
                          whileTap={!revealed ? { scale: 0.99 } : {}}
                          className={cn(
                            'w-full text-left px-5 py-4 rounded-2xl border-2 text-base font-semibold transition-all flex items-center gap-3',
                            optStyle,
                            !revealed && 'cursor-pointer'
                          )}
                        >
                          <span className={cn(
                            'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black',
                            revealed && isCorrect ? 'bg-green-500 text-white' :
                              revealed && isSelected && !isCorrect ? 'bg-red-400 text-white' :
                                'bg-slate-100 text-slate-500'
                          )}>
                            {['A', 'B', 'C', 'D'][i]}
                          </span>
                          <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={{ p: 'span' }}>
                            {opt.replace(/^[A-D]\.\s*/, '')}
                          </ReactMarkdown>
                          {revealed && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />}
                          {revealed && isSelected && !isCorrect && <X className="w-5 h-5 text-red-400 ml-auto" />}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  <AnimatePresence>
                    {quizSelected !== null && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="mt-5 p-4 rounded-2xl bg-violet-50 border border-violet-100"
                      >
                        <p className="text-sm font-bold text-violet-700 mb-1">💡 Explanation</p>
                        <div className="text-sm text-violet-900">
                          <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                            {quizData[quizCurrent].explanation}
                          </ReactMarkdown>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Next / Finish Button */}
                {quizSelected !== null && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    onClick={handleQuizNext}
                    className="w-full py-4 rounded-2xl font-black text-lg text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 8px 24px rgba(124,58,237,0.4)' }}
                  >
                    {quizCurrent + 1 >= quizData.length ? (
                      <><Trophy className="w-5 h-5" /> Finish & See Results</>
                    ) : (
                      <>Next Question <ChevronRight className="w-5 h-5" /></>
                    )}
                  </motion.button>
                )}
              </motion.div>
            )}

            {/* ── RESULTS PHASE ── */}
            {quizPhase === 'results' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                <div
                  className="premium-glass-card rounded-3xl p-8 md:p-10 text-center"
                  style={{ background: 'linear-gradient(160deg, #fff, #faf5ff)', border: '1.5px solid rgba(124,58,237,0.2)' }}
                >
                  <div className="text-7xl mb-4">{getMedalEmoji()}</div>
                  <h2 className="outfit-font text-3xl md:text-4xl font-black text-slate-900 mb-2">Quiz Complete!</h2>
                  <p className="text-slate-500 mb-6">{quizTopic} · {quizClass}</p>

                  <div
                    className="inline-flex flex-col items-center justify-center w-40 h-40 rounded-full mb-6 mx-auto"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 16px 48px rgba(124,58,237,0.4)' }}
                  >
                    <span className="text-5xl font-black text-white">{quizScore}</span>
                    <span className="text-sm text-violet-200 font-bold">/ {quizData.length}</span>
                  </div>

                  <div className="text-2xl font-black text-violet-700 mb-2">{scorePercent}%</div>
                  <p className="text-slate-600 font-semibold mb-8">{getMedalMessage()}</p>

                  {/* Score bar */}
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-8">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: scorePercent >= 70 ? 'linear-gradient(90deg,#22c55e,#86efac)' : scorePercent >= 50 ? 'linear-gradient(90deg,#f59e0b,#fcd34d)' : 'linear-gradient(90deg,#ef4444,#fca5a5)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${scorePercent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => { resetQuiz(); }}
                      className="flex-1 py-4 rounded-2xl font-bold text-slate-700 bg-white border-2 border-slate-200 hover:border-violet-300 transition-all flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-5 h-5" /> New Quiz
                    </button>
                    <button
                      onClick={() => { setQuizPhase('playing'); setQuizCurrent(0); setQuizScore(0); setQuizAnswerLog([]); setQuizSelected(null); }}
                      className="flex-1 py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 8px 24px rgba(124,58,237,0.3)' }}
                    >
                      <RotateCcw className="w-5 h-5" /> Retry Same Quiz
                    </button>
                  </div>
                </div>

                {/* Answer Review */}
                <div className="premium-glass-card rounded-3xl overflow-hidden">
                  <div className="px-7 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-slate-600">
                    <BookOpen className="w-4 h-4 text-violet-500" /> Answer Review
                  </div>
                  <div className="divide-y divide-slate-100">
                    {quizData.map((q, i) => {
                      const log = quizAnswerLog[i];
                      return (
                        <div key={i} className="p-5">
                          <div className="flex items-start gap-3 mb-2">
                            <span className={cn('flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black', log?.correct ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500')}>
                              {i + 1}
                            </span>
                            <p className="text-sm font-semibold text-slate-800">{q.question}</p>
                          </div>
                          <div className="ml-10 space-y-1 text-xs">
                            {log && !log.correct && (
                              <p className="text-red-500">Your answer: <span className="font-bold">{log.selected.replace(/^[A-D]\.\s*/, '')}</span></p>
                            )}
                            <p className="text-green-600">✓ Correct: <span className="font-bold">{q.answer.replace(/^[A-D]\.\s*/, '')}</span></p>
                            <p className="text-slate-500 italic">{q.explanation}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </>
    );
  }
  // ─────────────────────────────────────────────────────────

  // ── SUMMARISE AI VIEW ────────────────────────────────────
  if (view === 'summarise') {
    const SUMMARISE_SYSTEM = `You are an expert exam keyword coach and answer analyser.
A student will give you their written exam answer. Analyse it carefully and output EXACTLY in this format:

--- SUMMARY ---

Write a concise, marks-optimised summary of the student's answer in 4–6 clear sentences.
Bold every keyword using **keyword** markdown.
This should be a model answer a student would write to score maximum marks.

--- KEYWORDS ---

List every exam-worthy keyword and technical term found in the answer.
Format each on its own line as: • **keyword** — one-line definition or exam significance
Include at least 8–12 keywords. If fewer exist, extract all available.

--- MISSING ---

List important keywords or concepts that a perfect answer SHOULD contain but are ABSENT from the student's answer.
Format each as a bullet point: • **missing keyword** — why it matters for marks.
If nothing critical is missing, write exactly: ✅ Excellent coverage! No critical keywords missing.

--- MARKS TIPS ---

Give exactly 5 specific, actionable, numbered tips for this student to maximise marks:
1. ...
2. ...
3. ...
4. ...
5. ...`;

    const parsedSummariseSections: { title: string; content: string }[] = [];
    if (result) {
      // More forgiving regex in case AI adds asterisks or changes spaces
      const segs = result.split(/[-*]{0,3}\s?---?\s?(KEYWORDS|SUMMARY|MISSING|MARKS TIPS)\s?---?\s?[-*]{0,3}/i);
      for (let i = 1; i < segs.length; i += 2) {
        parsedSummariseSections.push({
          title: segs[i].toUpperCase(),
          content: segs[i + 1]?.trim() || ''
        });
      }

      // Fallback: If AI completely ignored the strict formatting, just show the raw response
      if (parsedSummariseSections.length === 0 && result.trim().length > 0) {
        parsedSummariseSections.push({
          title: 'SUMMARY',
          content: result.trim()
        });
      }
    }

    const sectionMeta: Record<string, { icon: React.ReactNode; headerBg: string; bodyClass: string; label: string }> = {
      'KEYWORDS': {
        icon: <KeyRound className="w-4 h-4 text-amber-500" />,
        headerBg: 'bg-amber-50 border-amber-100',
        bodyClass: 'keywords-section p-6 md:p-8',
        label: 'Exam Keywords Found'
      },
      'SUMMARY': {
        icon: <BookOpen className="w-4 h-4 text-violet-500" />,
        headerBg: 'bg-violet-50 border-violet-100',
        bodyClass: 'handwritten-paper',
        label: 'Marks-Worthy Summary'
      },
      'MISSING': {
        icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
        headerBg: 'bg-red-50/60 border-red-100',
        bodyClass: 'p-6 md:p-8',
        label: 'Missing Keywords'
      },
      'MARKS TIPS': {
        icon: <Lightbulb className="w-4 h-4 text-green-500" />,
        headerBg: 'bg-green-50/60 border-green-100',
        bodyClass: 'p-6 md:p-8',
        label: 'Marks Tips'
      }
    };

    return (
      <>
        {AuthLayer}
        <div className="min-h-screen mesh-bg text-[#0f172a] p-4 md:p-8">
          <div className="max-w-3xl mx-auto pt-16">
            {/* Back */}
            <button
              onClick={() => { setView('home'); clearAll(); }}
              className="flex items-center gap-2 text-slate-500 hover:text-violet-600 transition-colors font-medium mb-8"
            >
              <X className="w-5 h-5" />
              Back to Home
            </button>

            {/* Hero */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-50 text-violet-600 text-sm font-medium mb-4 border border-violet-100"
              >
                <AlignLeft className="w-4 h-4" />
                Exam Keyword Extractor
              </motion.div>
              <h1 className="outfit-font text-4xl md:text-5xl font-black tracking-tight mb-3 text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700">
                Summarise <span className="text-violet-600">AI</span>
              </h1>
              <p className="text-slate-500 text-base md:text-lg max-w-2xl mx-auto">
                Paste your long answer — AI extracts <span className="exam-style-text">exam-worthy keywords</span> and builds a concise, marks-ready summary.
              </p>
            </div>

            {/* Input Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
              <div className="md:col-span-2 space-y-4">
                <div className="premium-glass-card p-5 md:p-6 rounded-3xl h-full flex flex-col">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    📄 Paste Your Full Answer Here
                  </label>
                  <textarea
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    onPaste={(e: React.ClipboardEvent) => {
                      const items = e.clipboardData.items;
                      for (let i = 0; i < items.length; i++) {
                        if (items[i].type.indexOf('image') === 0) {
                          e.preventDefault();
                          const blob = items[i].getAsFile();
                          if (blob) {
                            const reader = new FileReader();
                            reader.onloadend = () => setImage(reader.result as string);
                            reader.readAsDataURL(blob);
                          }
                          break;
                        }
                      }
                    }}
                    placeholder="Paste your long exam answer here, e.g., 'Photosynthesis is the process by which green plants absorb sunlight using chlorophyll...' — The AI will identify all exam-worthy keywords and summarise it succinctly."
                    className="premium-input-box w-full flex-1 min-h-[224px] p-4 rounded-2xl text-base resize-none text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="premium-glass-card p-5 md:p-6 rounded-3xl h-[300px] flex flex-col">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Or Upload Answer Image
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "premium-upload-box flex-1 w-full rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden",
                      image && "border-solid bg-white/80"
                    )}
                  >
                    {image ? (
                      <div className="relative w-full h-full p-2 flex items-center justify-center">
                        <img src={image} alt="Answer" className="max-w-full max-h-full object-contain rounded-lg" />
                        <button
                          onClick={(e) => { e.stopPropagation(); setImage(null); }}
                          className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-slate-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-sm text-slate-500 font-medium tracking-wide">Click to upload</span>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mb-8">
              <button
                onClick={async () => {
                  if (!user) { alert('Please login first!'); return; }
    if (user.credits <= 0) { setShowUpgrade(true); setQuizPhase('setup'); return; }
                  if (!problem.trim() && !image) { setError('Please paste your answer or upload an image first.'); return; }
                  setLoading(true); setError(null); setResult(null);
                  try {
                    const base64Data = image ? image.split(',')[1] : null;
                    const finalPrompt = problem.trim() || "Analyse the exam answer shown in this image, extract the keywords, and write a summary.";

                    const res = await fetch(API_URL, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                      body: JSON.stringify({
                        prompt: finalPrompt,
                        image: base64Data,
                        mimeType: "image/png",
                        systemInstruction: SUMMARISE_SYSTEM,
                        credits: user?.credits
                      })
                    });
                    const data = await res.json().catch(() => null);
                    if (data && data.status === 'success') {
                      setResult(data.text);
                      setUser((prev: any) => {
        const cur = prev?.credits !== undefined ? prev.credits : 20;
        const next = data.remaining_credits !== undefined ? Math.min(data.remaining_credits, cur - 1) : cur - 1;
        return { ...prev, credits: Math.max(0, next) };
      });
                    } else if (data.message === 'INSUFFICIENT_CREDITS') {
                      setShowUpgrade(true);
                    } else { throw new Error(data.message || 'Failed'); }
                  } catch (e: any) { setError(e.message); }
                  finally { setLoading(false); }
                }}
                disabled={loading}
                className="premium-btn flex-1 text-white font-bold text-base md:text-lg py-4 px-6 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Analysing Answer...</>
                ) : (
                  <><AlignLeft className="w-5 h-5" /> Extract Keywords &amp; Summarise</>
                )}
              </button>
              <button
                onClick={clearAll}
                className="px-5 py-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-medium transition-all text-sm"
              >
                Clear
              </button>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2"
                >
                  <X className="w-5 h-5" />{error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            <AnimatePresence>
              {parsedSummariseSections.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-16">
                  {parsedSummariseSections.map((sec, idx) => {
                    const meta = sectionMeta[sec.title] || {
                      icon: <Sparkles className="w-4 h-4 text-violet-500" />,
                      headerBg: 'bg-slate-50',
                      bodyClass: 'p-6',
                      label: sec.title
                    };
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="premium-glass-card rounded-3xl overflow-hidden"
                      >
                        <div className={cn('result-section-header px-6 py-4 flex items-center gap-2', meta.headerBg)}>
                          {meta.icon}
                          <span className="font-bold text-sm uppercase tracking-wider text-slate-600">{meta.label}</span>
                          {sec.title === 'KEYWORDS' && (
                            <span className="exam-style-badge ml-auto">
                              <KeyRound className="w-2 h-2" /> KEY TERMS
                            </span>
                          )}
                        </div>
                        <div className={cn('markdown-body', meta.bodyClass)}>
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}
                            components={{
                              strong({ children }) {
                                return sec.title === 'KEYWORDS'
                                  ? <strong className="keyword-pill">{children}</strong>
                                  : <strong>{children}</strong>;
                              }
                            }}
                          >
                            {sec.content}
                          </ReactMarkdown>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div className="text-center text-slate-400 text-xs pt-2">
                    Generated by AYMANSTUDY AI · Always verify before your exam.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </>
    );
  }
  // ─────────────────────────────────────────────────────────

  return (
    <>
      {AuthLayer}
      <div className="min-h-screen mesh-bg text-[#0f172a] p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <header className="mb-12">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
              <button
                onClick={() => { setView('home'); clearAll(); }}
                className="flex items-center gap-2 text-slate-500 hover:text-violet-600 transition-colors font-medium"
              >
                <X className="w-5 h-5" />
                Back to Home
              </button>
              <div className="text-xs sm:text-sm tracking-widest uppercase">
                <BrandLogo />
              </div>
            </div>

            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-50 text-violet-600 text-sm font-medium mb-4 border border-violet-100"
              >
                <Sparkles className="w-4 h-4" />
                AI-Powered {view.charAt(0).toUpperCase() + view.slice(1)} Excellence
              </motion.div>
              <h1 className="outfit-font text-4xl md:text-6xl font-black tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700">
                {view === 'math' ? 'MathMaster' :
                  view === 'physics' ? 'PhysicPro' :
                    view === 'chemistry' ? 'ChemExpert' :
                      view === 'biology' ? 'BioGenius' :
                        view === 'botany' ? 'BotanyExpert' :
                          view === 'zoology' ? 'ZooPro' :
                            view === 'english' ? 'EnglishMaster' :
                              view === 'computer' ? 'CodeExpert' :
                                view === 'history' ? 'HistoryPro' :
                                  view === 'commerce' ? 'CommerceGuru' :
                                    view === 'accountancy' ? 'AccountsPro' :
                                      view === 'economics' ? 'EconExpert' :
                                        view === 'tamil' ? 'TamilBuddy' : 'SubjectExpert'} <span className="text-violet-600">Study Buddy</span>
              </h1>
              <p className="text-slate-500 text-lg max-w-4xl mx-auto">
                Get perfect <span className="exam-style-text">exam-style</span> solutions with step-by-step logic and clear teaching explanations.
              </p>
            </div>
          </header>

          {/* Unified Input Section - ChatGPT Style */}
          <div className="max-w-4xl mx-auto mb-16 mt-4">

            {/* Outer Box */}
            <div className={cn(
              "bg-white/90 backdrop-blur-2xl rounded-[2rem] overflow-hidden premium-card-shadow border border-violet-100/80 transition-all",
              "focus-within:border-violet-300 focus-within:shadow-[0_15px_50px_-10px_rgba(124,58,237,0.25)]"
            )}>

              {/* Image Preview — inside box, above textarea */}
              <AnimatePresence>
                {image && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-5 pt-4 pb-1"
                  >
                    <div className="relative inline-block">
                      <img
                        src={image}
                        alt="Uploaded"
                        className="h-28 w-auto max-w-[180px] object-cover rounded-2xl border border-slate-200 shadow-md"
                      />
                      <button
                        onClick={() => setImage(null)}
                        className="absolute -top-1.5 -right-1.5 p-1 bg-slate-800 hover:bg-red-500 text-white rounded-full shadow-lg transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-violet-600 text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                        Image Ready
                      </span>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input Row */}
              <div className="flex items-end px-2 pb-2 pt-2 gap-1">

                {/* Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3.5 mb-0.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-all flex-shrink-0"
                  title="Upload Image"
                >
                  <Plus className="w-7 h-7" />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

                {/* Textarea */}
                <textarea
                  value={problem}
                  onChange={(e) => {
                    setProblem(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (problem.trim() || image) solveProblem();
                    }
                  }}
                  onPaste={(e: React.ClipboardEvent) => {
                    const items = e.clipboardData.items;
                    for (let i = 0; i < items.length; i++) {
                      if (items[i].type.indexOf('image') === 0) {
                        e.preventDefault();
                        const blob = items[i].getAsFile();
                        if (blob) {
                          const reader = new FileReader();
                          reader.onloadend = () => setImage(reader.result as string);
                          reader.readAsDataURL(blob);
                        }
                        break;
                      }
                    }
                  }}
                  placeholder={image ? "Describe the image or add your question (optional)..." : "Ask anything..."}
                  className="flex-1 max-h-[200px] my-2 bg-transparent font-medium text-slate-800 placeholder-slate-400 px-3 py-2 outline-none resize-none overflow-y-auto text-lg leading-relaxed"
                  rows={1}
                />

                {/* Send Button */}
                <div className="flex-shrink-0 p-1.5 mb-0.5">
                  <button
                    onClick={solveProblem}
                    disabled={loading || (!problem.trim() && !image)}
                    className="premium-btn text-white p-3.5 rounded-full disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6 ml-0.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Under-bar hints */}
            <div className="mt-3 flex flex-col sm:flex-row items-center justify-between px-4 text-xs font-medium text-slate-400">
              <span>
                Press{' '}
                <kbd className="font-sans px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">Shift</kbd>
                {' '}+{' '}
                <kbd className="font-sans px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">Enter</kbd>
                {' '}for a new line
              </span>
              <button onClick={clearAll} className="mt-2 sm:mt-0 flex items-center gap-1 hover:text-violet-500 transition-colors">
                <X className="w-3 h-3" /> Clear
              </button>
            </div>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-8 flex items-center gap-2"
              >
                <X className="w-5 h-5" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Section */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 pb-20"
              >
                {(() => {
                  // Normalize AI header variations: 1-4 dashes/em-dashes, optional bold markers
                const normalizedResult = result.replace(
                  /\*{0,2}[-\u2014\u2013]{1,4}\s*(SOLUTION|FINAL ANSWER|EXPLANATION|EXTRA|KEYWORDS)\s*[-\u2014\u2013]{1,4}\*{0,2}/gi,
                  (_m: string, s: string) => `\n--- ${s.toUpperCase()} ---\n`
                );
                const sections = normalizedResult.split(/\n--- (SOLUTION|EXPLANATION|EXTRA|FINAL ANSWER|KEYWORDS) ---\n/i);
                const parsedSections: { title: string; content: string }[] = [];

                for (let i = 1; i < sections.length; i += 2) {
                  const ct = (sections[i + 1] || '').trim();
                  if (ct) parsedSections.push({ title: sections[i].toUpperCase(), content: ct });
                }

                if (parsedSections.length === 0) {
                  const cleanedResult = result.replace(
                    /\*{0,2}[-\u2014\u2013]{1,4}\s*(SOLUTION|FINAL ANSWER|EXPLANATION|EXTRA|KEYWORDS)\s*[-\u2014\u2013]{1,4}\*{0,2}/gi,
                    '\n\n**                **\n\n'
                  );
                  return (
                    <div className="premium-glass-card rounded-3xl overflow-x-auto markdown-body handwritten-paper">
                      <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                        {cleanedResult}
                      </ReactMarkdown>
                    </div>
                  );
                }

                  return (
                    <>
                      {parsedSections
                        .filter(section => {
                          if (view === 'chemistry') {
                            return !['EXPLANATION', 'EXTRA'].includes(section.title);
                          }
                          return true;
                        })
                        .map((section, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={cn(
                              "premium-glass-card rounded-3xl overflow-x-auto",
                              section.title === "FINAL ANSWER" && "border-violet-300 bg-violet-50/50"
                            )}
                          >
                            <div className={cn(
                              "result-section-header px-8 py-5 flex items-center justify-between",
                              section.title === "SOLUTION" && "bg-slate-50",
                              section.title === "FINAL ANSWER" && "bg-violet-50 border-violet-100",
                              section.title === "EXPLANATION" && "bg-green-50/50 border-green-100/50",
                              section.title === "EXTRA" && "bg-purple-50/50 border-purple-100/50",
                              section.title === "KEYWORDS" && "bg-amber-50/50 border-amber-100/50"
                            )}>
                              <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-slate-600">
                                {section.title === "SOLUTION" && (
                                  view === 'math' ? <Calculator className="w-4 h-4 text-violet-500" /> :
                                    view === 'physics' ? <Sparkles className="w-4 h-4 text-violet-500" /> :
                                      view === 'chemistry' ? <FlaskConical className="w-4 h-4 text-violet-500" /> :
                                        view === 'biology' ? <Microscope className="w-4 h-4 text-violet-500" /> :
                                          view === 'botany' ? <Leaf className="w-4 h-4 text-violet-500" /> :
                                            view === 'zoology' ? <Bird className="w-4 h-4 text-violet-500" /> :
                                              view === 'english' ? <Languages className="w-4 h-4 text-violet-500" /> :
                                                view === 'computer' ? <Monitor className="w-4 h-4 text-violet-500" /> :
                                                  view === 'commerce' ? <Briefcase className="w-4 h-4 text-violet-500" /> :
                                                    view === 'accountancy' ? <FileSpreadsheet className="w-4 h-4 text-violet-500" /> :
                                                      view === 'economics' ? <TrendingUp className="w-4 h-4 text-violet-500" /> :
                                                        view === 'tamil' ? <Languages className="w-4 h-4 text-violet-500" /> :
                                                          <Languages className="w-4 h-4 text-violet-500" />
                                )}
                                {section.title === "FINAL ANSWER" && <CheckCircle2 className="w-4 h-4 text-violet-600" />}
                                {section.title === "EXPLANATION" && <BookOpen className="w-4 h-4 text-green-600" />}
                                {section.title === "EXTRA" && <Sparkles className="w-4 h-4 text-purple-600" />}
                                {section.title === "KEYWORDS" && <Sparkles className="w-4 h-4 text-amber-600" />}
                                {section.title}
                                {section.title === "SOLUTION" && (
                                  <span className="exam-style-badge">
                                    <Sparkles className="w-2 h-2" /> Exam Style
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className={cn(
                              "markdown-body",
                              section.title === "SOLUTION" ? "handwritten-paper" : "p-8",
                              section.title === "FINAL ANSWER" && "text-2xl font-bold text-center text-violet-700",
                              section.title === "KEYWORDS" && "bg-amber-50/10 italic text-amber-900"
                            )}>
                              <ReactMarkdown
                                remarkPlugins={[remarkMath, remarkGfm]}
                                rehypePlugins={[rehypeKatex]}
                                components={{
                                  code({ node, inline, className, children, ...props }: any) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    if (!inline && match && (match[1] === 'svg' || match[1] === 'mermaid')) {
                                      // Diagram generation is disabled
                                      return null;
                                    }
                                    return (
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    );
                                  }
                                }}
                              >
                                {section.content}
                              </ReactMarkdown>
                            </div>
                          </motion.div>
                        ))}

                      {/* Chat Section */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="premium-glass-card rounded-3xl overflow-hidden flex flex-col"
                      >
                        <div className="px-8 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-slate-600">
                          <Sparkles className="w-4 h-4 text-violet-500" />
                          {view === 'math' ? 'Ask about this solution' :
                            view === 'physics' ? 'Ask about Construction & Working' :
                              view === 'chemistry' ? 'Ask about Reactions & Mechanisms' :
                                view === 'biology' ? 'Ask about Anatomy & Processes' :
                                  view === 'botany' ? 'Ask about Plant Structures' :
                                    view === 'zoology' ? 'Ask about Animal Systems' :
                                      view === 'english' ? 'Ask about Grammar & Literature' :
                                        view === 'computer' ? 'Ask about Code & Logic' :
                                          view === 'history' ? 'Ask about Events & Timelines' :
                                            view === 'commerce' ? 'Ask about Business Concepts' :
                                              view === 'accountancy' ? 'Ask about Entries & Concepts' :
                                                view === 'economics' ? 'Ask about Economic Theories' :
                                                  view === 'tamil' ? 'Ask about Tamil Grammar & Literature' : 'Ask about Exam Concepts'}
                        </div>

                        <div className="p-4 sm:p-6 space-y-6 max-h-[60vh] overflow-y-auto bg-slate-50/30">
                          {chatHistory.length === 0 && (
                            <div className="text-center py-8 italic text-slate-400">
                              {view === 'math'
                                ? "Have a doubt? Ask me anything about the steps above!"
                                : view === 'physics'
                                  ? "Need to understand the construction or working? Ask me anything!"
                                  : view === 'chemistry'
                                    ? "Want to know more about the reaction or mechanism? Ask away!"
                                    : view === 'biology'
                                      ? "Want to know more about the anatomy or process? Ask away!"
                                      : view === 'botany'
                                        ? "Want to know more about plant anatomy or physiology? Ask away!"
                                        : view === 'zoology'
                                          ? "Want to know more about animal systems or classification? Ask away!"
                                          : view === 'english'
                                            ? "Want to know more about grammar or literature? Ask away!"
                                            : view === 'computer'
                                              ? "Want to know more about the code or logic? Ask away!"
                                              : view === 'history'
                                                ? "Want to know more about historical events or timelines? Ask away!"
                                                : view === 'commerce'
                                                  ? "Want to know more about business or trade? Ask away!"
                                                  : view === 'accountancy'
                                                    ? "Want to know more about accounting entries or principles? Ask away!"
                                                    : view === 'economics'
                                                      ? "Want to know more about economic theories or charts? Ask away!"
                                                      : view === 'tamil'
                                                        ? "Have a doubt about any quiz question or its correct answer? Ask away!"
                                                        : "Want to know more about Tamil grammar or literature? Ask away!"}
                            </div>
                          )}
                          {chatHistory.map((msg, i) => (
                            <div key={i} className={cn(
                              "flex flex-col w-full max-w-[95%] md:max-w-[85%]",
                              msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                            )}>
                              <div className={cn(
                                "px-4 py-2 rounded-2xl text-sm",
                                msg.role === 'user'
                                  ? "premium-chat-user rounded-tr-none px-5 py-3"
                                  : "handwritten-paper-chat rounded-tl-none shadow-md border-violet-100"
                              )}>
                                <ReactMarkdown
                                  remarkPlugins={[remarkMath, remarkGfm]}
                                  rehypePlugins={[rehypeKatex]}
                                  components={{
                                    code({ node, inline, className, children, ...props }: any) {
                                      const match = /language-(\w+)/.exec(className || '');
                                      if (!inline && match && (match[1] === 'svg' || match[1] === 'mermaid')) {
                                        // Diagram generation is disabled
                                        return null;
                                      }
                                      return (
                                        <code className={className} {...props}>
                                          {children}
                                        </code>
                                      );
                                    }
                                  }}
                                >
                                  {msg.text}
                                </ReactMarkdown>
                              </div>
                            </div>
                          ))}
                          {chatLoading && (
                            <div className="flex items-center gap-2 text-slate-400 text-sm animate-pulse">
                              <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                              Thinking...
                            </div>
                          )}
                          <div ref={chatEndRef} />
                        </div>

                        <form onSubmit={handleChat} className="p-4 border-t border-slate-100 bg-white/50 backdrop-blur-md flex gap-2">
                          <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Ask a follow-up question..."
                            className="premium-input-box flex-1 px-5 py-3 rounded-xl text-slate-800"
                          />
                          <button
                            type="submit"
                            disabled={chatLoading || !chatInput.trim()}
                            className="premium-btn text-white px-4 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="w-6 h-6" />
                          </button>
                        </form>
                      </motion.div>
                    </>
                  );
                })()}

                {/* Footer Note */}
                <div className="text-center text-slate-400 text-sm font-medium flex flex-col gap-1">
                  <span>Generated by AYMANSTUDY AI</span>
                  <span className="text-xs opacity-70">AYMANINFOTECH</span>
                </div>
                <div className="mt-4 text-center text-slate-400 text-xs">
                  Ayman Study AI can make mistakes. Please verify important information.
                </div>
                <div className="mt-6 flex justify-center gap-4 text-slate-400 text-xs">
                  <button onClick={() => setShowTerms(true)} className="hover:text-violet-600 transition-colors">Terms & Conditions</button>
                  <button onClick={() => setShowPrivacy(true)} className="hover:text-violet-600 transition-colors">Privacy Policy</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <PolicyModal
            isOpen={showTerms}
            onClose={() => setShowTerms(false)}
            title="Terms & Conditions"
          >
            <div className="space-y-5 text-slate-600 text-sm leading-relaxed">
              <p className="text-xs text-slate-400 italic">Last updated: April 2025 — Effective immediately upon use of the platform.</p>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">1. Acceptance of Terms</h3>
                <p>By accessing, registering on, or using Ayman Study AI (the "Service"), you unconditionally agree to these Terms and Conditions ("Terms"). If you do not agree with any part of these Terms, you must immediately discontinue use of the Service. These Terms constitute a legally binding agreement between you ("User") and AYMAN INFOTECH ("Company", "we", "us").</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">2. Nature of Service & Educational Purpose</h3>
                <p>Ayman Study AI is an AI-powered educational assistance tool intended solely as a study aid and reference resource. The Service does NOT replace formal education, qualified teachers, academic institutions, or professional advisors. All AI-generated answers are for informational and learning purposes only. Users are solely responsible for independently verifying any information before using it in examinations, academic submissions, or any other official context.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">3. AI Accuracy Disclaimer — No Warranty</h3>
                <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. Ayman Study AI uses third-party AI models (including but not limited to Google Gemini, Groq, OpenRouter). <strong>We make absolutely no guarantee, representation, or warranty</strong> that AI-generated responses are accurate, complete, current, error-free, or fit for any particular purpose. AI systems can and do produce incorrect, incomplete, or misleading outputs. <strong>The Company shall not be held liable</strong> for any academic loss, exam failure, loss of marks, or any consequence arising from reliance on AI-generated content.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">4. Limitation of Liability</h3>
                <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE COMPANY, ITS DIRECTORS, EMPLOYEES, PARTNERS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES, including but not limited to: loss of marks or grades, exam failure, academic penalties, data loss, or any loss arising from use or inability to use the Service — even if the Company has been advised of the possibility of such damages. The total aggregate liability of the Company to any user shall not exceed the amount paid by that user to the Service in the 3 months preceding the claim.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">5. Payment, Credits & Refund Policy</h3>
                <p>All payments made for credits or premium access are <strong>final and non-refundable</strong>. Credits are digital goods consumed upon use of AI queries. Once a credit has been used or a payment confirmed, no refund will be issued under any circumstances, including but not limited to: dissatisfaction with AI responses, technical issues on the user's device, or accidental purchase. The Company reserves the right to modify pricing at any time without prior notice.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">6. User Conduct & Prohibited Use</h3>
                <p>Users agree not to: (a) use the Service for any unlawful purpose; (b) attempt to reverse-engineer, scrape, or access the Service's AI endpoints directly; (c) resell, redistribute, or commercially exploit AI-generated content; (d) submit content that is harmful, abusive, or violates third-party rights; (e) misuse the Service to generate content that aids academic fraud. Violation of these terms may result in immediate account suspension without refund.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">7. Intellectual Property</h3>
                <p>All platform content, branding, logos, UI design, code, and features are the exclusive intellectual property of AYMAN INFOTECH and are protected under applicable intellectual property, copyright, and trademark laws. No part of this Service may be reproduced, copied, or distributed without prior written consent from the Company.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">8. Indemnification</h3>
                <p>You agree to indemnify, defend, and hold harmless AYMAN INFOTECH and its affiliates, officers, agents, and employees from and against any claims, liabilities, damages, losses, and expenses, including reasonable legal fees, arising out of or in any way connected with your use or misuse of the Service, your violation of these Terms, or your violation of any rights of any third party.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">9. Service Availability & Modifications</h3>
                <p>The Company reserves the right to modify, suspend, or discontinue the Service (or any part thereof) at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuation of the Service.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">10. Governing Law & Jurisdiction</h3>
                <p>These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts located in India. By using this Service, you irrevocably consent to the exclusive jurisdiction and venue of courts in India for resolution of any disputes.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">11. Changes to Terms</h3>
                <p>We reserve the right to update these Terms at any time. Your continued use of the Service after any changes constitutes your acceptance of the new Terms. It is your responsibility to review these Terms periodically.</p>
              </section>

              <p className="text-xs text-slate-400 mt-4 border-t pt-4">By using Ayman Study AI, you confirm that you have read, understood, and agree to all of the above Terms and Conditions in their entirety.</p>
            </div>
          </PolicyModal>

          <PolicyModal
            isOpen={showPrivacy}
            onClose={() => setShowPrivacy(false)}
            title="Privacy Policy"
          >
            <div className="space-y-5 text-slate-600 text-sm leading-relaxed">
              <p className="text-xs text-slate-400 italic">Last updated: April 2025 — This policy applies to all users of Ayman Study AI globally.</p>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">1. Information We Collect</h3>
                <p>We collect the following categories of information: (a) <strong>Account Data</strong> — name and email address provided during Google Sign-In; (b) <strong>Usage Data</strong> — questions, text, and images you submit to the AI; (c) <strong>Transaction Data</strong> — payment records processed via Razorpay (we do not store card details); (d) <strong>Technical Data</strong> — IP address, browser type, device info, and session logs for security and service improvement.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">2. How We Use Your Data</h3>
                <p>Your data is used strictly to: (a) process and respond to your AI queries; (b) maintain and improve the platform; (c) prevent fraud and abuse; (d) communicate important service updates. We do <strong>NOT</strong> use your data for advertising profiling or sell it to third-party marketers.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">3. Third-Party AI Processors</h3>
                <p>To deliver AI-powered responses, your input data (questions and images) is transmitted to third-party AI providers including Google Gemini API, Groq, and OpenRouter. These providers process your data solely to generate responses on our behalf and are bound by their own privacy policies. By using this Service, you consent to this processing. We are not responsible for the privacy practices of these third-party providers.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">4. Data Retention</h3>
                <p>We retain your account data for as long as your account is active. Query data (questions/images) may be retained for up to 90 days for debugging and service quality purposes, after which it is automatically deleted. Payment transaction records are retained as required by applicable financial regulations.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">5. Data Security</h3>
                <p>We implement industry-standard security measures including HTTPS encryption, secure API communication, and access controls to protect your data. However, no method of transmission over the internet is 100% secure. <strong>We cannot guarantee absolute security</strong> and accept no liability for unauthorized access beyond our reasonable control.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">6. Cookies & Tracking</h3>
                <p>We may use session cookies and local storage solely for authentication and user session management. We do not use advertising cookies or third-party tracking pixels.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">7. Your Rights</h3>
                <p>Subject to applicable law, you may: (a) request access to or deletion of your personal data; (b) withdraw consent at any time by discontinuing use of the Service; (c) contact us at aymaninfotechs@gmail.com for any data-related requests. We will respond to all verified requests within 30 days.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">8. Children's Privacy</h3>
                <p>The Service is intended for users aged 13 and above. We do not knowingly collect personal data from children under 13. If we become aware that a child under 13 has provided personal data, we will delete it immediately.</p>
              </section>

              <section>
                <h3 className="font-bold text-slate-900 mb-2">9. Changes to This Policy</h3>
                <p>We reserve the right to update this Privacy Policy at any time. Continued use of the Service after changes constitutes acceptance of the revised policy. We encourage you to review this page periodically.</p>
              </section>

              <p className="text-xs text-slate-400 mt-4 border-t pt-4">For any privacy concerns, contact us at: <strong>aymaninfotechs@gmail.com</strong></p>
            </div>
          </PolicyModal>
        </div>
      </div>
    </>
  );
}

const PolicyModal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        >
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
            <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>
          <div className="p-8 overflow-y-auto">
            {children}
          </div>
          <div className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex justify-end">
            <button
              onClick={onClose}
              className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded-xl font-semibold transition-all"
            >
              I Understand
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

