import { getSnippetType, escapeHtml, getFriendlyAuthError } from '../src/utils.js';

const tests = [
  {
    name: "getSnippetType detects links",
    fn: () => {
      const result = getSnippetType("https://google.com");
      if (result !== 'link') throw new Error(`Expected link, got ${result}`);
    }
  },
  {
    name: "getSnippetType detects code",
    fn: () => {
      const result = getSnippetType("const x = () => {}");
      if (result !== 'code') throw new Error(`Expected code, got ${result}`);
    }
  },
  {
    name: "getSnippetType detects text",
    fn: () => {
      const result = getSnippetType("Hello world");
      if (result !== 'text') throw new Error(`Expected text, got ${result}`);
    }
  },
  {
    name: "escapeHtml escapes dangerous chars",
    fn: () => {
      const result = escapeHtml("<script>alert('xss')</script>");
      if (result.includes('<') || result.includes('>')) throw new Error(`HTML not escaped properly: ${result}`);
    }
  },
  {
    name: "getFriendlyAuthError formats errors",
    fn: () => {
      const result = getFriendlyAuthError("auth/invalid-email");
      if (result !== "invalid email") throw new Error(`Expected 'invalid email', got '${result}'`);
    }
  }
];

let passed = 0;
let failed = 0;

console.log("🧪 Running Unit Tests...");

tests.forEach(test => {
  try {
    test.fn();
    console.log(`✅ PASSED: ${test.name}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAILED: ${test.name}`);
    console.error(`   ${err.message}`);
    failed++;
  }
});

console.log(`\n📊 Summary: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
  process.exit(1);
}
