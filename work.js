const { GoogleGenerativeAI } = require("@google/generative-ai");
const readline = require('readline');

// Gemini API 키 설정
const API_KEY = "AIzaSyB1m7RmjoJx2VV0aMj88PVUkP0xUIQvqik";

// Gemini API 초기화
const genAI = new GoogleGenerativeAI(API_KEY);

// 단어 목록을 저장할 배열
let wordList = [];

// Gemini를 사용하여 단어 생성
async function generateWords() {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
  토익에 많이 사용되는 중급 수준 이상의 한글 단어 50개 생성하고
  한글 단어에 해당하는 모든 영어 단어를 생성하여 
  다음 형식으로 생성해주세요:
  한글 단어: [한글 단어 1개]
  영어 단어: [영어 단어1, 영어 단어2, ...]
  
  조건:
  1. 한글 단어는 반드시 1개만 제시해주세요.
  2. 한글 단어에 해당하는 모든 영어 단어를 포함해주세요.
  3. 고유명사 및 대문자 표기 단어 제외한  영어 단어는 소문자로 작성해주세요.
  4. 각 항목을 줄바꿈으로 구분해주세요.
  5. 총 50개의 단어 쌍을 생성해주세요.
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  // 생성된 텍스트를 파싱하여 wordList 배열에 저장
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i += 3) {
    if (lines[i] && lines[i+1]) {
      const korWord = lines[i].split(': ')[1];
      const engWords = lines[i+1].split(': ')[1].split(', ');
      if (korWord && engWords.length > 0) {
        wordList.push({ korean: korWord.trim(), english: engWords.map(word => word.trim()) });
      }
    }
  }
}

// 화면 지우기 함수
function clearScreen() {
  console.clear();
}

// 퀴즈 실행
async function runQuiz() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // ESC 키 입력 감지를 위한 설정
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', (key) => {
    if (key.toString() === '\u001b') { // ESC 키의 ASCII 코드
      console.log('\n프로그램을 종료합니다.');
      process.exit(0);
    }
  });

  let score = 0;
  const totalQuestions = wordList.length;

  for (let i = 0; i < totalQuestions; i++) {
    let answered = false;

    while (!answered) {
      clearScreen();
      const currentWord = wordList[i];
      console.log(`문제 ${i+1}/${totalQuestions}`);
      console.log(`한글 단어: ${currentWord.korean}`);

      const userAnswer = await new Promise(resolve => {
        rl.question('영어 단어를 입력하세요 (또는 Enter를 눌러 답을 확인, ESC를 눌러 종료): ', answer => {
          resolve(answer.trim().toLowerCase());
        });
      });

      if (userAnswer === '') {
        console.log(`정답: ${currentWord.english.join(', ')}`);
        console.log('Enter를 눌러 문제 다시 풀기');
        await new Promise(resolve => rl.question('', resolve));
      } else if (currentWord.english.includes(userAnswer)) {
        console.log('정답입니다!');
        console.log(`모든 가능한 답: ${currentWord.english.join(', ')}`);
        score++;
        console.log('Enter를 눌러 다음 문제로 넘어가기');
        await new Promise(resolve => rl.question('', resolve));
        answered = true;
      } else {
        console.log('오답입니다. 다시 시도해보세요.');
        await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5초 대기
      }
    }
  }

  console.log(`\n퀴즈가 종료되었습니다. 점수: ${score}/${totalQuestions}`);
  rl.close();
  process.exit(0);
}

// 메인 함수
async function main() {
  console.log('단어를 생성 중입니다. 잠시만 기다려주세요...');
  await generateWords();
  console.log('단어 생성이 완료되었습니다. 퀴즈를 시작합니다.');
  console.log('ESC 키를 누르면 언제든지 프로그램을 종료할 수 있습니다.');
  await runQuiz();
}

main();
