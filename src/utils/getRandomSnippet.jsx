const codeSnippets = [
  "const fetchData = async () => {",
  "const response = await fetch(url);",
  "const data = await response.json();",
  "return data;",
  "}",
  "function sum(a, b) { return a + b; }",
  "for(let i=0; i<10; i++) { console.log(i); }",
  "// TODO: optimize this function",
  "let user = { name: 'admin', role: 'superuser' };",
  "if(isAuthenticated) { navigate('/dashboard'); }",
];

export function getRandomSnippet() {
  const index = Math.floor(Math.random() * codeSnippets.length);
  return codeSnippets[index];
}
