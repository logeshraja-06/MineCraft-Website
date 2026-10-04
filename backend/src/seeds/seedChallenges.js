/**
 * seedChallenges.js
 *
 * Populates the MongoDB database with challenges, tasks, and per-language block
 * configurations using the same data previously stored in frontend/src/data/challenges.js.
 *
 * Usage:
 *   cd backend
 *   node src/seeds/seedChallenges.js
 *
 * This is idempotent: it upserts by slug, so re-running is safe.
 */

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (_) {}

const mongoose = require('mongoose');
const env = require('../config/env');
const Challenge = require('../models/Challenge');
const TestCase = require('../models/TestCase');
const QRBlock = require('../models/QRBlock');
const { generateQRToken } = require('../services/qr/qrValidation');

// ── Static challenge data (mirrored from frontend) ─────────────────────────

const QUIZ_TYPE_MAP = {
  mcq: 'MCQ',
  output: 'OUTPUT_PREDICTION',
  fill: 'FILL_BLANK',
};

const CHALLENGES_DATA = [  {
    slug: 'ch-05',
    sequenceOrder: 1,
    title: 'Challenge 5 – Greatest Among Three Numbers',
    category: 'Conditionals & Logic',
    difficulty: 'Easy',
    points: 100,
    description:
      'Given three integers A, B, and C from standard input, determine and display the greatest (maximum) number among them.\n\nInput: Three integers separated by whitespace.\nOutput: A single integer representing the greatest value.',
    sampleInput: '10 25 15',
    sampleOutput: '25',
    timeLimitSeconds: 1200,
    supportedLanguages: ['python', 'java', 'cpp', 'c'],
    hiddenTests: [
      { input: '10 25 15', expectedOutput: '25', description: 'Middle operand maximum' },
      { input: '50 12 3', expectedOutput: '50', description: 'First operand maximum' },
      { input: '7 9 99', expectedOutput: '99', description: 'Third operand maximum' },
      { input: '-15 -5 -30', expectedOutput: '-5', description: 'All negative operands' },
      { input: '42 42 42', expectedOutput: '42', description: 'All three operands equal' },
      { input: '100 100 50', expectedOutput: '100', description: 'Two identical maximum operands' },
      { input: '15 200 200', expectedOutput: '200', description: 'Last two identical maximum operands' },
      { input: '0 0 -1', expectedOutput: '0', description: 'Zero boundary test' },
    ],
    languageConfigs: [
      {
        language: 'python',
        languageName: 'Python 3',
        blocks: [
          { blockId: 'py5-f1', code: 'import sys', role: 'MAIN_WRAPPER', order: 1 },
          { blockId: 'py5-f2', code: 'tokens = sys.stdin.read().split()\na, b, c = int(tokens[0]), int(tokens[1]), int(tokens[2])', role: 'INPUT', order: 2 },
          { blockId: 'py5-f3', code: 'if a >= b and a >= c:\n    ans = a\nelif b >= a and b >= c:\n    ans = b\nelse:\n    ans = c', role: 'LOGIC', order: 3 },
          { blockId: 'py5-f4', code: 'print(ans)', role: 'OUTPUT', order: 4 },
        ],
        revealOrder: ['py5-f1', 'py5-f2', 'py5-f3', 'py5-f4'],
        acceptedOrders: [],
      },
      {
        language: 'java',
        languageName: 'Java 17',
        blocks: [
          { blockId: 'java5-f1', code: 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {', role: 'MAIN_WRAPPER', order: 1 },
          { blockId: 'java5-f2', code: '        Scanner sc = new Scanner(System.in);\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        int c = sc.nextInt();', role: 'INPUT', order: 2 },
          { blockId: 'java5-f3', code: '        int maxVal;\n        if (a >= b && a >= c) {\n            maxVal = a;\n        } else if (b >= a && b >= c) {\n            maxVal = b;\n        } else {\n            maxVal = c;\n        }', role: 'LOGIC', order: 3 },
          { blockId: 'java5-f4', code: '        System.out.println(maxVal);\n    }\n}', role: 'OUTPUT', order: 4 },
        ],
        revealOrder: ['java5-f1', 'java5-f2', 'java5-f3', 'java5-f4'],
        acceptedOrders: [],
      },
      {
        language: 'cpp',
        languageName: 'C++ 17',
        blocks: [
          { blockId: 'cpp5-f1', code: '#include <iostream>\nusing namespace std;\n\nint main() {', role: 'MAIN_WRAPPER', order: 1 },
          { blockId: 'cpp5-f2', code: '    int a, b, c;\n    cin >> a >> b >> c;', role: 'INPUT', order: 2 },
          { blockId: 'cpp5-f3', code: '    int maxVal;\n    if (a >= b && a >= c) {\n        maxVal = a;\n    } else if (b >= a && b >= c) {\n        maxVal = b;\n    } else {\n        maxVal = c;\n    }', role: 'LOGIC', order: 3 },
          { blockId: 'cpp5-f4', code: '    cout << maxVal << endl;\n    return 0;\n}', role: 'OUTPUT', order: 4 },
        ],
        revealOrder: ['cpp5-f1', 'cpp5-f2', 'cpp5-f3', 'cpp5-f4'],
        acceptedOrders: [],
      },
      {
        language: 'c',
        languageName: 'C (GCC)',
        blocks: [
          { blockId: 'c5-f1', code: '#include <stdio.h>\n\nint main() {', role: 'MAIN_WRAPPER', order: 1 },
          { blockId: 'c5-f2', code: '    int a, b, c;\n    scanf("%d %d %d", &a, &b, &c);', role: 'INPUT', order: 2 },
          { blockId: 'c5-f3', code: '    int maxVal;\n    if (a >= b && a >= c) {\n        maxVal = a;\n    } else if (b >= a && b >= c) {\n        maxVal = b;\n    } else {\n        maxVal = c;\n    }', role: 'LOGIC', order: 3 },
          { blockId: 'c5-f4', code: '    printf("%d\\n", maxVal);\n    return 0;\n}', role: 'OUTPUT', order: 4 },
        ],
        revealOrder: ['c5-f1', 'c5-f2', 'c5-f3', 'c5-f4'],
        acceptedOrders: [],
      },
    ],
    tasks: [
      {
        taskId: 'task-1',
        title: 'Task 1: Program Entry & Boilerplate Setup',
        description: 'Complete this task to unlock the program skeleton and header imports.',
        order: 1,
        penalty: 20,
        cooldownSeconds: 3,
        rewards: {
          python: 'py5-f1',
          java: 'java5-f1',
          cpp: 'cpp5-f1',
          c: 'c5-f1',
        },
        quizPool: [
          {
            quizId: 'q5-entry-1',
            type: 'MCQ',
            prompt: 'In C and C++, which header file provides standard input/output functions?',
            options: ['<stdio.h> / <iostream>', '<stdlib.h>', '<math.h>', '<string.h>'],
            answer: 0,
            explain: '<stdio.h> provides printf/scanf in C, and <iostream> provides cin/cout in C++.',
            concept: 'imports',
          },
          {
            quizId: 'q5-entry-2',
            type: 'MCQ',
            prompt: 'What is the signature of the entry point method in standard Java applications?',
            options: ['public static void main(String[] args)', 'public void start()', 'static main()', 'void run(int args)'],
            answer: 0,
            explain: 'The JVM requires public static void main(String[] args) as the application entry point.',
            concept: 'java-entry',
          },
        ],
      },
      {
        taskId: 'task-2',
        title: 'Task 2: Read Three Input Values',
        description: 'Complete this task to unlock the standard input extraction block.',
        order: 2,
        penalty: 20,
        cooldownSeconds: 3,
        rewards: {
          python: 'py5-f2',
          java: 'java5-f2',
          cpp: 'cpp5-f2',
          c: 'c5-f2',
        },
        quizPool: [
          {
            quizId: 'q5-input-1',
            type: 'MCQ',
            prompt: 'In C, which scanf statement correctly reads three integer variables a, b, and c?',
            options: ['scanf("%d %d %d", &a, &b, &c);', 'scanf("%d", a, b, c);', 'cin >> a >> b >> c;', 'input(a, b, c);'],
            answer: 0,
            explain: 'scanf requires the "%d" format specifier and the address-of operator (&) for each variable.',
            concept: 'c-input',
          },
          {
            quizId: 'q5-input-2',
            type: 'MCQ',
            prompt: 'In Java, which method of the Scanner class reads the next integer token from input?',
            options: ['nextInt()', 'readInt()', 'next()', 'parseInteger()'],
            answer: 0,
            explain: '`Scanner.nextInt()` extracts the next integer token separated by whitespace.',
            concept: 'java-input',
          },
        ],
      },
      {
        taskId: 'task-3',
        title: 'Task 3: Compare Numbers & Determine Maximum',
        description: 'Complete this task to unlock the conditional logic block.',
        order: 3,
        penalty: 20,
        cooldownSeconds: 3,
        rewards: {
          python: 'py5-f3',
          java: 'java5-f3',
          cpp: 'cpp5-f3',
          c: 'c5-f3',
        },
        quizPool: [
          {
            quizId: 'q5-logic-1',
            type: 'MCQ',
            prompt: 'Which logical operator is used to verify that A is greater than or equal to BOTH B and C?',
            options: ['&& (Logical AND)', '|| (Logical OR)', '! (Logical NOT)', '^ (Bitwise XOR)'],
            answer: 0,
            explain: 'The logical AND operator (&& in C/C++/Java, `and` in Python) requires both conditions to evaluate to true.',
            concept: 'operators',
          },
          {
            quizId: 'q5-logic-2',
            type: 'OUTPUT_PREDICTION',
            prompt: 'What is the greatest value among A = -15, B = -5, and C = -30?',
            options: [],
            answer: '-5',
            explain: '-5 is closest to zero on the number line, making it the greatest negative value.',
            concept: 'negative-numbers',
          },
        ],
      },
      {
        taskId: 'task-4',
        title: 'Task 4: Output the Result',
        description: 'Complete this task to unlock the output printing and termination block.',
        order: 4,
        penalty: 20,
        cooldownSeconds: 3,
        rewards: {
          python: 'py5-f4',
          java: 'java5-f4',
          cpp: 'cpp5-f4',
          c: 'c5-f4',
        },
        quizPool: [
          {
            quizId: 'q5-out-1',
            type: 'MCQ',
            prompt: 'In C++, which stream manipulator advances the cursor to the next line and flushes the stream?',
            options: ['endl', 'flush', 'newline', 'break'],
            answer: 0,
            explain: '`endl` inserts a newline character into the output stream and flushes the buffer.',
            concept: 'cpp-output',
          },
          {
            quizId: 'q5-out-2',
            type: 'MCQ',
            prompt: 'In Python, what is the default behavior of `print()` after displaying arguments?',
            options: ['Appends a newline character (\\n)', 'Does not add any character', 'Appends a space', 'Terminates the program'],
            answer: 0,
            explain: 'Python `print()` ends with a newline character by default unless overridden with `end=...`.',
            concept: 'python-output',
          },
        ],
      },
    ],
  },
  {
    slug: 'ch-06',
    sequenceOrder: 2,
    title: 'Challenge 6 – Count Primes up to N',
    category: 'Loops & Functions',
    difficulty: 'Medium',
    points: 200,
    description:
      'Given an integer N from standard input, determine and display the number of prime numbers less than or equal to N.\n\nInput: A single integer N (1 <= N <= 10000).\nOutput: A single integer representing the count of prime numbers <= N.',
    sampleInput: '10',
    sampleOutput: '4',
    timeLimitSeconds: 1200,
    supportedLanguages: ['python', 'java', 'cpp', 'c'],
    hiddenTests: [
      { input: '1\n', expectedOutput: '0', description: 'Edge case: 1 is not prime' },
      { input: '2\n', expectedOutput: '1', description: 'Smallest prime number' },
      { input: '10\n', expectedOutput: '4', description: 'Sample case: primes 2, 3, 5, 7' },
      { input: '20\n', expectedOutput: '8', description: 'Primes <= 20' },
      { input: '97\n', expectedOutput: '25', description: 'Prime upper boundary 97' },
      { input: '100\n', expectedOutput: '25', description: 'Century boundary 100' },
      { input: '1000\n', expectedOutput: '168', description: 'N = 1000' },
      { input: '10000\n', expectedOutput: '1229', description: 'Maximum constraint N = 10000' },
    ],
    languageConfigs: [
      {
        language: 'python',
        languageName: 'Python 3',
        blocks: [
          { blockId: 'py6-f1', code: 'import sys\n\ndef main():', role: 'MAIN_WRAPPER', order: 1 },
          { blockId: 'py6-f2', code: '    tokens = sys.stdin.read().split()\n    if not tokens:\n        return\n    n = int(tokens[0])\n    count = 0', role: 'INPUT', order: 2 },
          { blockId: 'py6-f3', code: '    def is_prime(val):\n        if val < 2:\n            return False\n        d = 2\n        while d * d <= val:\n            if val % d == 0:\n                return False\n            d += 1\n        return True', role: 'LOGIC', order: 3 },
          { blockId: 'py6-f4', code: '    for i in range(2, n + 1):\n        if is_prime(i):', role: 'LOGIC', order: 4 },
          { blockId: 'py6-f5', code: '            count += 1', role: 'LOGIC', order: 5 },
          { blockId: 'py6-f6', code: '    print(count)\n\nif __name__ == \'__main__\':\n    main()', role: 'OUTPUT', order: 6 },
        ],
        revealOrder: ['py6-f1', 'py6-f2', 'py6-f3', 'py6-f4', 'py6-f5', 'py6-f6'],
        acceptedOrders: [],
      },
      {
        language: 'java',
        languageName: 'Java 17',
        blocks: [
          { blockId: 'java6-f1', code: 'import java.util.Scanner;\nimport java.util.function.IntPredicate;\n\npublic class Main {\n    public static void main(String[] args) {', role: 'MAIN_WRAPPER', order: 1 },
          { blockId: 'java6-f2', code: '        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int count = 0;', role: 'INPUT', order: 2 },
          { blockId: 'java6-f3', code: '        IntPredicate isPrime = val -> {\n            if (val < 2) return false;\n            for (int d = 2; d * d <= val; d++) {\n                if (val % d == 0) return false;\n            }\n            return true;\n        };', role: 'LOGIC', order: 3 },
          { blockId: 'java6-f4', code: '        for (int i = 2; i <= n; i++) {\n            if (isPrime.test(i)) {', role: 'LOGIC', order: 4 },
          { blockId: 'java6-f5', code: '                count++;\n            }\n        }', role: 'LOGIC', order: 5 },
          { blockId: 'java6-f6', code: '        System.out.println(count);\n    }\n}', role: 'OUTPUT', order: 6 },
        ],
        revealOrder: ['java6-f1', 'java6-f2', 'java6-f3', 'java6-f4', 'java6-f5', 'java6-f6'],
        acceptedOrders: [],
      },
      {
        language: 'cpp',
        languageName: 'C++ 17',
        blocks: [
          { blockId: 'cpp6-f1', code: '#include <iostream>\nusing namespace std;\n\nint main() {', role: 'MAIN_WRAPPER', order: 1 },
          { blockId: 'cpp6-f2', code: '    int n;\n    if (!(cin >> n)) return 0;\n    int count = 0;', role: 'INPUT', order: 2 },
          { blockId: 'cpp6-f3', code: '    auto isPrime = [](int val) {\n        if (val < 2) return false;\n        for (int d = 2; d * d <= val; d++) {\n            if (val % d == 0) return false;\n        }\n        return true;\n    };', role: 'LOGIC', order: 3 },
          { blockId: 'cpp6-f4', code: '    for (int i = 2; i <= n; i++) {\n        if (isPrime(i)) {', role: 'LOGIC', order: 4 },
          { blockId: 'cpp6-f5', code: '            count++;\n        }\n    }', role: 'LOGIC', order: 5 },
          { blockId: 'cpp6-f6', code: '    cout << count << endl;\n    return 0;\n}', role: 'OUTPUT', order: 6 },
        ],
        revealOrder: ['cpp6-f1', 'cpp6-f2', 'cpp6-f3', 'cpp6-f4', 'cpp6-f5', 'cpp6-f6'],
        acceptedOrders: [],
      },
      {
        language: 'c',
        languageName: 'C (GCC)',
        blocks: [
          { blockId: 'c6-f1', code: '#include <stdio.h>\n#include <stdbool.h>\n\nint main() {', role: 'MAIN_WRAPPER', order: 1 },
          { blockId: 'c6-f2', code: '    int n;\n    if (scanf("%d", &n) != 1) return 0;\n    int count = 0;', role: 'INPUT', order: 2 },
          { blockId: 'c6-f3', code: '    auto bool isPrime(int val);\n    bool isPrime(int val) {\n        if (val < 2) return false;\n        for (int d = 2; d * d <= val; d++) {\n            if (val % d == 0) return false;\n        }\n        return true;\n    }', role: 'LOGIC', order: 3 },
          { blockId: 'c6-f4', code: '    for (int i = 2; i <= n; i++) {\n        if (isPrime(i)) {', role: 'LOGIC', order: 4 },
          { blockId: 'c6-f5', code: '            count++;\n        }\n    }', role: 'LOGIC', order: 5 },
          { blockId: 'c6-f6', code: '    printf("%d\\n", count);\n    return 0;\n}', role: 'OUTPUT', order: 6 },
        ],
        revealOrder: ['c6-f1', 'c6-f2', 'c6-f3', 'c6-f4', 'c6-f5', 'c6-f6'],
        acceptedOrders: [],
      },
    ],
    tasks: [
      {
        taskId: 'task-1',
        title: 'Task 1: Program Entry & Stream Setup',
        description: 'Complete this task to unlock the program skeleton and standard library imports.',
        order: 1,
        penalty: 20,
        cooldownSeconds: 3,
        rewards: {
          python: 'py6-f1',
          java: 'java6-f1',
          cpp: 'cpp6-f1',
          c: 'c6-f1',
        },
        quizPool: [
          {
            quizId: 'q6-t1-q1',
            type: 'MCQ',
            prompt: 'Which header file or module is typically imported to read standard input in Python and C?',
            options: ['sys in Python, <stdio.h> in C', 'math in Python, <stdlib.h> in C', 'os in Python, <string.h> in C', 'io in Python, <iostream> in C'],
            answer: 0,
            explain: 'Python uses sys (or input()) for standard streams, while C uses <stdio.h> for scanf and standard I/O.',
            concept: 'imports',
          },
          {
            quizId: 'q6-t1-q2',
            type: 'MCQ',
            prompt: 'Why must the main entry point function return an integer in C and C++ (e.g. int main())?',
            options: ['To return an exit status code to the operating system (0 indicating success)', 'To pass command line arguments to other processes', 'To allocate stack memory for local variables', 'To indicate the number of threads used by the runtime'],
            answer: 0,
            explain: 'In C and C++, main returns an exit code where 0 conventionally signals normal/successful termination to the OS.',
            concept: 'main-return',
          },
        ],
      },
      {
        taskId: 'task-2',
        title: 'Task 2: Read Upper Bound Integer N',
        description: 'Complete this task to unlock the standard input extraction block.',
        order: 2,
        penalty: 20,
        cooldownSeconds: 3,
        rewards: {
          python: 'py6-f2',
          java: 'java6-f2',
          cpp: 'cpp6-f2',
          c: 'c6-f2',
        },
        quizPool: [
          {
            quizId: 'q6-t2-q1',
            type: 'MCQ',
            prompt: 'When reading an integer input from standard input in Java, which method of Scanner extracts the next integer token?',
            options: ['nextInt()', 'readInteger()', 'next()', 'parseInt()'],
            answer: 0,
            explain: 'Scanner.nextInt() scans and parses the next token of the input as an int.',
            concept: 'java-input',
          },
          {
            quizId: 'q6-t2-q2',
            type: 'OUTPUT_PREDICTION',
            prompt: 'If standard input contains "  45  \\n  90  ", what integer is stored in N if only the first token is read?',
            options: [],
            answer: '45',
            explain: 'Whitespace and newlines are delimiters; the first integer token parsed is 45.',
            concept: 'input-tokens',
          },
        ],
      },
      {
        taskId: 'task-3',
        title: 'Task 3: Primality Test & Sqrt Optimization',
        description: 'Complete this task to unlock the isPrime testing logic block.',
        order: 3,
        penalty: 20,
        cooldownSeconds: 3,
        rewards: {
          python: 'py6-f3',
          java: 'java6-f3',
          cpp: 'cpp6-f3',
          c: 'c6-f3',
        },
        quizPool: [
          {
            quizId: 'q6-t3-q1',
            type: 'MCQ',
            prompt: 'Why is it sufficient to test divisors only up to sqrt(N) (d * d <= N) when checking whether N is prime?',
            options: [
              'If N has a factor greater than sqrt(N), its corresponding paired factor must be <= sqrt(N)',
              'Because all prime numbers are odd numbers above sqrt(N)',
              'Because the square root is the midpoint of the integer range',
              'It is only a heuristic approximation and fails for large composite numbers',
            ],
            answer: 0,
            explain: 'If N = a * b, at least one factor must satisfy a <= sqrt(N) and b >= sqrt(N). If no factor is found up to sqrt(N), N must be prime.',
            concept: 'sqrt-optimization',
          },
          {
            quizId: 'q6-t3-q2',
            type: 'OUTPUT_PREDICTION',
            prompt: 'Why is the number 1 not considered a prime number? What is the boolean result of isPrime(1)?',
            options: [],
            answer: 'false',
            explain: 'By definition, a prime number is an integer greater than 1 that has exactly two distinct positive divisors: 1 and itself. Thus 1 is not prime.',
            concept: 'prime-definition',
          },
        ],
      },
      {
        taskId: 'task-4',
        title: 'Task 4: Iterate Candidate Numbers (2..N)',
        description: 'Complete this task to unlock the prime iteration loop header.',
        order: 4,
        penalty: 20,
        cooldownSeconds: 3,
        rewards: {
          python: 'py6-f4',
          java: 'java6-f4',
          cpp: 'cpp6-f4',
          c: 'c6-f4',
        },
        quizPool: [
          {
            quizId: 'q6-t4-q1',
            type: 'MCQ',
            prompt: 'In Python, which range expression iterates through all candidate integers from 2 up to and including N?',
            options: ['range(2, n + 1)', 'range(2, n)', 'range(1, n + 1)', 'range(2, n, 2)'],
            answer: 0,
            explain: 'In Python, range(start, stop) is exclusive of stop, so range(2, n + 1) iterates through 2, 3, ..., N.',
            concept: 'loop-range',
          },
          {
            quizId: 'q6-t4-q2',
            type: 'FILL_BLANK',
            prompt: 'In C/C++/Java, which arithmetic operator yields the remainder of integer division to test divisibility (e.g. n ___ d == 0)?',
            options: [],
            answer: ['%', 'mod', 'modulo'],
            explain: 'The % operator computes the remainder of division; if n % d == 0, d divides n evenly.',
            concept: 'modulo-operator',
          },
        ],
      },
      {
        taskId: 'task-5',
        title: 'Task 5: Count Increment & Scope Closure',
        description: 'Complete this task to unlock the counter increment and loop termination block.',
        order: 5,
        penalty: 20,
        cooldownSeconds: 3,
        rewards: {
          python: 'py6-f5',
          java: 'java6-f5',
          cpp: 'cpp6-f5',
          c: 'c6-f5',
        },
        quizPool: [
          {
            quizId: 'q6-t5-q1',
            type: 'OUTPUT_PREDICTION',
            prompt: 'How many prime numbers exist in the range from 2 to 10 inclusive?',
            options: [],
            answer: '4',
            explain: 'The primes between 2 and 10 are 2, 3, 5, and 7 (total of 4 primes).',
            concept: 'prime-count',
          },
          {
            quizId: 'q6-t5-q2',
            type: 'MCQ',
            prompt: 'Which statement increments the integer variable count by 1 in C, C++, and Java?',
            options: ['count++;', 'count**;', 'count += count;', 'increment(count);'],
            answer: 0,
            explain: 'count++ (or ++count or count += 1) increments the integer variable by 1.',
            concept: 'increment-operator',
          },
        ],
      },
      {
        taskId: 'task-6',
        title: 'Task 6: Display Count & Terminate',
        description: 'Complete this task to unlock the result output and program exit block.',
        order: 6,
        penalty: 20,
        cooldownSeconds: 3,
        rewards: {
          python: 'py6-f6',
          java: 'java6-f6',
          cpp: 'cpp6-f6',
          c: 'c6-f6',
        },
        quizPool: [
          {
            quizId: 'q6-t6-q1',
            type: 'MCQ',
            prompt: 'Which format specifier is used with printf in C to output a signed decimal integer followed by a newline?',
            options: ['%d\\n', '%f\\n', '%s\\n', '%c\\n'],
            answer: 0,
            explain: '%d formats a signed integer in decimal representation, and \\n creates a newline.',
            concept: 'c-format-specifier',
          },
          {
            quizId: 'q6-t6-q2',
            type: 'OUTPUT_PREDICTION',
            prompt: 'If N = 20, what single integer is printed to standard output?',
            options: [],
            answer: '8',
            explain: 'The 8 primes <= 20 are 2, 3, 5, 7, 11, 13, 17, 19.',
            concept: 'prime-output-evaluation',
          },
        ],
      },
    ],
  },
  {
    slug: 'ch-07',
    sequenceOrder: 3,
    title: 'Challenge 7 – Longest Increasing Subsequence',
    category: 'Dynamic Programming',
    difficulty: 'Hard',
    points: 300,
    description:
      'Given an integer N followed by an array of N integers from standard input, determine and display the length of the longest strictly increasing subsequence (LIS).\n\nInput: First line contains integer N (1 <= N <= 1000). Second line contains N space-separated integers.\nOutput: A single integer representing the length of the longest strictly increasing subsequence.',
    sampleInput: '6\n5 2 8 6 3 6',
    sampleOutput: '3',
    timeLimitSeconds: 1200,
    supportedLanguages: ['python', 'java', 'cpp', 'c'],
    hiddenTests: [
      { input: '1\n42\n', expectedOutput: '1', description: 'Edge case: single element' },
      { input: '5\n7 7 7 7 7\n', expectedOutput: '1', description: 'All equal elements (strictly increasing length 1)' },
      { input: '5\n10 9 8 7 6\n', expectedOutput: '1', description: 'Strictly decreasing sequence' },
      { input: '5\n1 2 3 4 5\n', expectedOutput: '5', description: 'Strictly increasing sequence' },
      { input: '6\n5 2 8 6 3 6\n', expectedOutput: '3', description: 'Sample case with duplicates' },
      { input: '8\n10 22 9 33 21 50 41 60\n', expectedOutput: '5', description: 'Mixed increasing sequence' },
      { input: '6\n-5 -2 -1 0 4 2\n', expectedOutput: '5', description: 'Negative and positive sequence' },
      { input: '7\n1 3 2 4 3 5 4\n', expectedOutput: '4', description: 'Alternating sequence' },
      { input: '10\n0 8 4 12 2 10 6 14 1 9\n', expectedOutput: '4', description: 'Standard benchmark sequence' },
    ],
    languageConfigs: [
      {
        language: 'python',
        languageName: 'Python 3',
        blocks: [
          { blockId: 'py7-f1', code: 'import sys\n\ndef main():', role: 'MAIN_WRAPPER', order: 1 },
          { blockId: 'py7-f2', code: '    tokens = sys.stdin.read().split()\n    if not tokens:\n        return\n    n = int(tokens[0])', role: 'INPUT', order: 2 },
          { blockId: 'py7-f3', code: '    arr = [int(x) for x in tokens[1:1 + n]]', role: 'INPUT', order: 3 },
          { blockId: 'py7-f4', code: '    dp = [1] * n', role: 'LOGIC', order: 4 },
          { blockId: 'py7-f5', code: '    for i in range(n):', role: 'LOGIC', order: 5 },
          { blockId: 'py7-f6', code: '        for j in range(i):\n            if arr[j] < arr[i] and dp[j] + 1 > dp[i]:\n                dp[i] = dp[j] + 1', role: 'LOGIC', order: 6 },
          { blockId: 'py7-f7', code: '    max_len = 0\n    for val in dp:\n        if val > max_len:\n            max_len = val', role: 'LOGIC', order: 7 },
          { blockId: 'py7-f8', code: '    print(max_len)\n\nif __name__ == \'__main__\':\n    main()', role: 'OUTPUT', order: 8 },
        ],
        revealOrder: ['py7-f1', 'py7-f2', 'py7-f3', 'py7-f4', 'py7-f5', 'py7-f6', 'py7-f7', 'py7-f8'],
        acceptedOrders: [],
      },
      {
        language: 'java',
        languageName: 'Java 17',
        blocks: [
          { blockId: 'java7-f1', code: 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {', role: 'MAIN_WRAPPER', order: 1 },
          { blockId: 'java7-f2', code: '        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();', role: 'INPUT', order: 2 },
          { blockId: 'java7-f3', code: '        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) {\n            arr[i] = sc.nextInt();\n        }', role: 'INPUT', order: 3 },
          { blockId: 'java7-f4', code: '        int[] dp = new int[n];\n        for (int i = 0; i < n; i++) {\n            dp[i] = 1;\n        }', role: 'LOGIC', order: 4 },
          { blockId: 'java7-f5', code: '        for (int i = 0; i < n; i++) {', role: 'LOGIC', order: 5 },
          { blockId: 'java7-f6', code: '            for (int j = 0; j < i; j++) {\n                if (arr[j] < arr[i] && dp[j] + 1 > dp[i]) {\n                    dp[i] = dp[j] + 1;\n                }\n            }\n        }', role: 'LOGIC', order: 6 },
          { blockId: 'java7-f7', code: '        int maxLen = 0;\n        for (int i = 0; i < n; i++) {\n            if (dp[i] > maxLen) maxLen = dp[i];\n        }', role: 'LOGIC', order: 7 },
          { blockId: 'java7-f8', code: '        System.out.println(maxLen);\n    }\n}', role: 'OUTPUT', order: 8 },
        ],
        revealOrder: ['java7-f1', 'java7-f2', 'java7-f3', 'java7-f4', 'java7-f5', 'java7-f6', 'java7-f7', 'java7-f8'],
        acceptedOrders: [],
      },
      {
        language: 'cpp',
        languageName: 'C++ 17',
        blocks: [
          { blockId: 'cpp7-f1', code: '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {', role: 'MAIN_WRAPPER', order: 1 },
          { blockId: 'cpp7-f2', code: '    int n;\n    if (!(cin >> n)) return 0;', role: 'INPUT', order: 2 },
          { blockId: 'cpp7-f3', code: '    vector<int> arr(n);\n    for (int i = 0; i < n; i++) {\n        cin >> arr[i];\n    }', role: 'INPUT', order: 3 },
          { blockId: 'cpp7-f4', code: '    vector<int> dp(n, 1);', role: 'LOGIC', order: 4 },
          { blockId: 'cpp7-f5', code: '    for (int i = 0; i < n; i++) {', role: 'LOGIC', order: 5 },
          { blockId: 'cpp7-f6', code: '        for (int j = 0; j < i; j++) {\n            if (arr[j] < arr[i] && dp[j] + 1 > dp[i]) {\n                dp[i] = dp[j] + 1;\n            }\n        }\n    }', role: 'LOGIC', order: 6 },
          { blockId: 'cpp7-f7', code: '    int maxLen = 0;\n    for (int i = 0; i < n; i++) {\n        if (dp[i] > maxLen) maxLen = dp[i];\n    }', role: 'LOGIC', order: 7 },
          { blockId: 'cpp7-f8', code: '    cout << maxLen << endl;\n    return 0;\n}', role: 'OUTPUT', order: 8 },
        ],
        revealOrder: ['cpp7-f1', 'cpp7-f2', 'cpp7-f3', 'cpp7-f4', 'cpp7-f5', 'cpp7-f6', 'cpp7-f7', 'cpp7-f8'],
        acceptedOrders: [],
      },
      {
        language: 'c',
        languageName: 'C (GCC)',
        blocks: [
          { blockId: 'c7-f1', code: '#include <stdio.h>\n#include <stdlib.h>\n\nint main() {', role: 'MAIN_WRAPPER', order: 1 },
          { blockId: 'c7-f2', code: '    int n;\n    if (scanf("%d", &n) != 1) return 0;', role: 'INPUT', order: 2 },
          { blockId: 'c7-f3', code: '    int *arr = (int *)malloc(sizeof(int) * n);\n    for (int i = 0; i < n; i++) {\n        scanf("%d", &arr[i]);\n    }', role: 'INPUT', order: 3 },
          { blockId: 'c7-f4', code: '    int *dp = (int *)malloc(sizeof(int) * n);\n    for (int i = 0; i < n; i++) {\n        dp[i] = 1;\n    }', role: 'LOGIC', order: 4 },
          { blockId: 'c7-f5', code: '    for (int i = 0; i < n; i++) {', role: 'LOGIC', order: 5 },
          { blockId: 'c7-f6', code: '        for (int j = 0; j < i; j++) {\n            if (arr[j] < arr[i] && dp[j] + 1 > dp[i]) {\n                dp[i] = dp[j] + 1;\n            }\n        }\n    }', role: 'LOGIC', order: 6 },
          { blockId: 'c7-f7', code: '    int maxLen = 0;\n    for (int i = 0; i < n; i++) {\n        if (dp[i] > maxLen) maxLen = dp[i];\n    }', role: 'LOGIC', order: 7 },
          { blockId: 'c7-f8', code: '    printf("%d\\n", maxLen);\n    free(arr);\n    free(dp);\n    return 0;\n}', role: 'OUTPUT', order: 8 },
        ],
        revealOrder: ['c7-f1', 'c7-f2', 'c7-f3', 'c7-f4', 'c7-f5', 'c7-f6', 'c7-f7', 'c7-f8'],
        acceptedOrders: [],
      },
    ],
    tasks: [
      {
        taskId: 'task-1',
        title: 'Task 1: Setup & Environment Entry',
        description: 'Complete this task to unlock the program skeleton and container headers.',
        order: 1,
        penalty: 20,
        cooldownSeconds: 3,
        rewards: {
          python: 'py7-f1',
          java: 'java7-f1',
          cpp: 'cpp7-f1',
          c: 'c7-f1',
        },
        quizPool: [
          {
            quizId: 'q7-t1-q1',
            type: 'MCQ',
            prompt: 'What is the worst-case time complexity of the standard nested-loop dynamic programming approach for Longest Increasing Subsequence of length N?',
            options: ['O(N^2)', 'O(N log N)', 'O(N)', 'O(2^N)'],
            answer: 0,
            explain: 'With an outer loop of size N and an inner loop running up to i, total comparisons are N*(N-1)/2, which is O(N^2).',
            concept: 'time-complexity',
          },
          {
            quizId: 'q7-t1-q2',
            type: 'MCQ',
            prompt: 'Which header in C++ provides the std::vector dynamic array container?',
            options: ['<vector>', '<array>', '<list>', '<algorithm>'],
            answer: 0,
            explain: '#include <vector> defines std::vector.',
            concept: 'cpp-vector',
          },
        ],
      },
      {
        taskId: 'task-2',
        title: 'Task 2: Read Sequence Size N',
        description: 'Complete this task to unlock the input parsing for sequence length.',
        order: 2,
        penalty: 20,
        cooldownSeconds: 3,
        rewards: {
          python: 'py7-f2',
          java: 'java7-f2',
          cpp: 'cpp7-f2',
          c: 'c7-f2',
        },
        quizPool: [
          {
            quizId: 'q7-t2-q1',
            type: 'MCQ',
            prompt: 'In dynamic programming problems where 1 <= N <= 1000, why is an O(N^2) solution acceptable for execution within standard 2-second limits?',
            options: [
              '1000^2 is 1,000,000 operations, which easily finishes in under 0.05 seconds (modern CPUs execute ~10^8 ops/sec)',
              'Because O(N^2) algorithms automatically parallelize across GPU cores',
              'Because the garbage collector optimizes nested loops to O(1)',
              'Because N=1000 guarantees binary search trees are balanced',
            ],
            answer: 0,
            explain: '1 million iterations take only a few milliseconds on standard hardware, well within time limits.',
            concept: 'complexity-budget',
          },
          {
            quizId: 'q7-t2-q2',
            type: 'FILL_BLANK',
            prompt: 'In C, which library function dynamically allocates memory on the heap for an array of integers?',
            options: [],
            answer: ['malloc', 'calloc', 'malloc()'],
            explain: 'malloc(size) allocates uninitialized heap memory of the specified number of bytes.',
            concept: 'memory-allocation',
          },
        ],
      },
      {
        taskId: 'task-3',
        title: 'Task 3: Read Array Elements',
        description: 'Complete this task to unlock the array populating block.',
        order: 3,
        penalty: 20,
        cooldownSeconds: 3,
        rewards: {
          python: 'py7-f3',
          java: 'java7-f3',
          cpp: 'cpp7-f3',
          c: 'c7-f3',
        },
        quizPool: [
          {
            quizId: 'q7-t3-q1',
            type: 'OUTPUT_PREDICTION',
            prompt: 'Given the array sequence [10, 9, 8, 7, 6], what is the length of the longest strictly increasing subsequence?',
            options: [],
            answer: '1',
            explain: 'Since each successive element is strictly smaller than the previous one, any strictly increasing subsequence contains only a single element.',
            concept: 'decreasing-edge-case',
          },
          {
            quizId: 'q7-t3-q2',
            type: 'MCQ',
            prompt: 'What is the difference between a subsequence and a contiguous subarray?',
            options: [
              'A subsequence can be derived by deleting zero or more elements without changing relative order of remaining elements',
              'A subsequence must consist of consecutive adjacent elements in memory',
              'A subsequence requires all elements to be sorted in ascending order in the input',
              'Subarrays can reorder elements arbitrarily whereas subsequences cannot',
            ],
            answer: 0,
            explain: 'A subsequence maintains relative order but does not need to be contiguous, unlike a subarray.',
            concept: 'subsequence-definition',
          },
        ],
      },
      {
        taskId: 'task-4',
        title: 'Task 4: DP Table Initialization',
        description: 'Complete this task to unlock the DP table allocation and baseline init.',
        order: 4,
        penalty: 20,
        cooldownSeconds: 3,
        rewards: {
          python: 'py7-f4',
          java: 'java7-f4',
          cpp: 'cpp7-f4',
          c: 'c7-f4',
        },
        quizPool: [
          {
            quizId: 'q7-t4-q1',
            type: 'MCQ',
            prompt: 'Why is every element of the dp array initialized to 1 at the beginning?',
            options: [
              'Every individual element by itself forms a valid strictly increasing subsequence of length 1',
              'To prevent division by zero in the transition equation',
              'Because 0 is reserved for empty sets',
              'Because dynamic programming arrays must never contain null or zero values',
            ],
            answer: 0,
            explain: 'A single element [a[i]] is trivially an increasing subsequence of length 1.',
            concept: 'dp-initialization',
          },
          {
            quizId: 'q7-t4-q2',
            type: 'OUTPUT_PREDICTION',
            prompt: 'If N = 4 and the input array is [7, 7, 7, 7], what is the final value of the longest strictly increasing subsequence?',
            options: [],
            answer: '1',
            explain: 'Strictly increasing requires a[j] < a[i]. Since all elements are equal, no pair satisfies the condition, so max length remains 1.',
            concept: 'strictly-increasing',
          },
        ],
      },
      {
        taskId: 'task-5',
        title: 'Task 5: Outer DP Loop Iteration',
        description: 'Complete this task to unlock the outer sequence traversal loop.',
        order: 5,
        penalty: 20,
        cooldownSeconds: 3,
        rewards: {
          python: 'py7-f5',
          java: 'java7-f5',
          cpp: 'cpp7-f5',
          c: 'c7-f5',
        },
        quizPool: [
          {
            quizId: 'q7-t5-q1',
            type: 'MCQ',
            prompt: 'In the DP formulation, what does dp[i] represent when the outer loop completes iteration i?',
            options: [
              'The length of the longest strictly increasing subsequence that ends at index i',
              'The total count of all increasing subsequences in the prefix array',
              'The maximum element value observed up to index i',
              'The length of the longest common subsequence between arr and its sorted copy',
            ],
            answer: 0,
            explain: 'dp[i] stores the length of the longest strictly increasing subsequence whose last element is arr[i].',
            concept: 'dp-state-definition',
          },
          {
            quizId: 'q7-t5-q2',
            type: 'OUTPUT_PREDICTION',
            prompt: 'For the input array [1, 3, 2], what is the value of dp[1] after processing index 1?',
            options: [],
            answer: '2',
            explain: 'At index 1 (value 3), arr[0]=1 < arr[1]=3, so dp[1] becomes dp[0] + 1 = 2 (subsequence [1, 3]).',
            concept: 'dp-trace',
          },
        ],
      },
      {
        taskId: 'task-6',
        title: 'Task 6: Inner Subproblem Transition',
        description: 'Complete this task to unlock the inner transition comparison and update.',
        order: 6,
        penalty: 20,
        cooldownSeconds: 3,
        rewards: {
          python: 'py7-f6',
          java: 'java7-f6',
          cpp: 'cpp7-f6',
          c: 'c7-f6',
        },
        quizPool: [
          {
            quizId: 'q7-t6-q1',
            type: 'FILL_BLANK',
            prompt: 'Complete the comparison operator to check strictly increasing condition between previous element a[j] and current element a[i]: if (a[j] ___ a[i])',
            options: [],
            answer: ['<', 'less than'],
            explain: 'For a strictly increasing subsequence, the earlier element a[j] must be strictly less than a[i].',
            concept: 'transition-condition',
          },
          {
            quizId: 'q7-t6-q2',
            type: 'MCQ',
            prompt: 'What is the correct recurrence relation to update dp[i] given an earlier index j < i where arr[j] < arr[i]?',
            options: [
              'dp[i] = max(dp[i], dp[j] + 1)',
              'dp[i] = dp[j] + dp[i]',
              'dp[i] = max(dp[i], arr[j] + arr[i])',
              'dp[i] = dp[j - 1] + 1',
            ],
            answer: 0,
            explain: 'If arr[j] < arr[i], we can extend the increasing subsequence ending at j by appending arr[i], giving length dp[j] + 1.',
            concept: 'bellman-transition',
          },
        ],
      },
      {
        taskId: 'task-7',
        title: 'Task 7: Calculate Maximum LIS Value',
        description: 'Complete this task to unlock the global maximum extraction block.',
        order: 7,
        penalty: 20,
        cooldownSeconds: 3,
        rewards: {
          python: 'py7-f7',
          java: 'java7-f7',
          cpp: 'cpp7-f7',
          c: 'c7-f7',
        },
        quizPool: [
          {
            quizId: 'q7-t7-q1',
            type: 'MCQ',
            prompt: 'Why is the final answer the maximum across ALL entries in dp rather than simply dp[n - 1]?',
            options: [
              'The overall longest increasing subsequence might end at any index, not necessarily the last element',
              'Because dp[n - 1] is overwritten by garbage values during memory cleanup',
              'Because dp[n - 1] only represents decreasing sequences',
              'Because the array must be reversed before finding the minimum',
            ],
            answer: 0,
            explain: 'If the largest element was in the middle of the array, the longest subsequence could end before index n-1.',
            concept: 'dp-result-extraction',
          },
          {
            quizId: 'q7-t7-q2',
            type: 'OUTPUT_PREDICTION',
            prompt: 'For the input sequence [5, 2, 8, 6, 3, 6], what is the length of the longest strictly increasing subsequence?',
            options: [],
            answer: '3',
            explain: 'Subsequences like [2, 5, 6] or [2, 3, 6] have length 3.',
            concept: 'lis-sample-answer',
          },
        ],
      },
      {
        taskId: 'task-8',
        title: 'Task 8: Output Longest Subsequence Length',
        description: 'Complete this task to unlock the result display and memory cleanup block.',
        order: 8,
        penalty: 20,
        cooldownSeconds: 3,
        rewards: {
          python: 'py7-f8',
          java: 'java7-f8',
          cpp: 'cpp7-f8',
          c: 'c7-f8',
        },
        quizPool: [
          {
            quizId: 'q7-t8-q1',
            type: 'MCQ',
            prompt: 'In C, which function must be called to release memory dynamically allocated with malloc before program exit?',
            options: ['free()', 'delete()', 'release()', 'dispose()'],
            answer: 0,
            explain: 'free(ptr) deallocates memory allocated by malloc, preventing memory leaks.',
            concept: 'c-memory-management',
          },
          {
            quizId: 'q7-t8-q2',
            type: 'MCQ',
            prompt: 'Which Java class is used to write formatted output to the standard console stream?',
            options: ['System.out', 'Console.write', 'StdOut.print', 'Runtime.output'],
            answer: 0,
            explain: 'System.out is the standard PrintStream used for console output in Java.',
            concept: 'java-output',
          },
        ],
      },
    ],
  },
];

// ─── MAIN SEED FUNCTION ────────────────────────────────────────────────────

/**
 * Convert chest map + quizzes into server-side tasks.
 * Uses the largest language's chest count (they may differ) to determine total tasks.
 * Each task has a quizPool with proper quizzes from all languages' chest quizPools merged.
 */
function buildTasks(challengeData) {
  if (challengeData.tasks && challengeData.tasks.length > 0) {
    return challengeData.tasks;
  }
  const { chestMap, quizzes } = challengeData;
  if (!chestMap || !quizzes) return [];

  // Determine the maximum number of tasks across all languages
  const maxTasks = Math.max(...Object.values(chestMap).map((chests) => chests.length));
  const tasks = [];

  for (let i = 0; i < maxTasks; i++) {
    const taskId = `task-${i + 1}`;

    // Build rewards map: language -> blockId
    const rewards = {};
    Object.entries(chestMap).forEach(([lang, chests]) => {
      if (chests[i]) {
        rewards[lang] = chests[i].rewardBlock;
      }
    });

    // Collect unique quiz IDs from all languages for this task slot
    const quizIdSet = new Set();
    Object.values(chestMap).forEach((chests) => {
      if (chests[i]) {
        chests[i].quizPool.forEach((qid) => quizIdSet.add(qid));
      }
    });

    // Build quizPool with full quiz data
    const quizPool = [];
    quizIdSet.forEach((qid) => {
      const q = quizzes[qid];
      if (!q) return;
      quizPool.push({
        quizId: qid,
        type: QUIZ_TYPE_MAP[q.type] || 'MCQ',
        prompt: q.prompt,
        options: q.options || [],
        answer: q.answer,
        explain: q.explain || '',
        concept: q.concept || '',
      });
    });

    tasks.push({
      taskId,
      title: `Task ${i + 1}`,
      description: `Complete this task to unlock code block ${i + 1}`,
      order: i + 1,
      quizPool,
      rewards,
      penalty: 20,
      cooldownSeconds: 3,
    });
  }

  return tasks;
}

async function seed() {
  console.log('[Seed] Connecting to MongoDB...');
  await mongoose.connect(env.MONGO_URI, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  });
  console.log('[Seed] Connected.');

  for (const cd of CHALLENGES_DATA) {
    console.log(`\n[Seed] Processing: ${cd.title}`);

    const tasks = buildTasks(cd);
    console.log(`  → Generated ${tasks.length} tasks`);

    // Build challenge document
    const challengeDoc = {
      title: cd.title,
      slug: cd.slug,
      sequenceOrder: cd.sequenceOrder,
      category: cd.category,
      difficulty: cd.difficulty,
      points: cd.points,
      description: cd.description,
      sampleInput: cd.sampleInput,
      sampleOutput: cd.sampleOutput,
      timeLimitSeconds: cd.timeLimitSeconds,
      supportedLanguages: cd.supportedLanguages,
      status: 'Published',
      isActive: true,
      tasks,
      languageConfigs: cd.languageConfigs,
      blockConfig: {
        totalBlocks: Math.max(...cd.languageConfigs.map((lc) => lc.blocks.length)),
        revealMode: 'task',
        randomizeOrder: true,
      },
    };

    // Upsert by slug
    const existing = await Challenge.findOne({ slug: cd.slug });
    let challenge;
    if (existing) {
      challenge = await Challenge.findByIdAndUpdate(existing._id, challengeDoc, { new: true });
      console.log(`  → Updated existing challenge (${existing._id})`);
    } else {
      challenge = await Challenge.create(challengeDoc);
      console.log(`  → Created new challenge (${challenge._id})`);
    }

    // Upsert test cases
    await TestCase.deleteMany({ challengeId: challenge._id });
    if (cd.hiddenTests && cd.hiddenTests.length > 0) {
      const testDocs = cd.hiddenTests.map((t, idx) => ({
        challengeId: challenge._id,
        input: t.input,
        expectedOutput: t.expectedOutput,
        isHidden: true,
        weight: 20,
        isEnabled: true,
        orderIndex: idx,
        description: t.description || '',
      }));
      await TestCase.insertMany(testDocs);
      console.log(`  → Seeded ${testDocs.length} test cases`);
    }

    // Upsert QR Blocks across all language configs
    await QRBlock.deleteMany({
      $or: [{ challengeId: challenge._id }, { challengeId: challenge.slug }],
    });

    const qrBlockDocs = [];
    if (Array.isArray(cd.languageConfigs)) {
      for (const lc of cd.languageConfigs) {
        if (Array.isArray(lc.blocks)) {
          lc.blocks.forEach((block, idx) => {
            const token = generateQRToken(challenge._id, block.blockId, lc.language);
            qrBlockDocs.push({
              challengeId: challenge._id,
              blockId: block.blockId,
              title: `${challenge.title} - ${lc.language.toUpperCase()} Block ${block.order || idx + 1}`,
              language: lc.language,
              code: block.code,
              codeSnippet: block.code,
              type: block.role || 'LOGIC',
              blockType: block.role || 'LOGIC',
              isDecoy: !!block.isDecoy,
              correctOrder: block.order || idx + 1,
              originalOrder: block.order || idx + 1,
              displayOrder: lc.revealOrder ? lc.revealOrder.indexOf(block.blockId) + 1 : idx + 1,
              qrToken: token,
              qrHash: token,
            });
          });
        }
      }
    }

    if (qrBlockDocs.length > 0) {
      await QRBlock.insertMany(qrBlockDocs);
      console.log(`  → Seeded ${qrBlockDocs.length} QR blocks for ${cd.languageConfigs.length} languages`);
    }

    console.log(`  ✓ Done: ${challenge.title}`);
  }

  console.log('\n[Seed] All challenges seeded successfully!');
  if (require.main === module) {
    await mongoose.disconnect();
    process.exit(0);
  }
}

if (require.main === module) {
  seed().catch((err) => {
    console.error('[Seed] Error:', err);
    process.exit(1);
  });
}

module.exports = seed;
module.exports.CHALLENGES_DATA = CHALLENGES_DATA;
